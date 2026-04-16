"use client";

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  RefreshCw, 
  UserCircle2, 
  ShieldCheck, 
  Clock,
  ExternalLink,
  MoreVertical,
  AlertCircle
} from 'lucide-react';
import { AdminHandler } from '../../src/agents/AdminDashboardAgent/AdminHandler';
import type { UserRecord } from '../../src/types/user_record';
import { toast } from 'sonner';
import { Modal } from '../UI/Modal';
import { UserForm } from './UserForm';
import { Trash2, Edit3, UserPlus } from 'lucide-react';
import { AlertDialog } from '../UI/AlertDialog';

export const UsersView = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async () => {
    setIsRefreshing(true);
    try {
      const data = await AdminHandler.getUsers();
      setUsers(data);
    } catch (err) {
      toast.error("Failed to sync user records.");
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: UserRecord) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      if (editingUser) {
        await AdminHandler.updateUser(editingUser.uid, formData);
        toast.success("User record updated.");
      } else {
        await AdminHandler.addUser(formData);
        toast.success("New user created.");
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error("Operation failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (uid: string) => {
    setPendingDeleteId(uid);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    
    setIsDeleting(true);
    try {
      await AdminHandler.deleteUser(pendingDeleteId);
      toast.success("User deleted.");
      setUsers(prev => prev.filter(u => u.uid !== pendingDeleteId));
      setDeleteConfirmOpen(false);
    } catch (err) {
      toast.error("Failed to delete user.");
    } finally {
      setIsDeleting(false);
      setPendingDeleteId(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.uid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleStyles = {
    admin: 'bg-primary/10 text-primary border-primary/20',
    officer: 'bg-sky-100 text-sky-700 border-sky-200',
    user: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const statusStyles = {
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-slate-100 text-slate-500',
    suspended: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6 flex-1 w-full animate-in fade-in slide-in-from-right-4 duration-500 font-inter">
      {/* Header Controls */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-black tracking-tight text-slate-900">User Management</h2>
          </div>
          <p className="text-sm font-bold text-slate-400">Total registered users: <span className="text-slate-900">{users.length}</span></p>
        </div>

        <div className="flex w-full md:w-auto flex-wrap items-center gap-3">
          <button 
            onClick={handleCreateUser}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-sky-700 transition-all active:scale-95 shadow-md shadow-primary/10"
          >
            <UserPlus className="w-4 h-4" />
            Add New User
          </button>
          
          <div className="relative group flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name, email, or UID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-80 pl-9 pr-4 py-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all"
            />
          </div>
          <button 
            onClick={fetchUsers}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-500 hover:text-primary transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Users List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="py-4 pl-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">User Details</th>
                <th className="py-4 px-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Role</th>
                <th className="py-4 px-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="py-4 px-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Activity</th>
                <th className="py-4 pr-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse border-b border-slate-100 last:border-0">
                    <td colSpan={5} className="py-12 px-6">
                      <div className="h-4 bg-slate-100 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user.uid} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                    <td className="py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200">
                          <UserCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-sm font-black text-slate-900">{user.displayName}</span>
                          <p className="text-xs font-bold text-slate-400">{user.email}</p>
                          <p className="text-[10px] font-mono font-bold text-slate-300 mt-1 uppercase tracking-tighter">ID: {user.uid}</p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <div className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider inline-flex items-center gap-1.5 ${roleStyles[user.role as keyof typeof roleStyles] || roleStyles.user}`}>
                        {user.role === 'admin' && <ShieldCheck className="w-3 h-3" />}
                        {user.role}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusStyles[user.status as keyof typeof statusStyles] || statusStyles.active}`}>
                        {user.status}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span className="text-slate-400">Last login:</span>
                          <span className="font-mono text-slate-700">{user.lastLogin.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-300">Joined: {user.createdAt.toDate().toLocaleDateString()}</p>
                      </div>
                    </td>

                    <td className="py-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditUser(user)}
                          className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors border border-transparent hover:border-primary/10"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(user.uid)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                          <MoreVertical className="w-5 h-5" />
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
                      <p className="text-sm font-bold text-slate-400">No users found matching your search.</p>
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
        title={editingUser ? "Edit User Details" : "Register New User"}
      >
        <UserForm 
          initialData={editingUser || undefined}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </Modal>

      <AlertDialog 
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete User Record?"
        description="This action will permanently remove this user account from the system. This cannot be undone."
        confirmLabel="Confirm Delete"
      />
    </div>
  );
};
