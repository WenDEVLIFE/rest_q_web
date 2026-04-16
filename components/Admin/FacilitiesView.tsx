"use client";

import React, { useMemo, useState } from 'react';
import { AlertCircle, Building2, Edit3, MapPin, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog } from '../UI/AlertDialog';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { FacilityForm } from './FacilityForm';
import { useFacilities } from '../../src/hooks/useFacilities';
import type { FacilityInput, FacilityRecord } from '../../src/types/facility';
import { addFacility, deleteFacility, updateFacility } from '../../src/service/Facility_Service';

export const FacilitiesView = () => {
  const { facilities, loading } = useFacilities();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<FacilityRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredFacilities = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return facilities.filter((facility) => (
      facility.Name.toLowerCase().includes(term) ||
      facility['Establishment Type'].toLowerCase().includes(term) ||
      (facility.Phone || '').toLowerCase().includes(term)
    ));
  }, [facilities, searchTerm]);

  const handleCreateFacility = () => {
    setEditingFacility(null);
    setIsModalOpen(true);
  };

  const handleEditFacility = (facility: FacilityRecord) => {
    setEditingFacility(facility);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData: FacilityInput) => {
    setIsSubmitting(true);
    try {
      if (editingFacility) {
        await updateFacility(editingFacility.id, formData);
        toast.success('Facility updated successfully.');
      } else {
        await addFacility(formData);
        toast.success('Facility added successfully.');
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Unable to save facility.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setPendingDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;

    setIsDeleting(true);
    try {
      await deleteFacility(pendingDeleteId);
      toast.success('Facility removed.');
      setDeleteConfirmOpen(false);
    } catch (error) {
      toast.error('Unable to remove facility.');
    } finally {
      setIsDeleting(false);
      setPendingDeleteId(null);
    }
  };

  return (
    <div className="space-y-6 flex-1 w-full animate-in fade-in duration-500 font-inter">
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-black tracking-tight text-slate-900">Facilities Management</h2>
          </div>
          <p className="text-sm font-bold text-slate-400">Managed facilities: <span className="text-slate-900">{facilities.length}</span></p>
        </div>

        <div className="flex w-full md:w-auto flex-wrap items-center gap-3">
          <Button onClick={handleCreateFacility} className="shadow-md shadow-primary/10" leftIcon={<Plus className="w-4 h-4" />}>
            Add Facility
          </Button>
          <div className="relative group flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search facilities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-80 pl-9 pr-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all"
            />
          </div>
          <button type="button" disabled className="p-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-300 cursor-default" title="Realtime data updates automatically">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="py-4 pl-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Facility Details</th>
                <th className="py-4 px-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Type</th>
                <th className="py-4 px-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Coordinates</th>
                <th className="py-4 px-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Contact</th>
                <th className="py-4 pr-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse border-b border-slate-100 last:border-0">
                    <td colSpan={5} className="py-12 px-6">
                      <div className="h-4 bg-slate-100 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : filteredFacilities.length > 0 ? (
                filteredFacilities.map((facility) => (
                  <tr key={facility.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                    <td className="py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200">
                          <MapPin className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-sm font-black text-slate-900">{facility.Name}</span>
                          <p className="text-[10px] font-mono font-bold text-slate-300 mt-1 uppercase tracking-tighter">ID: {facility.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                        {facility['Establishment Type']}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-700 font-mono">{facility.Latitude.toFixed(6)}</p>
                        <p className="text-xs font-bold text-slate-700 font-mono">{facility.Longitude.toFixed(6)}</p>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <p className="text-xs font-bold text-slate-600">{facility.Phone || 'No phone on file'}</p>
                    </td>

                    <td className="py-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditFacility(facility)}
                          className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors border border-transparent hover:border-primary/10"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(facility.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-slate-50 rounded-full">
                        <AlertCircle className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-sm font-bold text-slate-400">No facilities found matching your search.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFacility ? 'Edit Facility' : 'Add Facility'}
      >
        <FacilityForm
          initialData={editingFacility || undefined}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </Modal>

      <AlertDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Facility?"
        description="This action will permanently remove the facility from the database. This cannot be undone."
        confirmLabel="Delete Facility"
      />
    </div>
  );
};