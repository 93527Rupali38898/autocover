import React, { useState, useEffect } from 'react';
import {
  Shield,
  Filter,
  ArrowUpDown,
  BookOpen,
  Sparkles,
  Layers,
  FileCheck,
  AlertCircle,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { TestCustomerSelector } from './components/TestCustomerSelector';
import { VehicleLookup } from './components/VehicleLookup';
import { VehicleCard } from './components/VehicleCard';
import { ProviderStatusCard } from './components/ProviderStatusCard';
import { PlanCard } from './components/PlanCard';
import { PlanComparisonModal } from './components/PlanComparisonModal';
import { AddonGlossaryModal } from './components/AddonGlossaryModal';
import { CheckoutModal } from './components/CheckoutModal';
import { PolicyDashboard } from './components/PolicyDashboard';

import {
  Vehicle,
  NormalizedPlan,
  ComparisonResponse,
  Policy,
  TestCustomer,
  GlossaryData
} from './types';

import {
  fetchVehicle,
  updateVehicle,
  fetchTestCustomers,
  fetchComparisonQuotes,
  fetchGlossary,
  createPolicy,
  fetchPolicies,
  seedDemoPolicies
} from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<'compare' | 'policies' | 'glossary'>('compare');
  const [testCustomers, setTestCustomers] = useState<TestCustomer[]>([]);
  const [alsoTry, setAlsoTry] = useState<string[]>([]);
  const [selectedReg, setSelectedReg] = useState<string>('WB02AB1234');

  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null);
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [glossary, setGlossary] = useState<GlossaryData | null>(null);

  const [isLoadingVehicle, setIsLoadingVehicle] = useState(false);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [vehicleError, setVehicleError] = useState<string | null>(null);

  // Failure simulation toggles
  const [failA, setFailA] = useState(false);
  const [failD, setFailD] = useState(false);

  // Filters and Sorting
  const [sortBy, setSortBy] = useState<'value_score' | 'price_asc' | 'price_desc' | 'idv_desc'>('value_score');
  const [coverageFilter, setCoverageFilter] = useState<string>('ALL');
  const [addonFilter, setAddonFilter] = useState<string>('ALL');
  const [providerFilter, setProviderFilter] = useState<string>('ALL');
  const [hideExpired, setHideExpired] = useState<boolean>(false);

  // Modal states
  const [comparedPlans, setComparedPlans] = useState<NormalizedPlan[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<NormalizedPlan | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isGlossaryModalOpen, setIsGlossaryModalOpen] = useState(false);
  const [glossarySelectedCode, setGlossarySelectedCode] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [custData, glossData, polList] = await Promise.all([
        fetchTestCustomers().catch(() => ({ customers: [], also_try: [], reference_date: '2026-11-10' })),
        fetchGlossary().catch(() => null),
        fetchPolicies().catch(() => [])
      ]);
      setTestCustomers(custData.customers || []);
      setAlsoTry(custData.also_try || []);
      if (glossData) setGlossary(glossData);
      setPolicies(polList || []);

      // Auto-lookup the first test customer for instant gratification
      if (custData.customers && custData.customers.length > 0) {
        handleSearchVehicle(custData.customers[0].registration_number);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchVehicle = async (regNo: string) => {
    setIsLoadingVehicle(true);
    setVehicleError(null);
    setSelectedReg(regNo);
    setComparison(null);
    setComparedPlans([]);

    try {
      const v = await fetchVehicle(regNo);
      setCurrentVehicle(v);
      // Auto-trigger comparison discovery
      handleFetchQuotes(regNo, v);
    } catch (err: any) {
      setCurrentVehicle(null);
      setVehicleError(err.message || 'Vehicle not found');
    } finally {
      setIsLoadingVehicle(false);
    }
  };

  const handleFetchQuotes = async (regNo: string, vehicleData?: Vehicle) => {
    setIsLoadingQuotes(true);
    try {
      const comp = await fetchComparisonQuotes(regNo, failA, failD);
      setComparison(comp);
      if (comp.vehicle && !vehicleData) {
        setCurrentVehicle(comp.vehicle);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoadingQuotes(false);
    }
  };

  const handleUpdateVehicle = async (updatedData: Partial<Vehicle>) => {
    if (!currentVehicle) return;
    try {
      const updated = await updateVehicle(currentVehicle.registration_number, updatedData);
      setCurrentVehicle(updated);
      // Re-trigger quote discovery with updated vehicle specs
      handleFetchQuotes(currentVehicle.registration_number, updated);
    } catch (err: any) {
      alert(err.message || 'Failed to update vehicle');
    }
  };

  const handleToggleCompare = (plan: NormalizedPlan) => {
    if (comparedPlans.some((p) => p.id === plan.id)) {
      setComparedPlans(comparedPlans.filter((p) => p.id !== plan.id));
    } else {
      if (comparedPlans.length >= 3) {
        alert('You can compare a maximum of 3 plans simultaneously.');
        return;
      }
      const updated = [...comparedPlans, plan];
      setComparedPlans(updated);
      if (updated.length >= 2) {
        setIsCompareModalOpen(true);
      }
    }
  };

  const handleRemoveComparePlan = (planId: string) => {
    setComparedPlans(comparedPlans.filter((p) => p.id !== planId));
  };

  const handleSelectPlan = (plan: NormalizedPlan) => {
    setSelectedPlanForCheckout(plan);
    setIsCheckoutModalOpen(true);
  };

  const handlePolicyConfirmed = async (policyData: any) => {
    const newPolicy = await createPolicy(policyData);
    const updatedPolicies = await fetchPolicies();
    setPolicies(updatedPolicies);
    return newPolicy;
  };

  const handleSeedDemo = async () => {
    await seedDemoPolicies();
    const updated = await fetchPolicies();
    setPolicies(updated);
  };

  const handleOpenGlossaryForAddon = (code: string) => {
    setGlossarySelectedCode(code);
    setIsGlossaryModalOpen(true);
  };

  // Filtered & Sorted Plans
  const filteredPlans = (comparison?.plans || []).filter((p) => {
    if (hideExpired && p.is_expired) return false;
    if (coverageFilter !== 'ALL' && p.coverage_type !== coverageFilter) return false;
    if (providerFilter !== 'ALL' && p.provider_code !== providerFilter) return false;
    if (addonFilter !== 'ALL' && !p.addons.some((a) => a.code === addonFilter)) return false;
    return true;
  });

  const sortedPlans = [...filteredPlans].sort((a, b) => {
    if (sortBy === 'value_score') return b.value_score - a.value_score;
    if (sortBy === 'price_asc') return a.total_premium - b.total_premium;
    if (sortBy === 'price_desc') return b.total_premium - a.total_premium;
    if (sortBy === 'idv_desc') return b.idv - a.idv;
    return 0;
  });

  const expiringCount = policies.filter(
    (p) => p.status === 'EXPIRING_SOON' || (p.days_until_expiry !== undefined && p.days_until_expiry <= 15 && p.days_until_expiry >= 0)
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        policiesCount={policies.length}
        expiringCount={expiringCount}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* VIEW 1: COMPARE PLANS */}
        {activeTab === 'compare' && (
          <div className="space-y-6">
            {/* Quick Profile Chips */}
            <TestCustomerSelector
              customers={testCustomers}
              alsoTry={alsoTry}
              onSelectReg={handleSearchVehicle}
              selectedReg={selectedReg}
            />

            {/* Vehicle Search Box */}
            <VehicleLookup
              onSearch={handleSearchVehicle}
              isLoading={isLoadingVehicle}
              error={vehicleError}
              initialValue={selectedReg}
            />

            {/* Vehicle Details Card */}
            {currentVehicle && (
              <VehicleCard
                vehicle={currentVehicle}
                onProceedToQuotes={() => handleFetchQuotes(currentVehicle.registration_number, currentVehicle)}
                onUpdateVehicle={handleUpdateVehicle}
                isLoadingQuotes={isLoadingQuotes}
              />
            )}

            {/* Provider Integration & Health Monitor */}
            {comparison && (
              <ProviderStatusCard
                statuses={comparison.provider_statuses}
                failA={failA}
                setFailA={setFailA}
                failD={failD}
                setFailD={setFailD}
                onRefresh={() => handleFetchQuotes(selectedReg, currentVehicle || undefined)}
                isLoading={isLoadingQuotes}
              />
            )}

            {/* Loading Spinner for Quote Aggregation */}
            {isLoadingQuotes && (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">
                  Collecting Quotes from 4 Insurance Providers...
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Parsing JSON API, HTML DOM, PDF Tariff Rate Card & CSV export into unified format.
                </p>
              </div>
            )}

            {/* Comparison Controls & Plans Grid */}
            {!isLoadingQuotes && comparison && (
              <div className="space-y-4">
                {/* Filter and Sort Toolbar */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  {/* Results Count & Badges */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {sortedPlans.length} Plans Available
                    </span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                      from {comparison.summary.active_providers_count} providers
                    </span>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {/* Coverage Filter */}
                    <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 font-medium">Coverage:</span>
                      <select
                        value={coverageFilter}
                        onChange={(e) => setCoverageFilter(e.target.value)}
                        className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
                      >
                        <option value="ALL">All Coverage</option>
                        <option value="COMPREHENSIVE">Comprehensive</option>
                        <option value="THIRD_PARTY">Third Party Only</option>
                      </select>
                    </div>

                    {/* Addon Filter */}
                    <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 font-medium">Add-on:</span>
                      <select
                        value={addonFilter}
                        onChange={(e) => setAddonFilter(e.target.value)}
                        className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
                      >
                        <option value="ALL">All Add-ons</option>
                        <option value="ZERO_DEP">Zero Depreciation</option>
                        <option value="RSA">24x7 RSA</option>
                        <option value="ENGINE_PROTECT">Engine Protect</option>
                        <option value="RETURN_TO_INVOICE">Return to Invoice</option>
                        <option value="KEY_REPLACEMENT">Key Replacement</option>
                        <option value="CONSUMABLES">Consumables</option>
                      </select>
                    </div>

                    {/* Provider Filter */}
                    <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 font-medium">Provider:</span>
                      <select
                        value={providerFilter}
                        onChange={(e) => setProviderFilter(e.target.value)}
                        className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
                      >
                        <option value="ALL">All Providers</option>
                        <option value="A">Provider A (SecureDrive)</option>
                        <option value="B">Provider B (AutoProtect)</option>
                        <option value="C">Provider C (National Shield)</option>
                        <option value="D">Provider D (DriveSure)</option>
                      </select>
                    </div>

                    {/* Sort Order */}
                    <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-400 font-medium">Sort:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
                      >
                        <option value="value_score">Best Value Score (Recommended)</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="idv_desc">IDV: High to Low</option>
                      </select>
                    </div>

                    {/* Hide Expired Checkbox */}
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 select-none">
                      <input
                        type="checkbox"
                        checked={hideExpired}
                        onChange={(e) => setHideExpired(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Hide Expired</span>
                    </label>
                  </div>
                </div>

                {/* Floating Compare Bar */}
                {comparedPlans.length > 0 && (
                  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-6">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-semibold">
                        {comparedPlans.length} of 3 plans selected for comparison
                      </span>
                    </div>

                    <button
                      onClick={() => setIsCompareModalOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-1.5 rounded-xl transition-colors shadow-sm"
                    >
                      Compare Now
                    </button>

                    <button
                      onClick={() => setComparedPlans([])}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Clear
                    </button>
                  </div>
                )}

                {/* Plans Grid */}
                {sortedPlans.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                    <Filter className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800">No Plans Match Current Filters</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Try adjusting your coverage or add-on filters to see more results.
                    </p>
                    <button
                      onClick={() => {
                        setCoverageFilter('ALL');
                        setAddonFilter('ALL');
                        setProviderFilter('ALL');
                        setHideExpired(false);
                      }}
                      className="mt-4 text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {sortedPlans.map((plan) => (
                      <PlanCard
                        key={plan.id}
                        plan={plan}
                        onSelectPlan={handleSelectPlan}
                        isCompared={comparedPlans.some((p) => p.id === plan.id)}
                        onToggleCompare={handleToggleCompare}
                        onOpenGlossary={handleOpenGlossaryForAddon}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: POLICY MANAGEMENT DASHBOARD */}
        {activeTab === 'policies' && (
          <PolicyDashboard
            policies={policies}
            onSeedDemo={handleSeedDemo}
            onGoToCompare={() => setActiveTab('compare')}
          />
        )}

        {/* VIEW 3: ADD-ON GLOSSARY */}
        {activeTab === 'glossary' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-600 flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Comprehensive Add-on Glossary & Reference Standard
                  </h2>
                  <p className="text-xs text-slate-500">
                    Researched and mapped against public car insurance policies from HDFC ERGO, Digit, and ICICI Lombard.
                  </p>
                </div>
              </div>
            </div>

            {glossary && (
              <AddonGlossaryModal
                glossary={glossary}
                isOpen={true}
                onClose={() => setActiveTab('compare')}
                selectedAddonCode={glossarySelectedCode}
              />
            )}
          </div>
        )}
      </main>

      {/* Side-by-Side Comparison Modal */}
      <PlanComparisonModal
        plans={comparedPlans}
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        onRemovePlan={handleRemoveComparePlan}
        onSelectPlan={handleSelectPlan}
      />

      {/* Add-on Glossary Popup Modal */}
      <AddonGlossaryModal
        glossary={glossary}
        isOpen={isGlossaryModalOpen}
        onClose={() => setIsGlossaryModalOpen(false)}
        selectedAddonCode={glossarySelectedCode}
      />

      {/* Checkout / Mock Purchase Modal */}
      <CheckoutModal
        plan={selectedPlanForCheckout}
        vehicle={currentVehicle}
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        onConfirmPolicy={handlePolicyConfirmed}
        onPolicyIssued={() => {
          setActiveTab('policies');
        }}
      />
    </div>
  );
}

export default App;
