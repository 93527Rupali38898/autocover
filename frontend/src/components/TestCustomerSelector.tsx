import React from 'react';
import { User, Sparkles, AlertCircle } from 'lucide-react';
import { TestCustomer } from '../types';

interface TestCustomerSelectorProps {
  customers: TestCustomer[];
  alsoTry: string[];
  onSelectReg: (regNo: string) => void;
  selectedReg: string;
}

export const TestCustomerSelector: React.FC<TestCustomerSelectorProps> = ({
  customers,
  alsoTry,
  onSelectReg,
  selectedReg,
}) => {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Quick Test Profiles (From Assignment Data)
          </h3>
        </div>
        <span className="text-xs text-slate-400">Click any card to auto-fill</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {customers.map((c, i) => {
          const isSelected = selectedReg.replace(/[^A-Za-z0-9]/g, '').toUpperCase() ===
            c.registration_number.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectReg(c.registration_number)}
              className={`text-left p-2.5 rounded-lg border transition-all text-xs ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-600'
                  : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">{c.name}</span>
              </div>
              <div className="mt-1 font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded w-fit">
                {c.registration_number}
              </div>
            </button>
          );
        })}
      </div>

      {alsoTry && alsoTry.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500 flex-wrap">
          <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-medium text-slate-600">Test edge cases:</span>
          {alsoTry.map((reg, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectReg(reg)}
              className="font-mono text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded border border-slate-200 transition-colors"
            >
              {reg} {reg.length < 8 ? '(Invalid format)' : '(Unregistered)'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

