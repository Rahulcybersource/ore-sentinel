import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  Layers, 
  TrendingUp, 
  Sliders, 
  CheckSquare, 
  LayoutDashboard, 
  Database, 
  Cpu, 
  GitBranch, 
  FileText,
  ChevronDown,
  Menu,
  X,
  Sparkles
} from 'lucide-react';

export type MainTab = 
  | 'overview' 
  | 'exploration' 
  | 'resource' 
  | 'production' 
  | 'scenarios' 
  | 'actions'
  | 'datasources'
  | 'modelcenter'
  | 'architecture'
  | 'sihmatrix'
  | 'landing';

interface HeaderProps {
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  onOpenLanding: () => void;
  isAiAssistantOpen?: boolean;
  onToggleAiAssistant?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  onSelectTab, 
  onOpenLanding,
  isAiAssistantOpen = false,
  onToggleAiAssistant,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreDropdownRef = useRef<HTMLDivElement>(null);

  // Close "More" dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsMoreOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background scrolling when mobile sidebar is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Primary navigation: exactly in this order
  const primaryTabs: { id: MainTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'exploration', label: 'Explore', icon: Compass },
    { id: 'resource', label: 'Resource', icon: Layers },
    { id: 'production', label: 'Production', icon: TrendingUp },
    { id: 'scenarios', label: 'Scenarios', icon: Sliders },
    { id: 'actions', label: 'Actions', icon: CheckSquare },
  ];

  // Secondary technical navigation grouped inside "More ▾"
  const secondaryTabs: { id: MainTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'datasources', label: 'Data & Sources', icon: Database },
    { id: 'modelcenter', label: 'Models & Validation', icon: Cpu },
    { id: 'architecture', label: 'System Architecture', icon: GitBranch },
    { id: 'sihmatrix', label: 'SIH Problem Alignment', icon: FileText },
  ];

  const isSecondaryActive = secondaryTabs.some((t) => t.id === activeTab);

  const handleSelectTab = (tab: MainTab) => {
    onSelectTab(tab);
    setIsMobileMenuOpen(false);
    setIsMoreOpen(false);
  };

  return (
    <header className="bg-white border-b border-stone-200/90 sticky top-0 z-[1100] select-none w-full shadow-2xs">
      {/* 
        THREE-ZONE BALANCED ENTERPRISE HEADER
        Zone 1 (Left): Brand + DEMO MODE indicator
        Zone 2 (Center): Primary Navigation (Overview, Explore, Resource, Production, Scenarios, Actions)
        Zone 3 (Right): More ▾ + Ask Ore-Sentinel
        Guarantees zero overlapping at any screen width.
      */}
      <div className="w-full px-3 sm:px-5 lg:px-6 py-2.5 flex items-center justify-between gap-3 xl:gap-4">
        
        {/* ======================================================== */}
        {/* ZONE 1 (LEFT): BRAND IDENTITY & DEMO MODE BADGE          */}
        {/* ======================================================== */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
          {/* Mobile Drawer Menu Button (<lg) */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 -ml-1 rounded-lg text-stone-700 hover:text-stone-950 hover:bg-stone-100 border border-stone-200 transition-colors cursor-pointer flex items-center justify-center bg-white shrink-0"
            aria-label="Open navigation menu"
            title="Open navigation menu"
          >
            <Menu className="w-5 h-5 text-stone-800" />
          </button>

          <button 
            onClick={onOpenLanding}
            className="flex items-center space-x-2.5 sm:space-x-3 text-left group cursor-pointer shrink-0"
            title="Ore-Sentinel &bull; Return to Welcome Overview"
          >
            {/* Ochre manganese ore insignia */}
            <div className="w-8 h-8 rounded-lg bg-[#b45309] text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs shrink-0 group-hover:bg-[#92400e] transition-colors">
              M
            </div>
            <div className="shrink-0">
              <div className="flex items-center space-x-2">
                <span className="font-bold tracking-tight text-stone-950 text-base leading-none">Ore-Sentinel</span>
                
                {/* DEMO MODE: integrated cleanly with brand area, never competing with nav */}
                <span 
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-900 font-mono text-[10px] font-semibold shrink-0"
                  title="DEMO MODE: Public EO + Simulated Operational Data"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>DEMO MODE</span>
                </span>
              </div>
              <div className="text-[11px] text-stone-500 font-normal leading-tight mt-0.5 whitespace-nowrap">
                Proposed AI Decision-Support Platform for MOIL
              </div>
            </div>
          </button>
        </div>

        {/* ======================================================== */}
        {/* ZONE 2 (CENTER): PRIMARY WORKFLOW NAVIGATION             */}
        {/* ======================================================== */}
        <div className="hidden lg:flex items-center justify-center flex-1 px-2 min-w-0">
          <nav 
            className="flex items-center space-x-0.5 xl:space-x-1 p-1 rounded-xl bg-stone-100/80 border border-stone-200/80 shrink-0"
            aria-label="Primary Workflow Navigation"
          >
            {primaryTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => handleSelectTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-stone-900 text-white font-semibold shadow-xs'
                      : 'text-stone-600 hover:text-stone-950 hover:bg-white/90'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-stone-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* ======================================================== */}
        {/* ZONE 3 (RIGHT): MORE ▾ & ASK Ore-Sentinel                    */}
        {/* ======================================================== */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0 justify-end">
          {/* MORE ▾ DROPDOWN (Supporting Pages) */}
          <div className="relative shrink-0" ref={moreDropdownRef}>
            <button
              id="nav-more-dropdown-btn"
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                isSecondaryActive || isMoreOpen
                  ? 'bg-stone-200 text-stone-950 font-semibold border-stone-300'
                  : 'bg-white text-stone-700 hover:text-stone-950 hover:bg-stone-50 border-stone-200/90 shadow-2xs'
              }`}
              aria-expanded={isMoreOpen}
              aria-haspopup="true"
              title="Supporting technical pages & system documentation"
            >
              <span>More</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isMoreOpen ? 'rotate-180 text-stone-900' : 'text-stone-500'}`} />
            </button>

            {/* Dropdown Menu */}
            {isMoreOpen && (
              <div 
                className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-stone-200 py-1.5 z-[1200] animate-in fade-in slide-in-from-top-1 duration-150"
                role="menu"
              >
                <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-stone-400 border-b border-stone-100">
                  Supporting &amp; Technical
                </div>
                {secondaryTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      id={`nav-sec-${tab.id}`}
                      onClick={() => handleSelectTab(tab.id)}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-amber-50/80 text-amber-950 font-semibold'
                          : 'text-stone-700 hover:bg-stone-100 hover:text-stone-950'
                      }`}
                      role="menuitem"
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-700' : 'text-stone-500'}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ASK Ore-Sentinel (Single AI Assistant Entry Point) */}
          {onToggleAiAssistant && (
            <button
              id="header-ask-Ore-Sentinel-btn"
              onClick={onToggleAiAssistant}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border shrink-0 ${
                isAiAssistantOpen
                  ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                  : 'bg-white text-stone-800 hover:text-stone-950 hover:bg-stone-50 border-stone-300 shadow-2xs'
              }`}
              title="Toggle ORE-SENTINEL AI Assistant"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAiAssistantOpen ? 'text-amber-300' : 'text-amber-700'}`} />
              <span className="font-semibold whitespace-nowrap">Ask Ore-Sentinel</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MOBILE SLIDE-IN SIDEBAR DRAWER (<lg)                    */}
      {/* ======================================================== */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[1300] lg:hidden">
          {/* Dark Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Sidebar Drawer Panel */}
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col z-[1301] animate-in slide-in-from-left duration-200 border-r border-stone-200">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-stone-200 bg-[#faf9f6] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#b45309] text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-xs">
                  M
                </div>
                <div>
                  <div className="font-bold text-stone-900 text-sm">Ore-Sentinel</div>
                  <div className="text-[11px] text-stone-500">Proposed Platform for MOIL</div>
                </div>
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-200/70 transition-colors cursor-pointer"
                title="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sidebar Status Pill */}
            <div className="p-3 bg-stone-50 border-b border-stone-100 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1.5 text-amber-800 font-mono text-[11px]">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="font-semibold">DEMO MODE</span>
              </div>
              <span className="text-stone-500 text-[10px]">
                Public EO + Simulated Data
              </span>
            </div>

            {/* Sidebar Navigation Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Primary Navigation */}
              <div>
                <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider px-2 mb-1.5">
                  Primary Navigation
                </div>
                <div className="space-y-1">
                  {primaryTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleSelectTab(tab.id)}
                        className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                          isActive
                            ? 'bg-stone-900 text-white shadow-xs'
                            : 'text-stone-700 hover:bg-stone-100 hover:text-stone-950'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-stone-500'}`} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Supporting Material (More) */}
              <div>
                <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider px-2 mb-1.5">
                  Supporting Material
                </div>
                <div className="space-y-1">
                  {secondaryTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleSelectTab(tab.id)}
                        className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                          isActive
                            ? 'bg-stone-200 text-stone-900 font-semibold'
                            : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-stone-500" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AI Assistant Mobile Action */}
              {onToggleAiAssistant && (
                <div className="pt-2 border-t border-stone-200">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onToggleAiAssistant();
                    }}
                    className={`w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                      isAiAssistantOpen
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-300 shadow-2xs'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Ask Ore-Sentinel</span>
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-stone-200 bg-[#faf9f6] text-[11px] text-stone-500 flex items-center justify-between">
              <span>MOIL Intelligence</span>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenLanding();
                }}
                className="text-stone-700 hover:text-stone-950 font-medium underline cursor-pointer"
              >
                Welcome Screen
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
