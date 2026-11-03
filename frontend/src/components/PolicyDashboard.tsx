import React, { useState } from 'react';
import {
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Car,
  User,
  CheckCircle2,
  Clock,
  Download,
  PlusCircle,
  FileCheck
} from 'lucide-react';
import { Policy } from '../types';

interface PolicyDashboardProps {
  policies: Policy[];
  onSeedDemo: () => Promise<void>;
  onGoToCompare: () => void;
}

export const PolicyDashboard: React.FC<PolicyDashboardProps> = ({
  policies,
  onSeedDemo,
  onGoToCompare,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRING_SOON'>('ALL');

  const expiringPolicies = policies.filter(
    (p) => p.status === 'EXPIRING_SOON' || (p.days_until_expiry !== undefined && p.days_until_expiry <= 15 && p.days_until_expiry >= 0)
  );

  const filteredPolicies = policies.filter((p) => {
    if (filter === 'EXPIRING_SOON') return p.status === 'EXPIRING_SOON' || (p.days_until_expiry !== undefined && p.days_until_expiry <= 15 && p.days_until_expiry >= 0);
    if (filter === 'ACTIVE') return p.status === 'ACTIVE';
    return true;
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      {/* Expiry Alert Warning Banner (Requirement: Identify policies approaching expiry) */}
      {expiringPolicies.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-sm flex items-start gap-4 animate-in fade-in">
          <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-amber-900">
                Action Required: {expiringPolicies.length} Policy Expiring Within 15 Days!
              </h3>
              <span className="text-[11px] bg-amber-200 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                Renewal Alert
              </span>
            </div>
            <p className="text-xs text-amber-700 mt-1">
              Relative to reference date (10 Nov 2026), vehicle insurance for{' '}
              <strong>{expiringPolicies.map((p) => p.registration_number).join(', ')}</strong> is approaching expiry. Renew immediately to maintain uninterrupted coverage and protect your No Claim Bonus.
            </p>
          </div>
        </div>
      )}

      {/* Header and Filter Controls */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Policy Management Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            View active insurance policies, tracked vehicles, renewal deadlines, and premium certificates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Seed Demo */}
          <button
            onClick={onSeedDemo}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors"
            title="Seeds demo policies including an expiring soon policy"
          >
            <PlusCircle className="w-4 h-4 text-slate-600" />
            <span>Load Demo Data</span>
          </button>

          <button
            onClick={onGoToCompare}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl shadow-sm transition-colors"
          >
            <span>+ Compare New Car</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
            filter === 'ALL'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Policies ({policies.length})
        </button>

        <button
          onClick={() => setFilter('EXPIRING_SOON')}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            filter === 'EXPIRING_SOON'
              ? 'bg-amber-600 text-white'
              : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Expiring Soon ({expiringPolicies.length})</span>
        </button>

        <button
          onClick={() => setFilter('ACTIVE')}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
            filter === 'ACTIVE'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Active Policies ({policies.filter((p) => p.status === 'ACTIVE').length})
        </button>
      </div>

      {/* Policies List */}
      {filteredPolicies.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Policies Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            You have not saved any policies in this category yet. Click 'Compare Plans' to search and save a policy, or click 'Load Demo Data'.
          </p>
          <button
            onClick={onSeedDemo}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl border border-blue-200 hover:bg-blue-100"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Load Sample Policies</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPolicies.map((p) => {
            const isExpiring = p.status === 'EXPIRING_SOON' || (p.days_until_expiry !== undefined && p.days_until_expiry <= 15 && p.days_until_expiry >= 0);

            return (
              <div
                key={p.id}
                className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${
                  isExpiring
                    ? 'border-amber-400 ring-2 ring-amber-400/20'
                    : 'border-slate-200 hover:shadow-md'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {p.policy_number}
                  </span>
                  {isExpiring ? (
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                      <Clock className="w-3 h-3 text-amber-600" />
                      Expires in {p.days_until_expiry} days!
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Active Policy
                    </span>
                  )}
                </div>

                {/* Plan & Provider */}
                <div className="mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    {p.provider_name}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 tracking-tight">
                    {p.plan_name}
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">
                    {p.coverage_type} Coverage · IDV {formatCurrency(p.idv)}
                  </span>
                </div>

                {/* Vehicle & Customer Details */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs space-y-1.5 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Car className="w-3 h-3 text-slate-400" />
                      Vehicle Reg:
                    </span>
                    <span className="font-mono font-bold text-slate-800">{p.registration_number}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      Policyholder:
                    </span>
                    <span className="font-medium text-slate-800">{p.customer_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Valid Period:
                    </span>
                    <span className="font-mono text-slate-700">{p.policy_start_date} to {p.policy_expiry_date}</span>
                  </div>
                </div>

                {/* Add-ons */}
                {p.addons && p.addons.length > 0 && (
                  <div className="mb-3">
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Active Add-ons:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {p.addons.map((addon, aIdx) => (
                        <span
                          key={aIdx}
                          className="text-[10px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200"
                        >
                          ✓ {addon}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer / Premium */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Total Premium Paid</span>
                    <span className="text-lg font-black text-slate-900 font-mono">
                      {formatCurrency(p.total_premium)}
                    </span>
                  </div>

                  <button
                    onClick={() => alert(`Policy Certificate #${p.policy_number}\nVehicle: ${p.registration_number}\nProvider: ${p.provider_name}\nPlan: ${p.plan_name}\nPremium: INR ${p.total_premium}\nStatus: ${p.status}`)}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200"
                    title="Download Mock Policy Certificate"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
