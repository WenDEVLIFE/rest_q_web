"use client";

import React from 'react';
import { AlertCircle, Trash2, X } from 'lucide-react';
import { Button } from './Button';

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'primary';
}

export const AlertDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isLoading = false,
  variant = 'danger'
}: AlertDialogProps) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: 'bg-red-50 text-red-600 border-red-100 ring-red-500/10',
    warning: 'bg-amber-50 text-amber-600 border-amber-100 ring-amber-500/10',
    primary: 'bg-sky-50 text-sky-600 border-sky-100 ring-sky-500/10',
  };

  const buttonVariants = {
    danger: 'primary', // We usually use primary red for danger buttons in Res-Q logic
    warning: 'primary',
    primary: 'primary',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Dialog Content */}
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in zoom-in-95 duration-200 font-inter border border-slate-200">
        <div className="p-8 text-center">
          <div className={`mx-auto w-16 h-16 rounded-2xl border-2 flex items-center justify-center mb-6 ring-8 ${variantStyles[variant]}`}>
            {variant === 'danger' ? <Trash2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
          </div>
          
          <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
          <p className="text-sm font-bold text-slate-400 leading-relaxed px-2">
            {description}
          </p>
        </div>
        
        <div className="p-6 bg-slate-50/50 flex gap-3 border-t border-slate-100">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1 text-slate-500 hover:bg-slate-200"
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'primary' : 'primary'} // Adjusted to use existing button variants
            className={`flex-1 ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700 !text-white' : ''}`}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
