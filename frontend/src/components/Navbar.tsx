import React from 'react';
import { Shield, FileText, CheckCircle2, Calendar, BookOpen, AlertCircle } from 'lucide-react';

interface NavbarProps {
  activeTab: 'compare' | 'policies' | 'glossary';
  setActiveTab: (tab: 'compare' | 'policies' | 'glossary') => void;
  policiesCount: number;
  expiringCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  policiesCount,
  expiringCount
}) => {
  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setActiveTab('compare')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl tracking-tight text-white">AutoCover</span>
                <span className="text-xs bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded-full border border-blue-500/30">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Smart Vehicle Insurance Comparison</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('compare')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'compare'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Compare Plans</span>
            </button>

            <button
              onClick={() => setActiveTab('policies')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                activeTab === 'policies'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>My Policies</span>
              {policiesCount > 0 && (
                <span className="bg-slate-700 text-slate-200 text-xs px-2 py-0.5 rounded-full font-semibold">
                  {policiesCount}
                </span>
              )}
              {expiringCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('glossary')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'glossary'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Add-on</span> Glossary
            </button>
          </nav>

          {/* Reference Date Badge */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>Today: <strong className="text-white">10 Nov 2026 (IST)</strong></span>
          </div>
        </div>
      </div>
    </header>
  );
};
