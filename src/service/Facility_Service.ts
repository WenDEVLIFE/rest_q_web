import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../data/firebase';
import type { FacilityInput, FacilityRecord } from '../types/facility';

const FACILITIES_COLLECTION = 'facilities';

const normalizeFacility = (id: string, raw: Record<string, unknown>): FacilityRecord => ({
  id,
  Name: String(raw.Name ?? 'Unnamed Facility'),
  Latitude: Number(raw.Latitude ?? 0),
  Longitude: Number(raw.Longitude ?? 0),
  'Establishment Type': (raw['Establishment Type'] as FacilityRecord['Establishment Type']) ?? 'Government Office',
  Phone: String(raw.Phone ?? ''),
  createdAt: raw.createdAt as FacilityRecord['createdAt'],
  updatedAt: raw.updatedAt as FacilityRecord['updatedAt'],
});

export const getFacilities = async (): Promise<FacilityRecord[]> => {
  const snapshot = await getDocs(query(collection(db, FACILITIES_COLLECTION), orderBy('Name', 'asc')));
  return snapshot.docs.map((entry) => normalizeFacility(entry.id, entry.data()));
};

export const subscribeToFacilities = (
  callback: (facilities: FacilityRecord[]) => void,
  onError?: (error: Error) => void,
) => {
  const facilitiesQuery = query(collection(db, FACILITIES_COLLECTION), orderBy('Name', 'asc'));
  const unsubscribeSnapshot = onSnapshot(
    facilitiesQuery,
    (snapshot) => {
      callback(snapshot.docs.map((entry) => normalizeFacility(entry.id, entry.data())));
    },
    (error) => {
      onError?.(error as Error);
    },
  );

  return () => {
    unsubscribeSnapshot();
  };
};

export const addFacility = async (facility: FacilityInput): Promise<string> => {
  const created = await addDoc(collection(db, FACILITIES_COLLECTION), {
    ...facility,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return created.id;
};

export const updateFacility = async (id: string, facility: FacilityInput): Promise<void> => {
  await updateDoc(doc(db, FACILITIES_COLLECTION, id), {
    ...facility,
    updatedAt: serverTimestamp(),
  } as Record<string, unknown>);
};

export const deleteFacility = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, FACILITIES_COLLECTION, id));
};