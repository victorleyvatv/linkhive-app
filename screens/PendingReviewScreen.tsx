import React from 'react';
import { Layout } from '../components/Layout';
import { LinkCard } from '../components/LinkCard';
import { LinkItem } from '../types';

interface PendingReviewScreenProps {
  links: LinkItem[];
  onBack: () => void;
  onOpenDetail: (id: string) => void;
  onOpenLink: (e: React.MouseEvent, url: string) => void;
}

export const PendingReviewScreen: React.FC<PendingReviewScreenProps> = ({ 
  links, 
  onBack, 
  onOpenDetail,
  onOpenLink 
}) => {
  return (
    <Layout title="Pending Review" onBack={onBack}>
      <div className="flex flex-col gap-3">
        {links.map(link => (
          <LinkCard 
            key={link.id} 
            item={link} 
            onClick={() => onOpenDetail(link.id)}
            onOpenLink={(e) => onOpenLink(e, link.url)}
          />
        ))}
        {links.length === 0 && <p className="text-center py-10 text-slate-500">No items pending review.</p>}
      </div>
    </Layout>
  );
};