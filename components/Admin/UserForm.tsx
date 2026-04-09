"use client";

import React, { useState } from 'react';
import { User, Mail, Shield, Activity, Save, Lock } from 'lucide-react';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { UserRecord } from '../../src/agents/AdminDashboardAgent/AdminHandler';

interface UserFormProps {
  initialData?: UserRecord;
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
}

export const UserForm = ({ initialData, onSubmit, isLoading }: UserFormProps) => {
  const [formData, setFormData] = useState({
    displayName: initialData?.displayName || '',
    email: initialData?.email || '',
    password: '',
    role: initialData?.role || 'user',
    status: initialData?.status || 'active',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-inter">
      <div className="space-y-4">
        <Input
          label="Full Name"
          placeholder="James Doe"
          value={formData.displayName}
          onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
          leftIcon={<User className="w-5 h-5" />}
          required
        />
        
        <Input
          label="Email Address"
          placeholder="james@res-q.org"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          leftIcon={<Mail className="w-5 h-5" />}
          required
        />

        {!initialData && (
          <Input
            label="Password"
            placeholder="••••••••"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            leftIcon={<Lock className="w-5 h-5" />}
            required={!initialData}
            helperText="At least 6 characters required."
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Role</label>
            <div className="relative group">
              <Shield className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
              <select 
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all appearance-none"
              >
                <option value="user">User</option>
                <option value="officer">Officer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Status</label>
            <div className="relative group">
              <Activity className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
              <select 
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all appearance-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <Button
          type="submit"
          isLoading={isLoading}
          className="w-full"
          size="lg"
          rightIcon={<Save className="w-5 h-5" />}
        >
          {initialData ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
};
