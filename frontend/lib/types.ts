export type Preference =
  | "lowest_cost"
  | "fastest"
  | "balanced"
  | "reliability";

export interface RouteIntent {
  source_chain: string;
  destination_chain: string;
  asset: string;
  amount: number;
  preference: Preference;
}

export interface Route {
  id: string;
  path: string[];
  provider: string;

  cost: number;
  latency_seconds: number;
  liquidity: number;
  slippage: number;
  reliability: number;

  hops: number;

  pareto_optimal: boolean;
  recommended: boolean;

  status?: string;
  security_assumptions?: string[];
}

export interface RouteEvaluationResponse {
  request_id: string;

  source_chain: string;
  destination_chain: string;
  asset: string;
  amount: number;
  preference: Preference;

  routes: Route[];

  recommended_route_id?: string;

  explanation?: string;
}

export interface NetworkHealth {
  chain: string;
  status: "operational" | "degraded" | "offline" | "unknown";
  latency_ms?: number;
  congestion?: number;
}

export interface PortfolioAsset {
  asset: string;
  chain: string;
  balance: number;
  value_usd: number;
}

export interface PortfolioResponse {
  total_value_usd: number;
  change_24h?: number;
  assets: PortfolioAsset[];
}

export interface Transaction {
  id: string;
  route_id?: string;

  source_chain: string;
  destination_chain: string;

  asset: string;
  amount: number;

  status: "pending" | "completed" | "failed";

  cost?: number;
  latency_seconds?: number;

  created_at: string;
}