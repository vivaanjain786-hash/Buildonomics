"use client";

import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Brain,
  CheckCircle2,
  ChevronRight,
  Command,
  GitBranch,
  LayoutDashboard,
  Network,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Wallet,
  AlertCircle,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  getBackendHealth,
  getNetworkHealth,
  getPortfolio,
  getTransactions,
} from "@/lib/api";

import type {
  NetworkHealth,
  PortfolioResponse,
  Transaction,
} from "@/lib/types";

const navItems = [
  {
    label: "Command Center",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    label: "Execute",
    icon: Send,
    path: "/execute",
  },
  {
    label: "Portfolio",
    icon: Wallet,
    path: "/portfolio",
  },
  {
    label: "Intelligence",
    icon: Brain,
    path: "/intelligence",
  },
  {
    label: "Transactions",
    icon: Activity,
    path: "/transactions",
  },
  {
    label: "Security",
    icon: ShieldCheck,
    path: "/security",
  },
];

type HealthState = {
  loading: boolean;
  data: NetworkHealth[];
  error: string | null;
};

type PortfolioState = {
  loading: boolean;
  data: PortfolioResponse | null;
  error: string | null;
};

type TransactionState = {
  loading: boolean;
  data: Transaction[];
  error: string | null;
};

export default function RouteXShell() {
  const router = useRouter();

  const [active, setActive] =
    useState("Command Center");

  const [sourceChain, setSourceChain] =
    useState("");

  const [destinationChain, setDestinationChain] =
    useState("");

  const [asset, setAsset] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [preference, setPreference] =
    useState("balanced");

  const [backendStatus, setBackendStatus] =
    useState<string | null>(null);

  const [health, setHealth] =
    useState<HealthState>({
      loading: true,
      data: [],
      error: null,
    });

  const [portfolio, setPortfolio] =
    useState<PortfolioState>({
      loading: true,
      data: null,
      error: null,
    });

  const [transactions, setTransactions] =
    useState<TransactionState>({
      loading: true,
      data: [],
      error: null,
    });

  /*
   * Load all Command Center data from the backend.
   *
   * No blockchain names, balances, transaction values,
   * network statuses or portfolio numbers are created here.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      const [
        backendResult,
        healthResult,
        portfolioResult,
        transactionResult,
      ] = await Promise.allSettled([
        getBackendHealth(),
        getNetworkHealth(),
        getPortfolio(),
        getTransactions(),
      ]);

      if (cancelled) {
        return;
      }

      if (
        backendResult.status === "fulfilled"
      ) {
        setBackendStatus(
          backendResult.value.status
        );
      } else {
        setBackendStatus(null);
      }

      if (
        healthResult.status === "fulfilled"
      ) {
        setHealth({
          loading: false,
          data: healthResult.value,
          error: null,
        });
      } else {
        setHealth({
          loading: false,
          data: [],
          error:
            healthResult.reason instanceof Error
              ? healthResult.reason.message
              : "Unable to load network health.",
        });
      }

      if (
        portfolioResult.status === "fulfilled"
      ) {
        setPortfolio({
          loading: false,
          data: portfolioResult.value,
          error: null,
        });
      } else {
        setPortfolio({
          loading: false,
          data: null,
          error:
            portfolioResult.reason instanceof Error
              ? portfolioResult.reason.message
              : "Unable to load portfolio.",
        });
      }

      if (
        transactionResult.status === "fulfilled"
      ) {
        setTransactions({
          loading: false,
          data: transactionResult.value,
          error: null,
        });
      } else {
        setTransactions({
          loading: false,
          data: [],
          error:
            transactionResult.reason instanceof Error
              ? transactionResult.reason.message
              : "Unable to load transactions.",
        });
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const go = (
    label: string,
    path: string
  ) => {
    setActive(label);
    router.push(path);
  };

  /*
   * Route intelligence requires a complete execution intent.
   *
   * We deliberately do not invent missing values.
   */
  const findPlan = () => {
    const parsedAmount = Number(amount);

    if (
      !sourceChain.trim() ||
      !destinationChain.trim() ||
      !asset.trim() ||
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0
    ) {
      return;
    }

    const params = new URLSearchParams();

    params.set(
      "source",
      sourceChain.trim()
    );

    params.set(
      "destination",
      destinationChain.trim()
    );

    params.set(
      "asset",
      asset.trim()
    );

    params.set(
      "amount",
      String(parsedAmount)
    );

    params.set(
      "preference",
      preference
    );

    router.push(
      `/intelligence?${params.toString()}`
    );
  };

  const totalValue =
    portfolio.data?.total_value_usd;

  const change24h =
    portfolio.data?.change_24h;

  const networkCount =
    health.data.length;

  const operationalCount =
    health.data.filter(
      (network) =>
        network.status === "operational"
    ).length;

  const portfolioAssets =
    portfolio.data?.assets ?? [];

  const recentTransactions =
    transactions.data.slice(0, 4);

  return (
    <div className="routex-app">

      <aside className="routex-sidebar">

        <button
          className="routex-brand"
          onClick={() =>
            go(
              "Command Center",
              "/"
            )
          }
          aria-label="Command Center"
        >
          <div className="routex-logo">
            RX
          </div>

          <div className="routex-brand-copy">
            <div className="routex-brand-name">
              RouteX
            </div>

            <div className="routex-brand-sub">
              Execution OS
            </div>
          </div>
        </button>

        <div className="routex-nav-label">
          Workspace
        </div>

        <nav className="routex-nav">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                className={`routex-nav-item ${
                  active === item.label
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  go(
                    item.label,
                    item.path
                  )
                }
              >
                <span className="routex-nav-icon">
                  <Icon
                    size={15}
                    strokeWidth={1.8}
                  />
                </span>

                <span className="routex-nav-text">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="routex-sidebar-spacer" />

        <div className="routex-network-box">

          <div className="routex-network-title">
            <span>Network</span>

            <span>
              {networkCount > 0
                ? `${operationalCount}/${networkCount}`
                : "—"}
            </span>
          </div>

          {health.loading && (
            <div className="routex-network-row">
              <span>
                Loading network data...
              </span>
            </div>
          )}

          {!health.loading &&
            health.data.length === 0 && (
              <div className="routex-network-row">
                <span>
                  No network data
                </span>
              </div>
            )}

          {!health.loading &&
            health.data.map(
              (network) => (
                <div
                  className="routex-network-row"
                  key={network.chain}
                >
                  <span
                    className={`routex-dot ${
                      network.status !==
                      "operational"
                        ? "inactive"
                        : ""
                    }`}
                  />

                  <span>
                    {network.chain}
                  </span>

                  <span className="routex-network-live">
                    {network.status}
                  </span>
                </div>
              )
            )}

        </div>

        <div className="routex-sidebar-bottom">

          <button
            className="routex-nav-item"
            onClick={() =>
              go(
                "Security",
                "/security"
              )
            }
          >
            <span className="routex-nav-icon">
              <Command
                size={15}
                strokeWidth={1.8}
              />
            </span>

            <span className="routex-nav-text">
              Settings
            </span>
          </button>

        </div>

      </aside>

      <main className="routex-main">

        <header className="routex-topbar">

          <div className="routex-breadcrumb">
            <span>RouteX</span>

            <ChevronRight size={12} />

            <strong>
              {active}
            </strong>
          </div>

          <div className="routex-top-actions">

            <button
              className="routex-icon-btn"
              aria-label="Search"
            >
              <Search
                size={15}
                strokeWidth={1.8}
              />
            </button>

            <button
              className="routex-icon-btn"
              aria-label="Notifications"
            >
              <Bell
                size={15}
                strokeWidth={1.8}
              />
            </button>

            <div className="routex-wallet">
              <span className="routex-wallet-dot" />

              <span>
                {backendStatus ??
                  "Backend unavailable"}
              </span>
            </div>

          </div>

        </header>

        <section className="routex-content">

          <div className="routex-heading-row">

            <div>

              <div className="routex-eyebrow">
                Cross-chain execution intelligence
              </div>

              <h1 className="routex-title">
                Command Center{" "}
                <span>
                  for execution.
                </span>
              </h1>

              <p className="routex-heading-copy">
                Turn a desired outcome into
                an explainable execution plan
                across fragmented L1s, L2s,
                bridges, solvers and liquidity
                paths.
              </p>

            </div>

            <div className="routex-live">

              <span className="routex-dot" />

              {backendStatus
                ? "Backend connected"
                : "Backend unavailable"}

            </div>

          </div>

          <div className="routex-grid">

            {/* PORTFOLIO */}

            <div className="routex-card routex-portfolio">

              <div className="routex-card-label">
                Tracked execution value
              </div>

              {portfolio.loading ? (
                <div className="routex-value">
                  Loading...
                </div>
              ) : portfolio.data ? (
                <>
                  <div className="routex-value">
                    $
                    {totalValue?.toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </div>

                  {change24h !==
                    undefined && (
                    <div className="routex-change">
                      {change24h >= 0
                        ? "+"
                        : ""}
                      {change24h}%
                    </div>
                  )}
                </>
              ) : (
                <div className="routex-value">
                  —
                </div>
              )}

              <div className="routex-chain-list">

                {portfolioAssets.length ===
                0 ? (
                  <div className="routex-empty">
                    No portfolio data
                    returned.
                  </div>
                ) : (
                  portfolioAssets.map(
                    (item) => (
                      <div
                        className="routex-chain"
                        key={`${item.asset}-${item.chain}`}
                      >
                        <div className="routex-chain-name">
                          <span className="routex-dot" />
                          {item.asset}
                          <span>
                            · {item.chain}
                          </span>
                        </div>

                        <div className="routex-chain-value">
                          $
                          {item.value_usd.toLocaleString(
                            undefined,
                            {
                              maximumFractionDigits: 2,
                            }
                          )}
                        </div>

                        <div className="routex-bar">
                          <span
                            style={{
                              width:
                                totalValue &&
                                totalValue > 0
                                  ? `${Math.min(
                                      100,
                                      (item.value_usd /
                                        totalValue) *
                                        100
                                    )}%`
                                  : "0%",
                            }}
                          />
                        </div>
                      </div>
                    )
                  )
                )}

              </div>

            </div>

            {/* BACKEND STATUS */}

            <div className="routex-card routex-gas">

              <div className="routex-card-label">
                Execution backend
              </div>

              <div className="routex-gas-value">
                {backendStatus ??
                  "Unavailable"}
              </div>

              <div className="routex-mini-meta">
                Live status returned by the
                backend health endpoint.
              </div>

              <div className="routex-signal">
                {backendStatus ? (
                  <>
                    <CheckCircle2
                      size={13}
                    />
                    Backend connection
                    available.
                  </>
                ) : (
                  <>
                    <AlertCircle
                      size={13}
                    />
                    Backend connection
                    unavailable.
                  </>
                )}
              </div>

            </div>

            {/* NETWORK HEALTH */}

            <div className="routex-card routex-health">

              <div className="routex-card-label">
                Network health
              </div>

              <div className="routex-health-list">

                {health.loading ? (
                  <div className="routex-health-row">
                    <span>
                      Loading...
                    </span>
                  </div>
                ) : health.data.length ===
                  0 ? (
                  <div className="routex-health-row">
                    <span>
                      No network data
                    </span>
                  </div>
                ) : (
                  health.data.map(
                    (network) => (
                      <div
                        className="routex-health-row"
                        key={network.chain}
                      >
                        <span>
                          {network.chain}
                        </span>

                        <span className="routex-health-status">
                          <span
                            className={`routex-dot ${
                              network.status !==
                              "operational"
                                ? "inactive"
                                : ""
                            }`}
                          />

                          {network.status}
                        </span>
                      </div>
                    )
                  )
                )}

              </div>

            </div>

            {/* INTENT */}

            <div className="routex-card routex-intent">

              <div className="routex-intent-top">

                <div>

                  <div className="routex-card-label">
                    Intent execution
                  </div>

                  <div className="routex-intent-title">
                    What outcome do you need?
                  </div>

                  <div className="routex-intent-sub">
                    Provide the execution
                    intent. Buildonomics will
                    discover and evaluate the
                    available infrastructure
                    path.
                  </div>

                </div>

                <Sparkles
                  size={18}
                  color="#8f86ee"
                  strokeWidth={1.6}
                />

              </div>

              <div className="routex-intent-input-wrap">

                <div className="routex-intent-form">

                  <input
                    className="routex-intent-input"
                    value={sourceChain}
                    onChange={(event) =>
                      setSourceChain(
                        event.target.value
                      )
                    }
                    placeholder="Source chain"
                  />

                  <input
                    className="routex-intent-input"
                    value={destinationChain}
                    onChange={(event) =>
                      setDestinationChain(
                        event.target.value
                      )
                    }
                    placeholder="Destination chain"
                  />

                  <input
                    className="routex-intent-input"
                    value={asset}
                    onChange={(event) =>
                      setAsset(
                        event.target.value
                      )
                    }
                    placeholder="Asset"
                  />

                  <input
                    className="routex-intent-input"
                    value={amount}
                    onChange={(event) =>
                      setAmount(
                        event.target.value
                      )
                    }
                    placeholder="Amount"
                    type="number"
                    min="0"
                    step="any"
                  />

                </div>

                <div className="routex-intent-preferences">

                  <span>
                    Policy
                  </span>

                  {[
                    {
                      label: "Lowest cost",
                      value: "lowest_cost",
                    },
                    {
                      label: "Fastest",
                      value: "fastest",
                    },
                    {
                      label: "Balanced",
                      value: "balanced",
                    },
                    {
                      label: "Reliability",
                      value: "reliability",
                    },
                  ].map(
                    (policy) => (
                      <button
                        key={policy.value}
                        className={
                          preference ===
                          policy.value
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          setPreference(
                            policy.value
                          )
                        }
                      >
                        {policy.label}
                      </button>
                    )
                  )}

                </div>

                <button
                  className="routex-execute-btn"
                  onClick={findPlan}
                  disabled={
                    !sourceChain.trim() ||
                    !destinationChain.trim() ||
                    !asset.trim() ||
                    !amount ||
                    Number(amount) <= 0
                  }
                >
                  FIND EXECUTION PLAN

                  <ArrowRight
                    size={14}
                  />
                </button>

              </div>

            </div>

          </div>

          {/* RECENT ACTIVITY */}

          <div className="routex-bottom-grid">

            <div className="routex-card routex-activity">

              <div className="routex-section-head">

                <div className="routex-section-title">
                  Recent execution activity
                </div>

                <button
                  className="routex-section-link"
                  onClick={() =>
                    go(
                      "Transactions",
                      "/transactions"
                    )
                  }
                >
                  View all
                </button>

              </div>

              <div className="routex-activity-list">

                {transactions.loading ? (
                  <div className="routex-empty">
                    Loading transactions...
                  </div>
                ) : recentTransactions.length ===
                  0 ? (
                  <div className="routex-empty">
                    No transactions returned
                    by the backend.
                  </div>
                ) : (
                  recentTransactions.map(
                    (transaction) => (
                      <div
                        className="routex-activity-row"
                        key={transaction.id}
                      >

                        <div className="routex-activity-icon">
                          {transaction.status ===
                          "completed" ? (
                            <CheckCircle2
                              size={13}
                              strokeWidth={1.7}
                            />
                          ) : (
                            <Activity
                              size={13}
                              strokeWidth={1.7}
                            />
                          )}
                        </div>

                        <div>

                          <div className="routex-activity-name">
                            {transaction.id}
                          </div>

                          <div className="routex-activity-desc">
                            {transaction.amount}{" "}
                            {transaction.asset}
                            {" · "}
                            {transaction.source_chain}
                            {" → "}
                            {transaction.destination_chain}
                          </div>

                        </div>

                        <div className="routex-activity-time">
                          {transaction.status}
                        </div>

                      </div>
                    )
                  )
                )}

              </div>

            </div>

            {/* INTELLIGENCE */}

            <div className="routex-card routex-insight">

              <div className="routex-section-head">

                <div className="routex-section-title">
                  Intelligence layer
                </div>

                <Brain
                  size={15}
                  color="#777f8c"
                  strokeWidth={1.6}
                />

              </div>

              <div className="routex-insight-box">

                <div className="routex-insight-kicker">
                  Current decision model
                </div>

                <div className="routex-insight-text">
                  Candidate paths are evaluated
                  by the backend across cost,
                  latency, liquidity, slippage,
                  reliability, hops and security
                  assumptions before a policy is
                  applied.
                </div>

                <button
                  className="routex-insight-action"
                  onClick={() =>
                    go(
                      "Intelligence",
                      "/intelligence"
                    )
                  }
                >
                  Open Route Intelligence

                  <ArrowRight
                    size={13}
                  />
                </button>

              </div>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}