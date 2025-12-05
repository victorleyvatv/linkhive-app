import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { LinkItem } from '../types';

interface LinkDetailsProps {
  item: LinkItem;
  onBack: () => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<LinkItem>) => void;
  onReview: (item: LinkItem) => void; // Used if item is pending
}

export const LinkDetails: React.FC<LinkDetailsProps> = ({ 
  item, 
  onBack, 
  onToggleFavorite, 
  onDelete, 
  onUpdate,
  onReview 
}) => {
  const [editNotes, setEditNotes] = useState(item.notes || '');

  const getConfidenceColorInfo = (score: number) => {
    if (score >= 0.8) return { color: 'bg-green-100 text-green-800 border-green-200', label: 'High Confidence' };
    if (score >= 0.6) return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Medium Confidence' };
    return { color: 'bg-red-100 text-red-800 border-red-200', label: 'Low Confidence' };
  };

  const confidenceInfo = getConfidenceColorInfo(item.confidenceScore);

  const handleOpenLink = (e: React.MouseEvent) => {
    if (item.isOpened === false) {
      onUpdate(item.id, { isOpened: true });
    }
  };

  return (
    <Layout 
      title="Link Details" 
      onBack={onBack}
      actions={
          <button 
              onClick={() => onToggleFavorite(item.id)}
              className={`p-2 rounded-full transition-colors ${item.favorite ? 'text-[#FFCC33] bg-[#111111]' : 'text-slate-300 hover:text-white hover:bg-white/20'}`}
          >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
          </button>
      }
    >
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {item.isPendingReview && (
            <div className="bg-amber-100 px-6 py-3 border-b border-amber-200 flex justify-between items-center">
                <span className="text-amber-800 text-sm font-bold flex items-center gap-2">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                   Pending Review
                </span>
                <button 
                  onClick={() => onReview(item)}
                  className="bg-white text-amber-900 text-xs px-3 py-1 rounded shadow-sm hover:bg-amber-50 font-bold border border-amber-200"
                >
                  Review & Approve
                </button>
            </div>
        )}

        <div className="p-6">
          <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded uppercase tracking-wide">
                  {item.category}
              </span>
              <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded uppercase tracking-wide">
                  {item.subcategory}
              </span>
              {/* Confidence Widget */}
              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded uppercase tracking-wide border ${confidenceInfo.color}`}>
                 <span>AI Score: {Math.round(item.confidenceScore * 100)}%</span>
              </span>
              {/* Unopened Badge */}
              {item.isOpened === false && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded uppercase tracking-wide bg-[#111111] text-[#FFCC33]">
                  PENDING REVIEW
                </span>
              )}
          </div>
          
          <h2 className="text-xl font-bold text-slate-900 mb-2 font-['Poppins']">{item.title}</h2>
          
          <div className="flex items-center gap-3 mb-6 text-sm text-slate-500">
              {item.pricing && item.pricing !== 'Unknown' && (
                  <span className="flex items-center gap-1 border border-slate-200 px-2 py-0.5 rounded">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      {item.pricing}
                  </span>
              )}
          </div>

          <div className="mb-6">
             <p className="text-slate-600 leading-relaxed text-sm">{item.description}</p>
          </div>

          {/* INTENT SECTION */}
          {item.intent && item.intent !== 'Unknown' && (
              <div className="mb-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 font-['Poppins']">Intent</h3>
                  <div className="flex items-center gap-2 text-indigo-700 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100 inline-flex">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                      <span className="text-sm font-semibold">{item.intent}</span>
                  </div>
              </div>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
              {item.tags.map(tag => (
                  <span key={tag} className="text-sm bg-slate-50 text-slate-500 px-3 py-1 rounded-full border border-slate-200">#{tag}</span>
              ))}
          </div>

          {/* TYPE SECTION */}
          <div className="mb-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2 font-['Poppins']">Type:</span>
              <span className="text-sm font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded capitalize">
                  {item.linkType}
              </span>
          </div>

          <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2 font-['Poppins']">Notes</label>
              <textarea 
                  value={editNotes}
                  onChange={(e) => {
                      setEditNotes(e.target.value);
                      onUpdate(item.id, { notes: e.target.value });
                  }}
                  placeholder="Add your personal notes here..."
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#FFCC33] focus:border-[#FFCC33] outline-none text-sm min-h-[100px]"
              />
          </div>
          
          <div className="flex flex-col gap-3">
               <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noreferrer"
                  onClick={handleOpenLink}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-[#111111] text-[#FFCC33] font-semibold uppercase rounded-lg hover:shadow-lg transition-all"
              >
                  <span>Open Original URL</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
              </a>
              
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 break-all">
                  <p className="text-xs text-slate-400 font-mono">{item.url}</p>
              </div>

              <button 
                  onClick={() => onDelete(item.id)}
                  className="w-full py-3 text-red-600 font-semibold uppercase hover:bg-red-50 rounded-lg transition-colors text-sm"
              >
                  Delete Link
              </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};