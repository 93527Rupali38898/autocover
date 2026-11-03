import React, { useState } from 'react';
import {
  ShieldCheck,
  X,
  Car,
  User,
  Phone,
  Mail,
  CheckCircle2,
  Calendar,
  Lock,
  ArrowRight,
  FileText
} from 'lucide-react';
import { NormalizedPlan, Vehicle, Policy } from '../types';

interface CheckoutModalProps {
  plan: NormalizedPlan | null;
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmPolicy: (policyData: any) => Promise<Policy>;
  onPolicyIssued: (policy: Policy) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  plan,
  vehicle,
  isOpen,
  onClose,
  onConfirmPolicy,
  onPolicyIssued
}) => {
  const [customerName, setCustomerName] = useState('Rahul Sen');
  const [customerPhone, setCustomerPhone] = useState('+91 98300 11111');
  const [customerEmail, setCustomerEmail] = useState('rahul.sen@example.com');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issuedPolicy, setIssuedPolicy] = useState<Policy | null>(null);

  if (!isOpen || !plan || !vehicle) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const policy = await onConfirmPolicy({
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        registration_number: vehicle.registration_number,
        provider_code: plan.provider_code,
        provider_name: plan.provider_name,
        plan_name: plan.plan_name,
        coverage_type: plan.coverage_type,
        idv: plan.idv,
        base_premium: plan.base_premium,
        gst_amount: plan.gst_amount,
        total_premium: plan.total_premium,
        addons: plan.addons.map((a) => a.name)
      });
      setIssuedPolicy(policy);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    if (issuedPolicy) {
      onPolicyIssued(issuedPolicy);
      setIssuedPolicy(null);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">
              {issuedPolicy ? 'Policy Issued Successfully' : 'Review & Confirm Policy'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Screen */}
        {issuedPolicy ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-sm animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Policy Reference Number
              </span>
              <div className="text-2xl font-mono font-black text-slate-900 mt-1">
                {issuedPolicy.policy_number}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Saved and active in policy dashboard. No actual payment required.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Insured Vehicle:</span>
                <span className="font-bold text-slate-800">{vehicle.registration_number} ({vehicle.make} {vehicle.model})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Provider & Plan:</span>
                <span className="font-bold text-slate-800">{issuedPolicy.provider_name} - {issuedPolicy.plan_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">IDV Asset Cover:</span>
                <span className="font-mono font-semibold text-slate-800">{formattedIdv}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Policy Validity:</span>
                <span className="font-mono text-slate-800">{issuedPolicy.policy_start_date} to {issuedPolicy.policy_expiry_date}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900">
                <span>Total Premium Paid:</span>
                <span className="font-mono text-emerald-700 text-sm">{formattedTotal}</span>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <span>View in Policy Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Confirmation Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Plan Summary Banner */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">{plan.provider_name}</span>
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {vehicle.registration_number}
                </span>
              </div>
              <h4 className="font-bold text-base text-slate-900">{plan.plan_name}</h4>
              <p className="text-xs text-slate-500">{vehicle.make} {vehicle.model} {vehicle.variant} · IDV {formattedIdv}</p>

              <div className="mt-3 pt-3 border-t border-slate-200/80 flex justify-between text-xs font-semibold">
                <span>Total Premium (incl. 18% GST):</span>
                <span className="text-base font-black text-slate-900 font-mono">{formattedTotal}</span>
              </div>
            </div>

            {/* Customer Details Form */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Policyholder Details
              </h5>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Mobile Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Legal / Mock Note */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Simulated purchase environment. Policy will be saved to your local database immediately.</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 px-3 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-2/3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                <span>{isSubmitting ? 'Issuing Policy...' : 'Confirm & Issue Policy'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
