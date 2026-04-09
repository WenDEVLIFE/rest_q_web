import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../data/firebase";
import { CreateIncidentInput, Incident, IncidentStatus } from "../types/incident";

const INCIDENTS_COLLECTION = "incidents";

const normalizeIncident = (id: string, raw: Record<string, unknown>): Incident => {
  const timestampRaw = raw.timestamp;
  const timestamp = timestampRaw instanceof Timestamp ? timestampRaw : Timestamp.now();

  return {
    id,
    type: (raw.type as Incident["type"]) ?? "other",
    location: {
      lat: Number((raw.location as Incident["location"] | undefined)?.lat ?? 0),
      lng: Number((raw.location as Incident["location"] | undefined)?.lng ?? 0),
      address: String((raw.location as Incident["location"] | undefined)?.address ?? "Unknown location"),
    },
    reporter: String(raw.reporter ?? "Anonymous"),
    timestamp,
    status: (raw.status as IncidentStatus) ?? "pending",
    description: String(raw.description ?? ""),
    severity: (raw.severity as Incident["severity"]) ?? "medium",
  };
};

export const createIncidentReport = async (input: CreateIncidentInput): Promise<string> => {
  const created = await addDoc(collection(db, INCIDENTS_COLLECTION), {
    ...input,
    status: "pending" as IncidentStatus,
    timestamp: serverTimestamp(),
  });
  return created.id;
};

export const subscribeToIncidents = (
  callback: (incidents: Incident[]) => void,
  onError?: (error: Error) => void,
) => {
  const incidentsQuery = query(collection(db, INCIDENTS_COLLECTION), orderBy("timestamp", "desc"));

  return onSnapshot(
    incidentsQuery,
    (snapshot) => {
      const incidents = snapshot.docs.map((entry) => normalizeIncident(entry.id, entry.data()));
      callback(incidents);
    },
    (error) => {
      onError?.(error as Error);
    },
  );
};

export const subscribeToOpenIncidents = (
  callback: (incidents: Incident[]) => void,
  onError?: (error: Error) => void,
) => {
  return subscribeToIncidents(
    (incidents) => callback(incidents.filter((item) => item.status === "pending")),
    onError,
  );
};

export const subscribeToAllIncidents = (
  callback: (incidents: Incident[]) => void,
  onError?: (error: Error) => void,
) => {
  return subscribeToIncidents(
    (incidents) => callback(incidents.filter((item) => item.status !== "resolved")),
    onError,
  );
};

export const subscribeToCompleteHistory = (
  callback: (incidents: Incident[]) => void,
  onError?: (error: Error) => void,
) => {
  return subscribeToIncidents(callback, onError);
};

export const updateIncidentStatus = async (id: string, status: IncidentStatus): Promise<void> => {
  await updateDoc(doc(db, INCIDENTS_COLLECTION, id), { status });
};

export const removeIncidentById = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, INCIDENTS_COLLECTION, id));
};
