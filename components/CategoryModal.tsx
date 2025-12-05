import React from 'react';
import { Category } from '../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (category: string) => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-sm max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Select Category</h3>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-2 overflow-y-auto">
          {Object.values(Category).map(cat => (
            <button 
              key={cat}
              onClick={() => onConfirm(cat)}
              className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium hover:bg-blue-50 hover:text-blue-700 text-slate-700 transition-colors border-b border-slate-50 last:border-0"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};