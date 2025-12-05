import React from 'react';
import { LinkItem } from '../types';

interface LinkCardProps {
  item: LinkItem;
  onClick: () => void;
  onOpenLink: (e: React.MouseEvent) => void;
}

export const LinkCard: React.FC<LinkCardProps> = ({ item, onClick, onOpenLink }) => {
  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'video': return 'bg-red-100 text-red-700';
      case 'article': return 'bg-gray-100 text-gray-700';
      case 'app/tool': return 'bg-purple-100 text-purple-700';
      case 'tutorial': return 'bg-green-100 text-green-700';
      case 'product page': return 'bg-orange-100 text-orange-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer flex flex-col gap-2 relative overflow-hidden"
    >
      {/* Decorative side bar for favorite - Hive Gold */}
      {item.favorite && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FFCC33]"></div>
      )}

      <div className="flex justify-between items-start gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex gap-2 items-center">
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${getTypeColor(item.linkType)}`}>
              {item.linkType}
            </span>
            {item.pricing && item.pricing !== 'Unknown' && (
              <span className="text-[10px] border border-slate-200 text-slate-500 px-1.5 rounded">
                {item.pricing}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-[#1A1A1A] leading-snug line-clamp-2 font-['Poppins']">{item.title}</h3>
        </div>
        {item.isPendingReview && (
           <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded whitespace-nowrap">
             Needs Review
           </span>
        )}
      </div>
      
      <p className="text-sm text-slate-600 line-clamp-2">{item.description}</p>
      
      {item.intent && item.intent !== 'Unknown' && (
        <div className="flex items-center gap-1.5 mt-1">
          <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          <span className="text-xs text-slate-600 font-medium">{item.intent}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-1 mt-1">
        {item.tags.slice(0, 3).map((tag, idx) => (
          <span key={idx} className="text-xs bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full border border-slate-100">
            #{tag.trim()}
          </span>
        ))}
      </div>

      <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide truncate max-w-[150px]">
          {item.category}
        </span>
        <button 
          onClick={onOpenLink}
          className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-100 font-semibold uppercase transition-colors"
        >
          Open
        </button>
      </div>
    </div>
  );
};