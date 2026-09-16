import type {
  NetworkHealth,
  PortfolioResponse,
  RouteEvaluationResponse,
  RouteIntent,
  Transaction,
} from "./types";

import {
  DEMO_MODE,
  getDemoBackendHealth,
  getDemoExecution,
  getDemoNetworkHealth,
  getDemoPortfolio,
  getDemoRouteEvaluation,
  getDemoTransactions,
} from "./demo";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

async function request<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `API request failed with status ${response.status}`;

    try {
      const errorData = await response.json();

      if (typeof errorData?.detail === "string") {
        message = errorData.detail;
      } else if (typeof errorData?.message === "string") {
        message = errorData.message;
      }
    } catch {
      // Keep the default HTTP error message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/**
 * Demo mode is intentionally centralized here.
 *
 * Every data-producing frontend API function switches to the demo
 * dataset when NEXT_PUBLIC_DEMO_MODE=true.
 *
 * That means pages/components do not need their own demo branches.
 */

export async function evaluateRoutes(
  intent: RouteIntent,
): Promise<RouteEvaluationResponse> {
  if (DEMO_MODE) {
    return getDemoRouteEvaluation(intent);
  }

  return request<RouteEvaluationResponse>("/api/routes/evaluate", {
    method: "POST",
    body: JSON.stringify(intent),
  });
}

export async function getNetworkHealth(): Promise<NetworkHealth[]> {
  if (DEMO_MODE) {
    return getDemoNetworkHealth();
  }

  return request<NetworkHealth[]>("/api/network/health");
}

export async function getPortfolio(): Promise<PortfolioResponse> {
  if (DEMO_MODE) {
    return getDemoPortfolio();
  }

  return request<PortfolioResponse>("/api/portfolio");
}

export async function getTransactions(): Promise<Transaction[]> {
  if (DEMO_MODE) {
    return getDemoTransactions();
  }

  return request<Transaction[]>("/api/transactions");
}

export async function executeRoute(
  routeId: string,
): Promise<Transaction> {
  if (DEMO_MODE) {
    return getDemoExecution(routeId);
  }

  return request<Transaction>("/api/execute", {
    method: "POST",
    body: JSON.stringify({ route_id: routeId }),
  });
}

export async function getBackendHealth(): Promise<{ status: string }> {
  if (DEMO_MODE) {
    return getDemoBackendHealth();
  }

  return request<{ status: string }>("/api/health");
}
