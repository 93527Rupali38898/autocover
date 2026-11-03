import React, { useState } from 'react';
import {
  Car,
  Calendar,
  MapPin,
  Fuel,
  Cpu,
  ShieldCheck,
  Edit3,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Save
} from 'lucide-react';
import { Vehicle } from '../types';

interface VehicleCardProps {
  vehicle: Vehicle;
  onProceedToQuotes: () => void;
  onUpdateVehicle: (updated: Partial<Vehicle>) => Promise<void>;
  isLoadingQuotes: boolean;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onProceedToQuotes,
  onUpdateVehicle,
  isLoadingQuotes,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    make: vehicle.make,
    model: vehicle.model,
    variant: vehicle.variant,
    fuel_type: vehicle.fuel_type || 'Petrol',
    engine_cc: vehicle.engine_cc,
    rto: vehicle.rto,
    ex_showroom_price: vehicle.ex_showroom_price,
    ncb_percent: vehicle.ncb_percent,
    current_policy_expiry: vehicle.current_policy_expiry || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateVehicle(formData);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(vehicle.ex_showroom_price);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center">
            <Car className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold tracking-wider text-amber-400">
                {vehicle.registration_number}
              </span>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                Verified Registry Data
              </span>
            </div>
            <h3 className="text-base font-semibold text-white">
              {vehicle.make} {vehicle.model} <span className="text-slate-400 font-normal">{vehicle.variant}</span>
            </h3>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isEditing ? 'Cancel Edit' : 'Edit Details'}</span>
        </button>
      </div>

      {/* Editing Form */}
      {isEditing ? (
        <form onSubmit={handleSave} className="p-6 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-blue-600" />
              Correct Vehicle Information
            </h4>
            <span className="text-xs text-slate-500">Updates will apply to quote calculations</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Make</label>
              <input
                type="text"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Model</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Variant</label>
              <input
                type="text"
                value={formData.variant}
                onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Fuel Type</label>
              <select
                value={formData.fuel_type}
                onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="CNG">CNG</option>
                <option value="Electric">Electric</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Engine Capacity (CC)</label>
              <input
                type="number"
                value={formData.engine_cc}
                onChange={(e) => setFormData({ ...formData, engine_cc: parseInt(e.target.value) || 0 })}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">NCB Discount (%)</label>
              <input
                type="number"
                min="0"
                max="50"
                step="5"
                value={formData.ncb_percent}
                onChange={(e) => setFormData({ ...formData, ncb_percent: parseInt(e.target.value) || 0 })}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save & Update'}</span>
            </button>
          </div>
        </form>
      ) : null}

      {/* Grid of Verified Specifications */}
      <div className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Fuel className="w-3.5 h-3.5 text-slate-400" />
              <span>Fuel Type</span>
            </div>
            <span className="font-semibold text-sm text-slate-800">
              {vehicle.fuel_type || 'Petrol'}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Cpu className="w-3.5 h-3.5 text-slate-400" />
              <span>Engine Capacity</span>
            </div>
            <span className="font-semibold text-sm text-slate-800">
              {vehicle.engine_cc} cc
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Registration Date</span>
            </div>
            <span className="font-semibold text-sm text-slate-800 font-mono">
              {vehicle.registration_date}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>RTO Location</span>
            </div>
            <span className="font-semibold text-sm text-slate-800">
              {vehicle.rto}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>NCB Discount</span>
            </div>
            <span className="font-semibold text-sm text-emerald-600 font-mono">
              {vehicle.ncb_percent}%
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <span>Ex-Showroom Price</span>
            </div>
            <span className="font-semibold text-sm text-slate-800">
              {formattedPrice}
            </span>
          </div>
        </div>

        {/* Policy Expiry Status & Action Bar */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {vehicle.is_policy_expired ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Existing policy expired on {vehicle.formatted_expiry || 'N/A'}</span>
              </div>
            ) : vehicle.days_to_expiry !== undefined && vehicle.days_to_expiry <= 15 ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Existing policy expires in {vehicle.days_to_expiry} days ({vehicle.formatted_expiry})</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Policy valid until {vehicle.formatted_expiry || 'Not specified'}</span>
              </div>
            )}
          </div>

          <button
            onClick={onProceedToQuotes}
            disabled={isLoadingQuotes}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all hover:shadow-lg disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            <span>{isLoadingQuotes ? 'Collecting Plans...' : 'Compare 4 Insurers'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
