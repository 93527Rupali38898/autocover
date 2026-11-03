import {
  Vehicle,
  ComparisonResponse,
  Policy,
  TestCustomersData,
  GlossaryData
} from '../types';

const API_BASE = '/api';

export async function fetchVehicle(regNo: string): Promise<Vehicle> {
  const res = await fetch(`${API_BASE}/vehicles/${encodeURIComponent(regNo)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Vehicle not found for '${regNo}'`);
  }
  return res.json();
}

export async function updateVehicle(regNo: string, data: Partial<Vehicle>): Promise<Vehicle> {
  const res = await fetch(`${API_BASE}/vehicles/${encodeURIComponent(regNo)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update vehicle details');
  }
  return res.json();
}

export async function fetchTestCustomers(): Promise<TestCustomersData> {
  const res = await fetch(`${API_BASE}/test-customers`);
  if (!res.ok) throw new Error('Failed to load test customers');
  return res.json();
}

export async function fetchComparisonQuotes(
  regNo: string,
  failA: boolean = false,
  failD: boolean = false
): Promise<ComparisonResponse> {
  const params = new URLSearchParams();
  if (failA) params.set('fail_provider_a', 'true');
  if (failD) params.set('fail_provider_d', 'true');

  const res = await fetch(`${API_BASE}/quotes/compare/${encodeURIComponent(regNo)}?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to collect quotes');
  }
  return res.json();
}

export async function fetchGlossary(): Promise<GlossaryData> {
  const res = await fetch(`${API_BASE}/quotes/glossary`);
  if (!res.ok) throw new Error('Failed to fetch add-on glossary');
  return res.json();
}

export async function createPolicy(policyData: {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  registration_number: string;
  provider_code: string;
  provider_name: string;
  plan_name: string;
  coverage_type: string;
  idv: number;
  base_premium: number;
  gst_amount: number;
  total_premium: number;
  addons: string[];
}): Promise<Policy> {
  const res = await fetch(`${API_BASE}/policies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(policyData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to issue policy');
  }
  return res.json();
}

export async function fetchPolicies(): Promise<Policy[]> {
  const res = await fetch(`${API_BASE}/policies`);
  if (!res.ok) throw new Error('Failed to fetch policies');
  return res.json();
}

export async function fetchExpiringPolicies(): Promise<Policy[]> {
  const res = await fetch(`${API_BASE}/policies/expiring`);
  if (!res.ok) throw new Error('Failed to fetch expiring policies');
  return res.json();
}

export async function seedDemoPolicies(): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/policies/seed-demo`, {
    method: 'POST'
  });
  return res.json();
}
