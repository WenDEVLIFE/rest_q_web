import { Timestamp } from "firebase/firestore";

export interface UserRecord {
  uid: string;
  displayName: string;
  email: string;
  createdAt: Timestamp;
  lastLogin: Timestamp;
  role: 'user' | 'admin' ;
  status: 'active' | 'inactive' | 'suspended';
}