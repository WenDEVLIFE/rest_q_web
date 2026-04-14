"use client";

import React, { useState } from 'react';
import { Building2, Globe, MapPin, Phone, Save } from 'lucide-react';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import type { FacilityInput, FacilityRecord } from '../../src/types/facility';

interface FacilityFormProps {
  initialData?: FacilityRecord;
  onSubmit: (data: FacilityInput) => Promise<void>;
  isLoading: boolean;
}

export const FacilityForm = ({ initialData, onSubmit, isLoading }: FacilityFormProps) => {
  const [validationError, setValidationError] = useState('');
  const [formData, setFormData] = useState({
    Name: initialData?.Name || '',
    Latitude: initialData?.Latitude.toString() || '',
    Longitude: initialData?.Longitude.toString() || '',
    'Establishment Type': initialData?.['Establishment Type'] || 'Government Office',
    Phone: initialData?.Phone || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const latitude = Number(formData.Latitude);
    const longitude = Number(formData.Longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setValidationError('Latitude and longitude must be valid numbers.');
      return;
    }

    setValidationError('');
    await onSubmit({
      Name: formData.Name.trim(),
      Latitude: latitude,
      Longitude: longitude,
      'Establishment Type': formData['Establishment Type'] as FacilityInput['Establishment Type'],
      Phone: formData.Phone.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-inter">
      <div className="space-y-4">
        <Input
          label="Facility Name"
          placeholder="City Disaster Risk Reduction and Management Office"
          value={formData.Name}
          onChange={(e) => setFormData((prev) => ({ ...prev, Name: e.target.value }))}
          leftIcon={<Building2 className="w-5 h-5" />}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Latitude"
            type="number"
            step="any"
            placeholder="15.05897857"
            value={formData.Latitude}
            onChange={(e) => setFormData((prev) => ({ ...prev, Latitude: e.target.value }))}
            leftIcon={<MapPin className="w-5 h-5" />}
            required
          />

          <Input
            label="Longitude"
            type="number"
            step="any"
            placeholder="120.646035"
            value={formData.Longitude}
            onChange={(e) => setFormData((prev) => ({ ...prev, Longitude: e.target.value }))}
            leftIcon={<Globe className="w-5 h-5" />}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Establishment Type</label>
          <div className="relative group">
            <select
              value={formData['Establishment Type']}
              onChange={(e) => setFormData((prev) => ({ ...prev, 'Establishment Type': e.target.value as FacilityInput['Establishment Type'] }))}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all appearance-none"
            >
              <option value="Government Office">Government Office</option>
              <option value="Healthcare Facility">Healthcare Facility</option>
              <option value="Emergency Service">Emergency Service</option>
            </select>
          </div>
        </div>

        <Input
          label="Phone Number"
          placeholder="(045) 961-2313 / 0923-235-9725"
          value={formData.Phone}
          onChange={(e) => setFormData((prev) => ({ ...prev, Phone: e.target.value }))}
          leftIcon={<Phone className="w-5 h-5" />}
          helperText="Separate multiple numbers with a slash if needed."
        />

        {validationError && (
          <p className="text-xs font-bold text-emergency">{validationError}</p>
        )}
      </div>

      <div className="pt-4 border-t border-slate-100">
        <Button
          type="submit"
          isLoading={isLoading}
          className="w-full"
          size="lg"
          rightIcon={<Save className="w-5 h-5" />}
        >
          {initialData ? 'Update Facility' : 'Create Facility'}
        </Button>
      </div>
    </form>
  );
};