import type {
  NetworkHealth,
  PortfolioResponse,
  RouteEvaluationResponse,
  RouteIntent,
  Transaction,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  if (!API_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not configured."
    );
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `API request failed with status ${response.status}`;

    try {
      const errorData = await response.json();

      if (errorData?.detail) {
        message = errorData.detail;
      } else if (errorData?.message) {
        message = errorData.message;
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  return response.json();
}

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

export async function getNetworkHealth(): Promise<
  NetworkHealth[]
> {
  return request<NetworkHealth[]>("/api/network/health");
}

export async function getPortfolio(): Promise<PortfolioResponse> {
  return request<PortfolioResponse>("/api/portfolio");
}

export async function getTransactions(): Promise<Transaction[]> {
  return request<Transaction[]>("/api/transactions");
}

export async function executeRoute(
  routeId: string
): Promise<Transaction> {
  return request<Transaction>("/api/execute", {
    method: "POST",
    body: JSON.stringify({
      route_id: routeId,
    }),
  });
}

export async function getBackendHealth(): Promise<{
  status: string;
}> {
  return request<{ status: string }>("/api/health");
}
