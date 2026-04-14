"use client";

import { useEffect, useState } from 'react';
import type { FacilityRecord } from '../types/facility';
import { subscribeToFacilities } from '../service/Facility_Service';

export const useFacilities = () => {
  const [facilities, setFacilities] = useState<FacilityRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToFacilities(
      (nextFacilities) => {
        setFacilities(nextFacilities);
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return { facilities, loading };
};