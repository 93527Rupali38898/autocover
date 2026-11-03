import React, { useState } from 'react';
import { BookOpen, ExternalLink, Shield, Check, Info, Search, X } from 'lucide-react';
import { GlossaryData } from '../types';

interface AddonGlossaryModalProps {
  glossary: GlossaryData | null;
  isOpen: boolean;
  onClose: () => void;
  selectedAddonCode?: string | null;
}

export const AddonGlossaryModal: React.FC<AddonGlossaryModalProps> = ({
  glossary,
  isOpen,
  onClose,
  selectedAddonCode
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen || !glossary) return null;

  const addonList = Object.values(glossary.standard_addons).filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/40 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Insurance Add-on Glossary</h3>
              <p className="text-xs text-slate-400">
                Standardizing add-on terminology across Providers A, B, C, & D against real insurer definitions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Research Sources Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
              Public Insurer Reference Sources Consulted
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              {glossary.sources.map((src, idx) => (
                <a
                  key={idx}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="font-semibold text-slate-800 group-hover:text-blue-600 flex items-center justify-between">
                      <span>{src.insurer}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{src.notes}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2 block">
                    Fetched: {src.referenced_date}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search add-on name or coverage details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            />
          </div>

          {/* Add-ons Cards */}
          <div className="space-y-4">
            {addonList.map((addon) => {
              const isHighlighted = selectedAddonCode === addon.code;

              return (
                <div
                  key={addon.code}
                  className={`p-4 rounded-xl border transition-all ${
                    isHighlighted
                      ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{addon.name}</h4>
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                        {addon.category}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      Standard Code: {addon.code}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {addon.description}
                  </p>

                  {/* Provider Terminology Mapping Table */}
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                      How Each Provider & Insurer Names This Add-on:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {Object.entries(addon.provider_mappings).map(([prov, rawName], pIdx) => (
                        <div key={pIdx} className="bg-white p-2 rounded border border-slate-200">
                          <span className="text-[10px] text-slate-400 block font-medium">{prov}</span>
                          <span className={`font-medium ${rawName === 'N/A' ? 'text-slate-400 italic' : 'text-slate-800'}`}>
                            {rawName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

