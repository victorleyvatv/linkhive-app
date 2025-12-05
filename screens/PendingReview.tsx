import React from 'react';
import { Layout } from '../components/Layout';
import { LinkCard } from '../components/LinkCard';
import { LinkItem } from '../types';

interface PendingReviewProps {
  links: LinkItem[];
  onBack: () => void;
  onReview: (link: LinkItem) => void;
  onDelete: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onOpenLink: (e: React.MouseEvent, url: string) => void;
}

export const PendingReview: React.FC<PendingReviewProps> = ({ 
  links, 
  onBack, 
  onReview, 
  onDelete, 
  onOpenDetail,
  onOpenLink 
}) => {
  return (
    <Layout title="Pending Review" onBack={onBack}>
      <div className="mb-4 p-4 bg-amber-50 text-amber-800 text-sm rounded-lg border border-amber-100 flex items-start gap-3">
        <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <div>
          <p className="font-bold mb-1">Low Confidence Detections</p>
          <p>These links may have incomplete data. Please verify and approve them to add to your collection.</p>
        </div>
      </div>
      
      <div className="flex flex-col gap-3">
        {links.map(link => (
          <div key={link.id} className="bg-white rounded-lg border border-amber-200 p-1 shadow-sm">
            <div className="px-3 py-2 flex justify-between items-center bg-amber-50 rounded-t-lg border-b border-amber-100 mb-1">
               <span className="text-xs font-bold text-amber-800">AI Score: {Math.round(link.confidenceScore * 100)}%</span>
               {link.intent && link.intent !== 'Unknown' && <span className="text-xs text-amber-700 font-medium">Intent: {link.intent}</span>}
            </div>
            <div className="p-1">
               <LinkCard 
                item={link} 
                onClick={() => onOpenDetail(link.id)}
                onOpenLink={(e) => onOpenLink(e, link.url)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded-b-lg border-t border-slate-100">
               <button 
                onClick={() => onReview(link)}
                className="flex-1 bg-blue-600 text-white text-xs font-bold py-2 rounded-md hover:bg-blue-700 transition-colors"
               >
                 Review & Move
               </button>
               <button 
                onClick={() => onDelete(link.id)}
                className="px-4 bg-white border border-red-200 text-red-600 text-xs font-bold py-2 rounded-md hover:bg-red-50 transition-colors"
               >
                 Delete
               </button>
            </div>
          </div>
        ))}
        {links.length === 0 && <p className="text-center py-10 text-slate-500">No items pending review.</p>}
      </div>
    </Layout>
  );
};