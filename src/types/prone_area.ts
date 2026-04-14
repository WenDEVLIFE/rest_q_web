import { Timestamp } from "firebase/firestore";

export type ProneAreaCategory = 'Accident' | 'Flood' | 'Fire' | 'Other';
export type ProneAreaStatus = 'Fixed' | 'Unfixed';

export interface ProneArea {
  id?: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  status: ProneAreaStatus;
  category: ProneAreaCategory;
  notes: string;
  updatedAt: Timestamp | Date;
}
