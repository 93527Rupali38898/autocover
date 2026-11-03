import React, { useState } from 'react';
import {
  Shield,
  Check,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Star,
  Award,
  Zap,
  ArrowRight
} from 'lucide-react';
import { NormalizedPlan } from '../types';

interface PlanCardProps {
  plan: NormalizedPlan;
  onSelectPlan: (plan: NormalizedPlan) => void;
  isCompared: boolean;
  onToggleCompare: (plan: NormalizedPlan) => void;
  onOpenGlossary: (addonCode: string) => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  onSelectPlan,
  isCompared,
  onToggleCompare,
  onOpenGlossary,
}) => {
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(false);

  const formattedTotal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(plan.total_premium);

  const formattedBase = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(plan.base_premium);

  const formattedGst = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(plan.gst_amount);

  const formattedIdv = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(plan.idv);

  const isBestValue = plan.badges.includes('Best Value');

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border transition-all hover:shadow-md relative overflow-hidden flex flex-col justify-between ${
        isBestValue
          ? 'border-blue-500 ring-2 ring-blue-500/20'
          : plan.is_expired
          ? 'border-slate-300 opacity-75'
          : 'border-slate-200'
      }`}
    >
      {/* Top Banner Badges */}
      {isBestValue && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-bold tracking-wider uppercase py-1 px-4 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-current text-amber-300" />
            Top Recommended (Value for Money)
          </span>
          <span className="text-[10px] bg-white/20 px-2 py-0.2 rounded">
            Score: {plan.value_score}/100
          </span>
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col">
        {/* Header: Provider & Plan Name */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {plan.provider_name}
            </span>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              {plan.plan_name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {plan.coverage_type}
              </span>
              {plan.is_expired && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                  Expired Quote ({plan.valid_until?.substring(0, 10)})
                </span>
              )}
            </div>
          </div>

          {/* Value Score Pill */}
          {!isBestValue && (
            <div className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-lg text-right shrink-0">
              <div className="text-[10px] text-slate-400 font-medium">Value Score</div>
              <div className="font-bold text-slate-800">{plan.value_score} / 100</div>
            </div>
          )}
        </div>

        {/* Badges */}
        {plan.badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {plan.badges.map((b, idx) => (
              <span
                key={idx}
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  b === 'Best Value'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : b === 'Lowest Premium'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                {b}
              </span>
            ))}
          </div>
        )}

        {/* Pricing & IDV Card */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 mb-4">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">
                Total Premium (incl. 18% GST)
              </span>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {formattedTotal}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-500 font-medium block">
                Insured Declared Value (IDV)
              </span>
              <div className="text-sm font-bold text-slate-800 font-mono">
                {formattedIdv}
              </div>
            </div>
          </div>

          {/* Tax breakdown toggle */}
          <button
            type="button"
            onClick={() => setShowTaxBreakdown(!showTaxBreakdown)}
            className="mt-2 text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <span>{showTaxBreakdown ? 'Hide price details' : 'View base premium + GST breakdown'}</span>
            {showTaxBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showTaxBreakdown && (
            <div className="mt-2 pt-2 border-t border-slate-200/80 text-xs text-slate-600 space-y-1 animate-in fade-in">
              <div className="flex justify-between">
                <span>Net Base Premium:</span>
                <span className="font-mono font-medium">{formattedBase}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (18%):</span>
                <span className="font-mono font-medium">{formattedGst}</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-900 pt-1 border-t border-slate-200">
                <span>Total Amount:</span>
                <span className="font-mono">{formattedTotal}</span>
              </div>
            </div>
          )}
        </div>

        {/* Add-ons List */}
        <div className="flex-1 mb-4">
          <span className="text-xs font-semibold text-slate-600 mb-2 block">
            Included Add-ons ({plan.addons.length}):
          </span>

          {plan.addons.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No add-ons included in this plan</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {plan.addons.map((addon, aIdx) => (
                <button
                  key={aIdx}
                  type="button"
                  onClick={() => onOpenGlossary(addon.code)}
                  className="flex items-center gap-1 text-[11px] bg-white border border-slate-200 hover:border-blue-400 text-slate-700 px-2 py-1 rounded-md transition-colors text-left group"
                  title="Click to view add-on definition in glossary"
                >
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="group-hover:text-blue-700">{addon.name}</span>
                  <Info className="w-2.5 h-2.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Validity Footer */}
        {plan.valid_until && (
          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2 mb-4">
            Quote valid until: <span className="font-mono text-slate-600">{plan.valid_until.substring(0, 10)}</span>
          </div>
        )}
      </div>

      {/* Card Actions */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
        <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isCompared}
            onChange={() => onToggleCompare(plan)}
            className="rounded text-blue-600 focus:ring-blue-500"
          />
          <span>Compare</span>
        </label>

        <button
          onClick={() => onSelectPlan(plan)}
          disabled={plan.is_expired}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors"
        >
          <span>{plan.is_expired ? 'Expired' : 'Choose Plan'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
