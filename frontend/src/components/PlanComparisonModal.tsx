import React from 'react';
import { X, Check, Minus, ArrowRight, Shield, Award } from 'lucide-react';
import { NormalizedPlan } from '../types';

interface PlanComparisonModalProps {
  plans: NormalizedPlan[];
  isOpen: boolean;
  onClose: () => void;
  onRemovePlan: (planId: string) => void;
  onSelectPlan: (plan: NormalizedPlan) => void;
}

export const PlanComparisonModal: React.FC<PlanComparisonModalProps> = ({
  plans,
  isOpen,
  onClose,
  onRemovePlan,
  onSelectPlan,
}) => {
  if (!isOpen || plans.length === 0) return null;

  const standardAddonKeys = [
    { code: 'ZERO_DEP', label: 'Zero Depreciation' },
    { code: 'RSA', label: '24x7 Roadside Assistance' },
    { code: 'ENGINE_PROTECT', label: 'Engine & Gearbox Protection' },
    { code: 'RETURN_TO_INVOICE', label: 'Return to Invoice (RTI)' },
    { code: 'KEY_REPLACEMENT', label: 'Key Replacement' },
    { code: 'CONSUMABLES', label: 'Consumables Cover' }
  ];

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base">Side-by-Side Plan Comparison ({plans.length} of 3)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Table */}
        <div className="overflow-x-auto p-6 flex-1">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4 border-b border-slate-200">
                  Plan Attribute
                </th>
                {plans.map((p) => (
                  <th key={p.id} className="p-3 text-left w-1/4 border-b border-slate-200 bg-slate-50/60 rounded-t-xl relative">
                    <button
                      onClick={() => onRemovePlan(p.id)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-rose-600 p-1 rounded-full hover:bg-slate-200"
                      title="Remove from comparison"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-semibold text-slate-500 block uppercase">{p.provider_name}</span>
                    <h4 className="font-bold text-sm text-slate-900 mt-0.5">{p.plan_name}</h4>
                    <div className="mt-2 text-lg font-black text-slate-900 font-mono">
                      {formatCurrency(p.total_premium)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              <tr>
                <td className="p-3 font-semibold text-slate-700">Value for Money Score</td>
                {plans.map((p) => (
                  <td key={p.id} className="p-3">
                    <span className="font-bold text-sm bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200">
                      {p.value_score} / 100
                    </span>
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-3 font-semibold text-slate-700">Insured Declared Value (IDV)</td>
                {plans.map((p) => (
                  <td key={p.id} className="p-3 font-bold font-mono text-slate-800">
                    {formatCurrency(p.idv)}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-3 font-semibold text-slate-700">Base Premium (Excl. Tax)</td>
                {plans.map((p) => (
                  <td key={p.id} className="p-3 font-mono text-slate-600">
                    {formatCurrency(p.base_premium)}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-3 font-semibold text-slate-700">GST (18%)</td>
                {plans.map((p) => (
                  <td key={p.id} className="p-3 font-mono text-slate-600">
                    {formatCurrency(p.gst_amount)}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="p-3 font-semibold text-slate-700">Coverage Type</td>
                {plans.map((p) => (
                  <td key={p.id} className="p-3 font-medium text-slate-800">
                    {p.coverage_type}
                  </td>
                ))}
              </tr>

              {/* Add-ons Comparison Matrix */}
              <tr className="bg-slate-50 font-bold text-slate-600">
                <td colSpan={plans.length + 1} className="p-2.5 uppercase tracking-wider text-[11px]">
                  Add-on Coverage Matrix
                </td>
              </tr>

              {standardAddonKeys.map((addon) => (
                <tr key={addon.code}>
                  <td className="p-3 font-medium text-slate-700">{addon.label}</td>
                  {plans.map((p) => {
                    const hasAddon = p.addons.some((a) => a.code === addon.code);
                    return (
                      <td key={p.id} className="p-3">
                        {hasAddon ? (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Included</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Minus className="w-4 h-4 text-slate-300 shrink-0" />
                            <span>Not Included</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Actions Row */}
              <tr>
                <td className="p-3 font-semibold text-slate-700">Action</td>
                {plans.map((p) => (
                  <td key={p.id} className="p-3">
                    <button
                      onClick={() => {
                        onClose();
                        onSelectPlan(p);
                      }}
                      className="w-full flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-xl transition-colors shadow-sm"
                    >
                      <span>Choose</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

