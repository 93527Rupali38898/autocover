import React, { useState, useEffect } from 'react';
import { Search, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

interface VehicleLookupProps {
  onSearch: (regNo: string) => void;
  isLoading: boolean;
  error?: string | null;
  initialValue?: string;
}

export const VehicleLookup: React.FC<VehicleLookupProps> = ({
  onSearch,
  isLoading,
  error,
  initialValue = ''
}) => {
  const [regInput, setRegInput] = useState(initialValue);
  const [formatError, setFormatError] = useState<string | null>(null);

  useEffect(() => {
    if (initialValue) {
      setRegInput(initialValue);
    }
  }, [initialValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegInput(e.target.value.toUpperCase());
    setFormatError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = regInput.replace(/[^A-Za-z0-9]/g, '');

    if (!clean) {
      setFormatError('Please enter a vehicle registration number');
      return;
    }

    // Basic format check (at least 6 alphanumeric characters)
    if (clean.length < 6) {
      setFormatError('Please enter a valid Indian vehicle registration number (e.g. WB02AB1234)');
      return;
    }

    onSearch(regInput.trim());
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
      <div className="max-w-3xl mx-auto text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Compare Insurance Quotes in Seconds
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Enter your vehicle registration number once. We collect plans from four providers, normalize the terms, and find your best deal.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
        <div className="relative flex items-center shadow-md rounded-xl overflow-hidden border-2 border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          {/* License plate IND badge */}
          <div className="bg-blue-700 text-white flex flex-col items-center justify-center px-3 py-3 select-none">
            <span className="text-[10px] font-bold tracking-widest">IND</span>
            <span className="text-[14px] leading-none">🇮🇳</span>
          </div>

          {/* Input field */}
          <input
            type="text"
            value={regInput}
            onChange={handleInputChange}
            placeholder="e.g. WB 02 AB 1234 or MH12EF4321"
            className="w-full px-4 py-3.5 text-lg font-mono font-bold tracking-wider text-slate-800 placeholder-slate-400 focus:outline-none uppercase bg-white"
            disabled={isLoading}
          />

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-6 py-4 flex items-center gap-2 transition-colors shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="hidden sm:inline">Looking up...</span>
              </>
            ) : (
              <>
                <span>Get Quotes</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Validation or API error message */}
        {(formatError || error) && (
          <div className="mt-3 flex items-start gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3 text-left animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{formatError || error}</p>
              <p className="text-rose-500 mt-0.5">
                Hint: You can select one of the test profiles above (e.g. Rahul Sen: WB 02 AB 1234).
              </p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

