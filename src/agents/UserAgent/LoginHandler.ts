import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  UserCredential
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../data/firebase";

/**
 * UserAgent: LoginHandler
 * 
 * Responsibilities:
 * - Handle secure login/logout
 * - Process user registration
 * - Manage password recovery requests
 */
export class LoginHandler {
  /**
   * Performs standard email/password login
   */
  static async login(email: string, password: string): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetches the user profile from Firestore
   */
  static async getUserProfile(uid: string) {
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }

  /**
   * Creates a new user account
   */
  static async register(email: string, password: string): Promise<UserCredential> {
    try {
      return await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logs out the current user session
   */
  static async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sends a password reset email
   */
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  }
}
