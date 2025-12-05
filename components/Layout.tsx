import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  onBack?: () => void;
  actions?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, title, onBack, actions }) => {
  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden border-x border-slate-200 font-medium text-[#1A1A1A]">
      <header className="bg-[#111111] text-[#FFCC33] p-4 sticky top-0 z-10 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onBack && (
              <button 
                onClick={onBack} 
                className="p-1 hover:bg-[#FFCC33] hover:text-[#111111] rounded-full transition-colors"
                aria-label="Go back"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
            )}
            <h1 className="text-xl font-bold tracking-tight truncate font-['Poppins']">{title}</h1>
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {children}
      </main>
    </div>
  );
};