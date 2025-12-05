import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { LinkCard } from './components/LinkCard';
import { CategoryModal } from './components/CategoryModal';
import { PendingReview } from './screens/PendingReview';
import { PendingReviewScreen } from './screens/PendingReviewScreen';
import { LinkDetails } from './screens/LinkDetails';
import { classifyUrl } from './services/geminiService';
import { LinkItem, ScreenName } from './types';

// Storage Keys
const DB_KEY = 'links_db';
const PENDING_DB_KEY = 'pending_db';

export default function App() {
  // State
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [pendingLinks, setPendingLinks] = useState<LinkItem[]>([]);
  
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('HOME');
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);
  
  // Selection State
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Move State
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [linkToMove, setLinkToMove] = useState<LinkItem | null>(null);

  // Load data on mount with Migration
  useEffect(() => {
    const savedLinks = localStorage.getItem(DB_KEY);
    const savedPending = localStorage.getItem(PENDING_DB_KEY);
    
    let loadedLinks: LinkItem[] = [];
    let loadedPending: LinkItem[] = [];

    if (savedLinks) {
      try {
        const parsed = JSON.parse(savedLinks);
        // Normalize fields
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        loadedLinks = parsed.map((item: any) => ({
          ...item,
          intent: item.intent || 'Unknown',
          linkType: item.linkType || 'other',
          pricing: item.pricing || 'Unknown',
          confidenceScore: item.confidenceScore ?? 1.0,
          isPendingReview: item.isPendingReview ?? false
        }));
      } catch (e) {
        console.error("Failed to parse DB", e);
      }
    }

    if (savedPending) {
      try {
        const parsed = JSON.parse(savedPending);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        loadedPending = parsed.map((item: any) => ({
          ...item,
          intent: item.intent || 'Unknown',
          linkType: item.linkType || 'other',
          pricing: item.pricing || 'Unknown',
          confidenceScore: item.confidenceScore ?? 0.5,
          isPendingReview: true
        }));
      } catch (e) {
        console.error("Failed to parse Pending DB", e);
      }
    }

    // MIGRATION: Move old "isPendingReview" items from main DB to Pending DB
    const itemsToMove = loadedLinks.filter(l => l.isPendingReview);
    if (itemsToMove.length > 0) {
      loadedPending = [...loadedPending, ...itemsToMove];
      loadedLinks = loadedLinks.filter(l => !l.isPendingReview);
      // Save immediately to persist migration
      localStorage.setItem(DB_KEY, JSON.stringify(loadedLinks));
      localStorage.setItem(PENDING_DB_KEY, JSON.stringify(loadedPending));
    }

    setLinks(loadedLinks);
    setPendingLinks(loadedPending);
  }, []);

  // Save data on change
  useEffect(() => {
    localStorage.setItem(DB_KEY, JSON.stringify(links));
  }, [links]);

  useEffect(() => {
    localStorage.setItem(PENDING_DB_KEY, JSON.stringify(pendingLinks));
  }, [pendingLinks]);

  // Logic: Analyze & Save
  const handleAnalyzeAndSave = async () => {
    if (!urlInput) {
      setStatusMsg({ text: "Please enter a URL.", type: 'error' });
      return;
    }

    try {
      new URL(urlInput); // Basic validation
    } catch {
      setStatusMsg({ text: "Invalid URL format.", type: 'error' });
      return;
    }

    setLoading(true);
    setStatusMsg({ text: "Analyzing content & intent...", type: 'info' });

    try {
      const aiResult = await classifyUrl(urlInput);
      
      const score = aiResult.confidenceScore; // Range 0.0 - 1.0
      // Feature: If confidenceScore < 0.70 -> Save to pending_db
      const isLowConfidence = score < 0.70;

      const newLink: LinkItem = {
        id: crypto.randomUUID(),
        url: urlInput,
        title: aiResult.title,
        category: aiResult.category,
        subcategory: aiResult.subcategory,
        description: aiResult.description,
        tags: aiResult.tags.split(',').map(t => t.trim()),
        notes: "",
        favorite: false,
        created_at: new Date().toISOString(),
        intent: aiResult.intent,
        linkType: aiResult.linkType,
        pricing: aiResult.pricing,
        confidenceScore: score,
        isPendingReview: isLowConfidence,
        isOpened: false // New feature default
      };

      if (isLowConfidence) {
        setPendingLinks(prev => [newLink, ...prev]);
        setStatusMsg({ text: "Low confidence. Added to Pending Review.", type: 'info' });
      } else {
        setLinks(prev => [newLink, ...prev]);
        setStatusMsg({ text: "Saved successfully!", type: 'success' });
      }
      
      setUrlInput(''); // Clear input
      setTimeout(() => setStatusMsg(null), 4000);

    } catch (error) {
      console.error(error);
      setStatusMsg({ text: "Failed to analyze URL. Please try again.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Helper: Get unique categories from APPROVED links
  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    links.forEach(l => {
      counts[l.category] = (counts[l.category] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [links]);

  // Helper: Smart Collections
  const smartCollections = useMemo(() => {
    const collections = [
      { name: "Tutorials", filter: (l: LinkItem) => l.linkType?.toLowerCase() === 'tutorial' },
      { name: "AI Tools", filter: (l: LinkItem) => l.tags.some(t => t.toLowerCase().includes('ai')) || l.category === 'AI Tools & Models' },
      { name: "Courses & Learning", filter: (l: LinkItem) => l.subcategory?.toLowerCase().includes('course') || l.category === 'Education & Learning' },
      { name: "Apps & Software", filter: (l: LinkItem) => l.linkType?.toLowerCase().includes('app') || l.linkType?.toLowerCase().includes('tool') },
      { name: "Media & Content", filter: (l: LinkItem) => ['video', 'article', 'news'].includes(l.linkType?.toLowerCase()) }
    ];

    return collections.map(c => ({
      name: c.name,
      count: links.filter(c.filter).length,
      filter: c.filter
    })).filter(c => c.count > 0);
  }, [links]);

  // Helper: Filtered links based on screen
  const filteredLinks = useMemo(() => {
    if (currentScreen === 'CAT_DETAIL') {
      if (selectedCollection) {
        const collection = smartCollections.find(c => c.name === selectedCollection);
        return collection ? links.filter(collection.filter) : [];
      }
      if (selectedCategory) {
        return links.filter(l => l.category === selectedCategory);
      }
    }
    if (currentScreen === 'SEARCH' && searchQuery) {
      const q = searchQuery.toLowerCase();
      // Search searches EVERYTHING including pending
      const all = [...links, ...pendingLinks];
      return all.filter(l => 
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.tags.some(t => t.toLowerCase().includes(q)) ||
        l.notes.toLowerCase().includes(q)
      );
    }
    return [];
  }, [links, pendingLinks, currentScreen, selectedCategory, selectedCollection, smartCollections, searchQuery]);

  const activeLink = useMemo(() => {
    return links.find(l => l.id === selectedLinkId) || pendingLinks.find(l => l.id === selectedLinkId);
  }, [links, pendingLinks, selectedLinkId]);

  const unopenedLinks = useMemo(() => {
    return links.filter(l => l.isOpened === false);
  }, [links]);

  // Handlers
  const openLinkDetail = (id: string) => {
    setSelectedLinkId(id);
    setCurrentScreen('LINK_DETAIL');
  };

  const updateLink = (id: string, updates: Partial<LinkItem>) => {
    // Try updating in approved list
    if (links.some(l => l.id === id)) {
      setLinks(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    }
    // Try updating in pending list
    else if (pendingLinks.some(l => l.id === id)) {
      setPendingLinks(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    }
  };

  const deleteLink = (id: string) => {
    if (window.confirm("Are you sure you want to delete this link?")) {
      setLinks(prev => prev.filter(l => l.id !== id));
      setPendingLinks(prev => prev.filter(l => l.id !== id));
      const prevScreen = selectedCategory || selectedCollection ? 'CAT_DETAIL' : 'HOME';
      setCurrentScreen(prevScreen as ScreenName);
    }
  };

  const initiateMove = (link: LinkItem) => {
    setLinkToMove(link);
    setShowMoveModal(true);
  };

  const confirmMove = (category: string) => {
    if (!linkToMove) return;
    
    // Remove from pending
    setPendingLinks(prev => prev.filter(l => l.id !== linkToMove.id));
    
    // Add to approved with new category and high confidence
    const updated: LinkItem = {
      ...linkToMove,
      category: category,
      confidenceScore: 1.0, // Boost confidence on manual approval
      isPendingReview: false
    };
    
    setLinks(prev => [updated, ...prev]);
    setShowMoveModal(false);
    setLinkToMove(null);
    setStatusMsg({ text: "Link approved and categorized!", type: 'success' });
    setTimeout(() => setStatusMsg(null), 3000);
    
    if (currentScreen === 'LINK_DETAIL') {
      setCurrentScreen('PENDING_REVIEW');
    }
  };

  const toggleFavorite = (id: string) => {
    const link = links.find(l => l.id === id);
    if (link) updateLink(id, { favorite: !link.favorite });
  };

  // --- RENDER ---

  if (currentScreen === 'PRO_UPGRADE') {
    return (
      <Layout title="Upgrade to Pro" onBack={() => setCurrentScreen('HOME')}>
        <div className="flex flex-col items-center justify-center h-full text-center py-10 px-4">
          <div className="bg-gradient-to-br from-[#111111] to-slate-800 text-[#FFCC33] p-4 rounded-full mb-6 shadow-lg">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4 font-['Poppins']">Pro features coming soon</h2>
          <p className="text-slate-600 leading-relaxed max-w-xs mb-8">
            Cloud sync, multi-device access, enhanced AI extraction, and deeper knowledge graphs are on the way.
          </p>
          <button onClick={() => setCurrentScreen('HOME')} className="px-6 py-2 bg-slate-200 text-slate-700 font-semibold uppercase rounded-lg hover:bg-slate-300 transition-colors">
            Go Back
          </button>
        </div>
      </Layout>
    );
  }

  if (currentScreen === 'HOME') {
    return (
      <Layout title="LinkHive">
        <div className="flex flex-col items-center justify-center pt-6 pb-8">
          <div className="mb-4">
             <img 
               src="https://i.ibb.co/35Y9S0JT/Link-Hive-Transparent.png" 
               alt="LinkHive Logo" 
               className="w-24 h-24 object-contain" 
             />
          </div>
          <h2 className="text-3xl font-bold text-[#111111] tracking-tight font-['Poppins']">LinkHive</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Smart Link Organizer Powered by AI</p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <label className="block text-sm font-bold text-[#111111] mb-2 font-['Poppins']">Save a new resource</label>
            <div className="flex flex-col gap-3">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/article"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#FFCC33] focus:border-[#FFCC33] outline-none transition-all"
                disabled={loading}
              />
              <button
                onClick={handleAnalyzeAndSave}
                disabled={loading || !urlInput}
                className={`w-full py-3 rounded-lg font-bold shadow-sm transition-all flex justify-center items-center gap-2 uppercase tracking-wide
                  ${loading || !urlInput ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-[#111111] text-[#FFCC33] hover:bg-black hover:shadow-md'}`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-[#FFCC33]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
                    <span>Analyze & Save</span>
                  </>
                )}
              </button>
            </div>
            
            {statusMsg && (
              <div className={`mt-4 p-3 rounded-md text-sm font-medium ${
                statusMsg.type === 'error' ? 'bg-red-50 text-red-700' : 
                statusMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
              }`}>
                {statusMsg.text}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setCurrentScreen('CATEGORIES')}
              className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl hover:shadow-md hover:border-[#FFCC33] transition-all group"
            >
              <div className="bg-slate-100 p-3 rounded-full mb-3 group-hover:bg-[#FFCC33] group-hover:text-[#111111] text-slate-600 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
              </div>
              <span className="font-bold text-[#111111] font-['Poppins']">Browse Categories</span>
              <span className="text-xs text-slate-500 mt-1">{categories.length} Categories</span>
            </button>

            <button
              onClick={() => { setSearchQuery(''); setCurrentScreen('SEARCH'); }}
              className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl hover:shadow-md hover:border-[#FFCC33] transition-all group"
            >
              <div className="bg-slate-100 p-3 rounded-full mb-3 group-hover:bg-[#FFCC33] group-hover:text-[#111111] text-slate-600 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
              <span className="font-bold text-[#111111] font-['Poppins']">Search Links</span>
              <span className="text-xs text-slate-500 mt-1">{links.length} Saved</span>
            </button>
          </div>

          <button
            onClick={() => setCurrentScreen('UNOPENED_LIST')}
            className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md hover:border-[#FFCC33] transition-all group"
          >
             <div className="flex items-center gap-3">
                 <div className="bg-slate-100 p-2 rounded-full group-hover:bg-[#FFCC33] group-hover:text-[#111111] text-slate-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
                 </div>
                 <span className="font-bold text-[#111111] font-['Poppins']">Pending Review</span>
             </div>
             <span className="bg-[#111111] text-[#FFCC33] font-bold px-3 py-1 rounded-full text-xs">
                {unopenedLinks.length}
             </span>
          </button>

          {/* Pending Review Button (Low Confidence) */}
          {pendingLinks.length > 0 && (
            <button
              onClick={() => setCurrentScreen('PENDING_REVIEW')}
              className="w-full flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 hover:bg-amber-100 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                <div className="flex flex-col items-start text-left">
                   <span className="font-bold">Low Confidence Items</span>
                   <span className="text-xs text-amber-700 opacity-80">AI check required</span>
                </div>
              </div>
              <span className="bg-amber-200 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">{pendingLinks.length}</span>
            </button>
          )}

          <button
              onClick={() => setCurrentScreen('PRO_UPGRADE')}
              className="w-full p-4 bg-gradient-to-r from-[#111111] to-slate-900 rounded-lg text-[#FFCC33] font-semibold uppercase flex items-center justify-between shadow-md hover:shadow-lg transition-all"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                Upgrade to Pro
              </span>
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
          </button>
          
          <div className="mt-4">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 font-['Poppins']">Recent Favorites</h3>
             <div className="flex flex-col gap-3">
                {links.filter(l => l.favorite).slice(0, 3).map(link => (
                    <LinkCard 
                        key={link.id} 
                        item={link} 
                        onClick={() => openLinkDetail(link.id)}
                        onOpenLink={(e) => { e.stopPropagation(); window.open(link.url, '_blank'); }}
                    />
                ))}
                {links.filter(l => l.favorite).length === 0 && (
                    <p className="text-slate-400 text-sm italic text-center py-4">No favorites yet.</p>
                )}
             </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (currentScreen === 'CATEGORIES') {
    return (
      <Layout title="Browse" onBack={() => setCurrentScreen('HOME')}>
        <div className="flex flex-col gap-6">
          {smartCollections.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-1 font-['Poppins']">Smart Collections</h3>
              <div className="grid grid-cols-2 gap-3">
                {smartCollections.map((col) => (
                  <button
                    key={col.name}
                    onClick={() => { setSelectedCollection(col.name); setSelectedCategory(null); setCurrentScreen('CAT_DETAIL'); }}
                    className="flex flex-col p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200 hover:border-[#FFCC33] hover:shadow-md transition-all text-left"
                  >
                    <span className="font-bold text-[#111111] text-sm">{col.name}</span>
                    <span className="text-xs text-slate-600 mt-1">{col.count} items</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-1 font-['Poppins']">Categories</h3>
             {categories.length === 0 ? (
                <div className="text-center py-4 text-slate-500 bg-white rounded-lg border border-slate-200 border-dashed">
                  <p className="text-sm">No standard categories yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {categories.map(([categoryName, count]) => (
                    <button
                      key={categoryName}
                      onClick={() => { setSelectedCategory(categoryName); setSelectedCollection(null); setCurrentScreen('CAT_DETAIL'); }}
                      className="flex justify-between items-center p-4 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      <span className="font-bold text-[#111111]">{categoryName}</span>
                      <span className="bg-slate-100 text-slate-600 py-1 px-3 rounded-full text-xs font-bold">
                        {count}
                      </span>
                    </button>
                  ))}
                </div>
              )}
          </div>
        </div>
      </Layout>
    );
  }

  if (currentScreen === 'CAT_DETAIL') {
    return (
      <Layout 
        title={selectedCollection || selectedCategory || "Items"} 
        onBack={() => setCurrentScreen('CATEGORIES')}
      >
        <div className="flex flex-col gap-3">
          {filteredLinks.map(link => (
            <LinkCard 
              key={link.id} 
              item={link} 
              onClick={() => openLinkDetail(link.id)}
              onOpenLink={(e) => { e.stopPropagation(); window.open(link.url, '_blank'); }}
            />
          ))}
          {filteredLinks.length === 0 && <p className="text-center py-10 text-slate-500">No items found.</p>}
        </div>
      </Layout>
    );
  }

  if (currentScreen === 'PENDING_REVIEW') {
    return (
      <>
        <PendingReview 
          links={pendingLinks}
          onBack={() => setCurrentScreen('HOME')}
          onReview={initiateMove}
          onDelete={deleteLink}
          onOpenDetail={openLinkDetail}
          onOpenLink={(e, url) => { e.stopPropagation(); window.open(url, '_blank'); }}
        />
        <CategoryModal 
           isOpen={showMoveModal} 
           onClose={() => setShowMoveModal(false)} 
           onConfirm={confirmMove} 
        />
      </>
    );
  }

  if (currentScreen === 'UNOPENED_LIST') {
    return (
      <PendingReviewScreen 
        links={unopenedLinks}
        onBack={() => setCurrentScreen('HOME')}
        onOpenDetail={openLinkDetail}
        onOpenLink={(e, url) => { e.stopPropagation(); window.open(url, '_blank'); }}
      />
    );
  }

  if (currentScreen === 'SEARCH') {
    return (
      <Layout title="Search" onBack={() => setCurrentScreen('HOME')}>
        <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by keyword..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FFCC33] focus:border-[#FFCC33] outline-none"
                autoFocus
            />
        </div>
        
        {searchQuery && (
             <div className="flex flex-col gap-3">
                {filteredLinks.length > 0 ? (
                    filteredLinks.map(link => (
                        <LinkCard 
                        key={link.id} 
                        item={link} 
                        onClick={() => openLinkDetail(link.id)}
                        onOpenLink={(e) => { e.stopPropagation(); window.open(link.url, '_blank'); }}
                        />
                    ))
                ) : (
                    <p className="text-center text-slate-500 mt-8">No results found.</p>
                )}
            </div>
        )}
      </Layout>
    );
  }

  if (currentScreen === 'LINK_DETAIL' && activeLink) {
    const prevScreen = selectedCollection || selectedCategory ? 'CAT_DETAIL' : 
                       currentScreen === 'SEARCH' ? 'SEARCH' : 
                       currentScreen === 'UNOPENED_LIST' ? 'UNOPENED_LIST' :
                       activeLink.isPendingReview ? 'PENDING_REVIEW' : 'HOME';

    return (
      <>
        <LinkDetails 
          item={activeLink}
          onBack={() => setCurrentScreen(prevScreen as ScreenName)}
          onToggleFavorite={toggleFavorite}
          onDelete={deleteLink}
          onUpdate={updateLink}
          onReview={initiateMove}
        />
        <CategoryModal 
           isOpen={showMoveModal} 
           onClose={() => setShowMoveModal(false)} 
           onConfirm={confirmMove} 
        />
      </>
    );
  }

  // Fallback
  return <div className="p-10 text-center">Loading...</div>;
}