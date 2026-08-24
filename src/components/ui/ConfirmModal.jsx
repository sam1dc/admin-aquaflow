import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, variant = 'danger' }) => {
  const isDanger = variant === 'danger';
  const Icon = isDanger ? AlertTriangle : CheckCircle;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center text-center pb-2">
        <div className={`p-4 rounded-full mb-4 ${isDanger ? 'bg-status-error/10 text-status-error' : 'bg-primary/10 text-primary'}`}>
          <Icon size={32} />
        </div>
        <p className="text-text-secondary mb-6 text-sm">{message}</p>
        
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-xl font-medium text-text-secondary bg-background border border-border hover:bg-white/5 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-2 px-4 rounded-xl font-medium text-white transition-colors cursor-pointer shadow-lg ${
              isDanger 
                ? 'bg-status-error hover:bg-red-600 shadow-status-error/20' 
                : 'bg-primary hover:bg-primary/90 shadow-primary/20'
            }`}
          >
            Aceptar
          </button>
        </div>
      </div>
    </Modal>
  );
};
