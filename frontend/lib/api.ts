import type {
  NetworkHealth,
  PortfolioResponse,
  RouteEvaluationResponse,
  RouteIntent,
  Transaction,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(
  /\/$/,
  ""
);

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  if (!API_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not configured."
    );
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    }
  );

  if (!response.ok) {
    let message = `API request failed with status ${response.status}`;

    try {
      const errorData = await response.json();

      if (
        typeof errorData?.detail === "string"
      ) {
        message = errorData.detail;
      } else if (
        typeof errorData?.message === "string"
      ) {
        message = errorData.message;
      }
    } catch {
      // Keep the default HTTP error message.
    }

    throw new Error(message);
  }

  /*
   * Some successful endpoints may return an empty response.
   */
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/**
 * Evaluate execution routes.
 *
 * The frontend sends only the user's execution intent.
 * Route discovery, provider selection, scoring,
 * Pareto optimization and recommendation belong
 * to the backend.
 */
export async function evaluateRoutes(
  intent: RouteIntent
): Promise<RouteEvaluationResponse> {
  return request<RouteEvaluationResponse>(
    "/api/routes/evaluate",
    {
      method: "POST",
      body: JSON.stringify(intent),
    }
  );
}

/**
 * Retrieve current network health.
 *
 * All network health values must come from the backend.
 */
export async function getNetworkHealth(): Promise<
  NetworkHealth[]
> {
  return request<NetworkHealth[]>(
    "/api/network/health"
  );
}

/**
 * Retrieve portfolio information.
 *
 * All balances and valuation data must come
 * from the backend.
 */
export async function getPortfolio(): Promise<PortfolioResponse> {
  return request<PortfolioResponse>(
    "/api/portfolio"
  );
}

/**
 * Retrieve transaction history.
 */
export async function getTransactions(): Promise<
  Transaction[]
> {
  return request<Transaction[]>(
    "/api/transactions"
  );
}

/**
 * Execute a previously evaluated route.
 *
 * The backend is responsible for actual execution.
 */
export async function executeRoute(
  routeId: string
): Promise<Transaction> {
  return request<Transaction>(
    "/api/execute",
    {
      method: "POST",
      body: JSON.stringify({
        route_id: routeId,
      }),
    }
  );
}

/**
 * Check backend availability.
 */
export async function getBackendHealth(): Promise<{
  status: string;
}> {
  return request<{ status: string }>(
    "/api/health"
  );
}