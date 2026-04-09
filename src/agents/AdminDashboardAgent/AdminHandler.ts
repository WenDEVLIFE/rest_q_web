import { 
  collection, 
  getDocs, 
  doc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  Timestamp,
  where
} from "firebase/firestore";
import { db } from "../../data/firebase";
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
} from "firebase/auth";
import { Incident } from "../../types/incident";
import { removeIncidentById, subscribeToIncidents as subscribeToIncidentStream, updateIncidentStatus } from "../../service/Incident_Service";

// Secondary App Configuration for External User Creation
// This prevents the Admin from being signed out during user registration.
const secondaryFirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const getSecondaryAuth = () => {
  const secondaryApp = getApps().find(app => app.name === 'SecondaryAdminApp') 
    || initializeApp(secondaryFirebaseConfig, 'SecondaryAdminApp');
  return getAuth(secondaryApp);
};

export interface TrafficStats {
  timestamp: string;
  volume: number;
  speed: number;
  occupancy: number;
}

export interface UserRecord {
  uid: string;
  displayName: string;
  email: string;
  createdAt: Timestamp;
  lastLogin: Timestamp;
  role: 'user' | 'admin' ;
  status: 'active' | 'inactive' | 'suspended';
}

/**
* AdminDashboardAgent: AdminHandler
* 
* Responsibilities:
* - Fetch and manage reported incidents
* - Verify or remove incidents
* - Retrieve traffic analytics data
*/
export class AdminHandler {
  private static COLLECTION_NAME = "incidents";
  private static USERS_COLLECTION = "users";

  /**
  * Fetches all incidents from Firestore
  */
  static async getIncidents(): Promise<Incident[]> {
    try {
      const q = query(collection(db, this.COLLECTION_NAME), orderBy("timestamp", "desc"));
      const snapshot = await getDocs(q);
      const incidents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Incident, 'id'>)
      }));
      return incidents.length > 0 ? incidents : this.getMockIncidents();
    } catch (error) {
      console.error("Error fetching incidents:", error);
      // Return mock data if collection doesn't exist yet
      return this.getMockIncidents();
    }
  }

  /**
  * Updates an incident's verification status
  */
  static async verifyIncident(id: string): Promise<void> {
    try {
      await updateIncidentStatus(id, 'verified');
    } catch (error) {
      console.error("Error verifying incident:", error);
      throw error;
    }
  }

  /**
  * Removes an incident (e.g. false report)
  */
  static async removeIncident(id: string): Promise<void> {
    try {
      await removeIncidentById(id);
    } catch (error) {
      console.error("Error removing incident:", error);
      throw error;
    }
  }

  /**
  * Subscribes to incident updates in real-time
  */
  static subscribeToIncidents(
    callback: (incidents: Incident[]) => void,
    onError?: (error: Error) => void,
  ): () => void {
    return subscribeToIncidentStream(callback, onError);
  }

  /**
  * Fetches traffic analytics data
  */
  static async getTrafficAnalytics(): Promise<TrafficStats[]> {
    // For now, return mock data for the UI
    return [
      { timestamp: '08:00', volume: 450, speed: 65, occupancy: 12 },
      { timestamp: '10:00', volume: 820, speed: 42, occupancy: 28 },
      { timestamp: '12:00', volume: 680, speed: 55, occupancy: 22 },
      { timestamp: '14:00', volume: 740, speed: 48, occupancy: 25 },
      { timestamp: '16:00', volume: 980, speed: 32, occupancy: 35 },
      { timestamp: '18:00', volume: 1100, speed: 28, occupancy: 42 },
    ];
  }

  /**
  * Fetches all registered users from Firestore
  */
  static async getUsers(): Promise<UserRecord[]> {
    try {
      const q = query(collection(db, this.USERS_COLLECTION), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const users = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...(doc.data() as Omit<UserRecord, 'uid'>)
      }));
      return users.length > 0 ? users : this.getMockUsers();
    } catch (error) {
      console.error("Error fetching users:", error);
      return this.getMockUsers();
    }
  }

  /**
  * Adds a new user record to Firestore and Registers them in Firebase Auth
  */
  static async addUser(user: Omit<UserRecord, 'uid' | 'createdAt' | 'lastLogin'> & { password?: string }): Promise<string> {
    try {
      if (!user.password) throw new Error("Password is required for registration.");

      // 1. Duplicate Check (Firestore-based)
      const existingUserQuery = query(
        collection(db, this.USERS_COLLECTION), 
        where("email", "==", user.email.toLowerCase())
      );
      const snapshot = await getDocs(existingUserQuery);
      if (!snapshot.empty) {
        throw new Error("A user with this email already exists in the system.");
      }

      // 2. Register in Firebase Auth (via Secondary App)
      const secondaryAuth = getSecondaryAuth();
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, user.email, user.password);
      const authUser = userCredential.user;

      // 3. Update Auth Profile
      await updateProfile(authUser, { displayName: user.displayName });

      // 4. Create Firestore Document
      const userRef = doc(db, this.USERS_COLLECTION, authUser.uid);
      const newUser = {
        uid: authUser.uid,
        displayName: user.displayName,
        email: user.email.toLowerCase(),
        role: user.role,
        status: user.status,
        createdAt: Timestamp.now(),
        lastLogin: Timestamp.now(),
      };
      
      await setDoc(userRef, newUser);

      // 5. Sign out from secondary session immediately
      await signOut(secondaryAuth);

      return authUser.uid;
    } catch (error: any) {
      console.error("Error adding user:", error);
      
      // Handle Firebase Auth Errors specifically
      if (error.code === 'auth/email-already-in-use') {
        throw new Error("This email is already registered in Firebase Authentication.");
      } else if (error.code === 'auth/weak-password') {
        throw new Error("The password provided is too weak (min 6 characters).");
      } else if (error.code === 'auth/invalid-email') {
        throw new Error("The email address is invalid.");
      }
      
      throw error;
    }
  }

  /**
  * Updates an existing user record
  */
  static async updateUser(uid: string, data: Partial<UserRecord>): Promise<void> {
    try {
      const userRef = doc(db, this.USERS_COLLECTION, uid);
      await updateDoc(userRef, data as any);
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  /**
  * Deletes a user record
  */
  static async deleteUser(uid: string): Promise<void> {
    try {
      const userRef = doc(db, this.USERS_COLLECTION, uid);
      await deleteDoc(userRef);
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  /**
  * Mock data for users
  */
  private static getMockUsers(): UserRecord[] {
    return [
      {
        uid: "HfFGe4cmngXMTnsiPThOCxhuE1q1",
        displayName: "Admin",
        email: "wwen485@gmail.com",
        createdAt: Timestamp.now(),
        lastLogin: Timestamp.now(),
        role: "admin",
        status: "active"
      },
      {
        uid: "user_2",
        displayName: "John Doe",
        email: "john@res-q.org",
        createdAt: Timestamp.now(),
        lastLogin: Timestamp.now(),
        role: "user",
        status: "active"
      }
    ];
  }

  /**
  * Mock data for UI development
  */
  private static getMockIncidents(): Incident[] {
    return [
      {
        id: '1',
        type: 'accident',
        location: { lat: 14.5995, lng: 120.9842, address: 'Ayala Blvd, Manila' },
        reporter: 'Officer Santos',
        timestamp: Timestamp.now(),
        status: 'pending',
        description: 'Multi-vehicle collision near intersection.',
        severity: 'high'
      },
      {
        id: '2',
        type: 'hazard',
        location: { lat: 14.5888, lng: 121.0560, address: 'EDSA Northbound' },
        reporter: 'Citizen Report',
        timestamp: Timestamp.now(),
        status: 'verified',
        description: 'Large pothole in middle lane.',
        severity: 'medium'
      }
    ];
  }
}
