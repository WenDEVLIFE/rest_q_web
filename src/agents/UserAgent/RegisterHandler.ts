import { 
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../data/firebase";
/**
 * UserAgent: RegisterHandler
 * 
 * Responsibilities:
 * - Complete user registration in Firebase Auth
 * - Create user profiles in Firestore with roles
 */
export class RegisterHandler {
  /**
   * Completes registration after OTP verification
   */
  static async register(
    email: string, 
    password: string, 
    name: string
  ): Promise<any> {
    try {
      // 1. Create User in Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Update Auth Profile
      await updateProfile(user, { displayName: name });

      // 3. Create Firestore Document with default role
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: name,
        email: email,
        role: "user", // Default role
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        status: "active"
      });

      return user;
    } catch (error) {
      console.error("Registration Finalization Error:", error);
      throw error;
    }
  }
}
