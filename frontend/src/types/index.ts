export interface Vehicle {
  registration_number: string;
  make: string;
  model: string;
  variant: string;
  fuel_type: string;
  engine_cc: number;
  registration_date: string;
  rto: string;
  ex_showroom_price: number;
  current_policy_expiry?: string;
  claims_last_year: number;
  ncb_percent: number;
  formatted_expiry?: string;
  is_policy_expired: boolean;
  days_to_expiry?: number;
}

export interface NormalizedAddon {
  code: string;
  name: string;
  description: string;
  original_name: string;
}

export interface NormalizedPlan {
  id: string;
  provider_code: string;
  provider_name: string;
  plan_name: string;
  coverage_type: string;
  idv: number;
  base_premium: number;
  gst_amount: number;
  total_premium: number;
  addons: NormalizedAddon[];
  valid_until?: string;
  is_expired: boolean;
  value_score: number;
  badges: string[];
  raw_metadata: Record<string, any>;
}

export interface ProviderFetchStatus {
  provider_code: string;
  provider_name: string;
  format: string;
  status: 'SUCCESS' | 'DECLINED' | 'FAILED' | 'NO_QUOTE' | 'TIMEOUT';
  response_time_ms: number;
  error_message?: string;
  plans_count: number;
}

export interface ComparisonResponse {
  vehicle: Vehicle;
  plans: NormalizedPlan[];
  provider_statuses: ProviderFetchStatus[];
  reference_date: string;
  summary: {
    total_plans_found: number;
    valid_plans_count: number;
    lowest_premium: number;
    highest_idv: number;
    best_value_plan?: string;
    active_providers_count: number;
  };
}

export interface Policy {
  id: number;
  policy_number: string;
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
  policy_start_date: string;
  policy_expiry_date: string;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
  days_until_expiry?: number;
  created_at: string;
}

export interface TestCustomer {
  name: string;
  phone: string;
  registration_number: string;
}

export interface TestCustomersData {
  reference_date: string;
  customers: TestCustomer[];
  also_try: string[];
}

export interface GlossarySource {
  insurer: string;
  url: string;
  referenced_date: string;
  notes: string;
}

export interface StandardAddonInfo {
  code: string;
  name: string;
  category: string;
  description: string;
  real_world_names: Record<string, string>;
  provider_mappings: Record<string, string>;
  aliases: string[];
}

export interface GlossaryData {
  sources: GlossarySource[];
  standard_addons: Record<string, StandardAddonInfo>;
}

