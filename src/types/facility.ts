import { Timestamp } from 'firebase/firestore';

export type FacilityType = 'Government Office' | 'Healthcare Facility' | 'Emergency Service';

export interface FacilityRecord {
  id: string;
  Name: string;
  Latitude: number;
  Longitude: number;
  'Establishment Type': FacilityType;
  Phone?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type FacilityInput = Omit<FacilityRecord, 'id'>;