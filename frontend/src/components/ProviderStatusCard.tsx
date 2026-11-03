import React from 'react';
import {
  Server,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileCode,
  FileText,
  FileSpreadsheet,
  Globe,
  RefreshCw
} from 'lucide-react';
import { ProviderFetchStatus } from '../types';

interface ProviderStatusCardProps {
  statuses: ProviderFetchStatus[];
  failA: boolean;
  setFailA: (val: boolean) => void;
  failD: boolean;
  setFailD: (val: boolean) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const ProviderStatusCard: React.FC<ProviderStatusCardProps> = ({
  statuses,
  failA,
  setFailA,
  failD,
  setFailD,
  onRefresh,
  isLoading
}) => {
  const getFormatIcon = (format: string) => {
    if (format.includes('JSON')) return <FileCode className="w-4 h-4 text-emerald-600" />;
    if (format.includes('HTML')) return <Globe className="w-4 h-4 text-blue-600" />;
    if (format.includes('PDF')) return <FileText className="w-4 h-4 text-rose-600" />;
    return <FileSpreadsheet className="w-4 h-4 text-amber-600" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Connected
          </span>
        );
      case 'DECLINED':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            Underwriting Declined
          </span>
        );
      case 'FAILED':
      case 'TIMEOUT':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Service Outage
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            No Quote
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Provider Integration & Resilience Monitor
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Four independent simulated services with real latency, error handling & format normalization.
          </p>
        </div>

        {/* Simulation Controls */}
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium select-none">
            <input
              type="checkbox"
              checked={failA}
              onChange={(e) => setFailA(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Simulate 503 Outage (Provider A)</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium select-none">
            <input
              type="checkbox"
              checked={failD}
              onChange={(e) => setFailD(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Simulate Failure (Provider D)</span>
          </label>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-medium px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Retry</span>
          </button>
        </div>
      </div>

      {/* 4 Provider Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {statuses.map((s, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-xl border transition-all ${
              s.status === 'FAILED'
                ? 'border-rose-200 bg-rose-50/40'
                : s.status === 'DECLINED'
                ? 'border-amber-200 bg-amber-50/40'
                : 'border-slate-200 bg-slate-50/60'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                {getFormatIcon(s.format)}
                <span className="font-bold text-xs text-slate-800">{s.provider_name}</span>
              </div>
              {getStatusBadge(s.status)}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
              <span className="font-mono text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                {s.format}
              </span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{s.response_time_ms} ms</span>
              </div>
            </div>

            {s.error_message && (
              <p className="mt-2 text-[11px] text-rose-700 bg-rose-100/60 p-1.5 rounded border border-rose-200 font-medium">
                {s.error_message}
              </p>
            )}

            {s.plans_count > 0 && (
              <div className="mt-2 text-[11px] text-emerald-700 font-semibold">
                ✓ {s.plans_count} plan{s.plans_count > 1 ? 's' : ''} parsed & normalized
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

