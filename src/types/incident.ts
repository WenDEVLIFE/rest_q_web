import { Timestamp } from "firebase/firestore";

export type IncidentType = "accident" | "closure" | "hazard" | "other" | "fire" | "health";
export type IncidentStatus = "pending" | "verified" | "resolved";

export interface IncidentLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface Incident {
  id: string;
  type: IncidentType;
  location: IncidentLocation;
  reporter: string;
  timestamp: Timestamp;
  status: IncidentStatus;
  description: string;
  severity: "low" | "medium" | "high";
}

export interface CreateIncidentInput {
  type: IncidentType;
  location: IncidentLocation;
  reporter: string;
  description: string;
  severity: "low" | "medium" | "high";
}
