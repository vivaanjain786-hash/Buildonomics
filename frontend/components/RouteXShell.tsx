"use client";

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  Bell,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Command,
  GitBranch,
  LayoutDashboard,
  Moon,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  WalletCards,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  getBackendHealth,
  getNetworkHealth,
  getPortfolio,
  getTransactions,
} from "../lib/api";

import type {
  NetworkHealth,
  PortfolioResponse,
  Transaction,
} from "../lib/types";

type Theme = "light" | "dark";

type SidebarItem = {
  label: string;
  icon: LucideIcon;
  href: string;
};

const sidebarItems: SidebarItem[] = [
  {
    label: "Command Center",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    label: "Execution",
    icon: Zap,
    href: "/execute",
  },
  {
    label: "Bridges",
    icon: GitBranch,
    href: "/bridges",
  },
  {
    label: "Analytics",
    icon: Activity,
    href: "/analytics",
  },
  {
    label: "Intelligence",
    icon: Sparkles,
    href: "/intelligence",
  },
  {
    label: "Security",
    icon: ShieldCheck,
    href: "/security",
  },
  {
    label: "Network",
    icon: Network,
    href: "/network",
  },
];

const DEMO_MODE =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
  process.env.NEXT_PUBLIC_COMMAND_CENTER_DEMO === "true";

const demoChains = [
  {
    name: "Ethereum",
    short: "E",
    value: "—",
    change: "—",
  },
  {
    name: "Arbitrum",
    short: "A",
    value: "—",
    change: "—",
  },
  {
    name: "Base",
    short: "B",
    value: "—",
    change: "—",
  },
  {
    name: "Optimism",
    short: "O",
    value: "—",
    change: "—",
  },
  {
    name: "Polygon",
    short: "P",
    value: "—",
    change: "—",
  },
  {
    name: "Avalanche",
    short: "A",
    value: "—",
    change: "—",
  },
];

const demoBars = [52, 64, 77, 67, 88, 61, 84];

const demoTransactions: Transaction[] = [
  {
    id: "0x3a5f...7e2c",
    source_chain: "Ethereum",
    destination_chain: "Arbitrum",
    asset: "ETH",
    amount: 12.5,
    status: "completed",
    created_at: new Date(
      Date.now() - 2 * 60_000,
    ).toISOString(),
  },
  {
    id: "0x8b2d...1f4a",
    source_chain: "Base",
    destination_chain: "Optimism",
    asset: "USDC",
    amount: 4230,
    status: "completed",
    created_at: new Date(
      Date.now() - 8 * 60_000,
    ).toISOString(),
  },
  {
    id: "0x1c9e...6d8f",
    source_chain: "Polygon",
    destination_chain: "Ethereum",
    asset: "WBTC",
    amount: 1.2,
    status: "pending",
    created_at: new Date(
      Date.now() - 12 * 60_000,
    ).toISOString(),
  },
  {
    id: "0x7e4b...2a9c",
    source_chain: "Arbitrum",
    destination_chain: "Base",
    asset: "USDC",
    amount: 9500,
    status: "completed",
    created_at: new Date(
      Date.now() - 18 * 60_000,
    ).toISOString(),
  },
];

function formatUsd(value?: number) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatAmount(tx: Transaction) {
  if (!Number.isFinite(tx.amount)) {
    return "—";
  }

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(tx.amount)} ${tx.asset}`;
}

function relativeTime(value: string) {
  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return "—";
  }

  const minutes = Math.max(
    0,
    Math.round(
      (Date.now() - timestamp) / 60000,
    ),
  );

  if (minutes < 1) {
    return "now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.round(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.round(hours / 24)}d ago`;
}

function avgLatency(transactions: Transaction[]) {
  const values = transactions
    .map((tx) => tx.latency_seconds)
    .filter(
      (v): v is number =>
        typeof v === "number" &&
        Number.isFinite(v),
    );

  if (!values.length) {
    return null;
  }

  return (
    values.reduce(
      (sum, value) => sum + value,
      0,
    ) / values.length
  );
}

function chainInitial(chain: string) {
  return (
    chain.trim().charAt(0).toUpperCase() ||
    "?"
  );
}

export default function RouteXShell() {
  const [theme, setTheme] =
    useState<Theme>("light");

  const pathname = usePathname();
  const router = useRouter();

  const [portfolio, setPortfolio] =
    useState<PortfolioResponse | null>(null);

  const [networkHealth, setNetworkHealth] =
    useState<NetworkHealth[]>([]);

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [backendStatus, setBackendStatus] =
    useState("Checking");

  const [loading, setLoading] =
    useState(true);

  const [intent, setIntent] =
    useState("");

  useEffect(() => {
    const stored =
      window.localStorage.getItem(
        "routex-theme",
      ) as Theme | null;

    if (
      stored === "dark" ||
      stored === "light"
    ) {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);

      const [
        health,
        networks,
        portfolioData,
        txs,
      ] = await Promise.allSettled([
        getBackendHealth(),
        getNetworkHealth(),
        getPortfolio(),
        getTransactions(),
      ]);

      if (!active) {
        return;
      }

      if (health.status === "fulfilled") {
        setBackendStatus(
          health.value.status ||
            "Operational",
        );
      } else {
        setBackendStatus("Unavailable");
      }

      if (
        networks.status ===
        "fulfilled"
      ) {
        setNetworkHealth(
          networks.value,
        );
      }

      if (
        portfolioData.status ===
        "fulfilled"
      ) {
        setPortfolio(
          portfolioData.value,
        );
      }

      if (txs.status === "fulfilled") {
        setTransactions(txs.value);
      }

      setLoading(false);
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const displayTransactions =
    DEMO_MODE &&
    !transactions.length
      ? demoTransactions
      : transactions;

  const displayNetworks =
    DEMO_MODE &&
    !networkHealth.length
      ? demoChains.map((chain) => ({
          chain: chain.name,
          status:
            "operational" as const,
        }))
      : networkHealth;

  const totalValue =
    portfolio?.total_value_usd;

  const latency =
    avgLatency(displayTransactions);

  const activeRoutes =
    displayTransactions.filter(
      (tx) => tx.status === "pending",
    ).length;

  const networkCount = useMemo(
    () =>
      new Set(
        displayNetworks.map(
          (network) => network.chain,
        ),
      ).size,
    [displayNetworks],
  );

  const portfolioChains = useMemo(() => {
    if (!portfolio?.assets?.length) {
      return [];
    }

    const values = new Map<
      string,
      number
    >();

    for (const asset of portfolio.assets) {
      values.set(
        asset.chain,
        (values.get(asset.chain) || 0) +
          asset.value_usd,
      );
    }

    return [...values.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({
        name,
        value: formatUsd(value),
        change: "",
      }));
  }, [portfolio]);

  const chainRows =
    portfolioChains.length
      ? portfolioChains
      : displayNetworks
          .slice(0, 6)
          .map((network) => ({
            name: network.chain,
            value: "—",
            change:
              network.status ===
              "operational"
                ? "Operational"
                : network.status,
          }));

  const demoKpis =
    DEMO_MODE && !portfolio;

  const displayedVolume = demoKpis
    ? "$24,820.40"
    : formatUsd(totalValue);

  const displayedRoutes = demoKpis
    ? "18"
    : String(activeRoutes || "—");

  const displayedNetworks = demoKpis
    ? "6"
    : String(networkCount || "—");

  const displayedLatency = demoKpis
    ? "2.4s"
    : latency
      ? `${latency.toFixed(1)}s`
      : "—";

  return (
    <div
      className={`command-center ${
        theme === "dark" ? "dark" : ""
      }`}
    >
      <aside className="command-sidebar">
        <div className="command-brand">
          <div className="command-brand-mark">
            <Command size={15} />
          </div>

          <span>RouteX</span>
        </div>

        <nav
          className="command-nav"
          aria-label="Command center navigation"
        >
          {sidebarItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`command-nav-item ${
                  pathname === item.href ? "active" : ""
                }`}
              >
                <Icon size={15} />

                <span>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="command-sidebar-spacer" />

        <div className="command-live">
          <span className="command-live-dot" />

          <strong>
            {backendStatus}
          </strong>

          <br />

          RouteX backend status
        </div>

        <div className="command-profile">
          <div className="command-avatar">
            P
          </div>

          <div>
            <strong>Profile</strong>

            <span>
              Command Center
            </span>
          </div>
        </div>

        <div className="command-sidebar-tagline">
          Smarter execution
          <br />
          everywhere.
        </div>
      </aside>

      <main className="command-main">
        <div className="command-background-orb orb-one" />
        <div className="command-background-orb orb-two" />

        <header className="command-topbar">
          <div className="command-search">
            <Search size={13} />

            <input
              aria-label="Search"
              placeholder="Search chains, tokens, protocols..."
            />

            <span>⌘ K</span>
          </div>

          <div className="command-actions">
            <div
              className="command-theme-toggle"
              aria-label="Theme"
            >
              <button
                className={
                  theme === "light"
                    ? "active"
                    : ""
                }
                onClick={() => {
                  setTheme("light");
                  window.localStorage.setItem("routex-theme", "light");
                }}
              >
                <Sun size={11} />
              </button>

              <button
                className={
                  theme === "dark"
                    ? "active"
                    : ""
                }
                onClick={() => {
                  setTheme("dark");
                  window.localStorage.setItem("routex-theme", "dark");
                }}
              >
                <Moon size={11} />
              </button>
            </div>

            <button
              className="command-icon"
              aria-label="Notifications"
            >
              <Bell size={14} />

              <span className="notification-dot" />
            </button>

            <button
              className="command-icon"
              aria-label="Wallet"
            >
              <WalletCards size={14} />
            </button>

            <button
              type="button"
              className="command-user-avatar"
              aria-label="Sign out"
              title="Sign out"
              onClick={() => {
                window.localStorage.removeItem("routex-authenticated");
                router.replace("/login");
              }}
            >
              P
            </button>
          </div>
        </header>

        <section className="command-page-head">
          <div>
            <div className="command-kicker">
              Execution Intelligence
            </div>

            <h1>
              Command Center
            </h1>

            <p>
              Cross-chain execution
              intelligence, in real time.
            </p>
          </div>

          <div className="command-status-card">
            <span className="command-live-dot" />

            <div>
              <strong>
                {loading
                  ? "Syncing"
                  : backendStatus}
              </strong>

              <small>
                All systems online
              </small>
            </div>
          </div>
        </section>

        {/* =====================================================
            KPI CARDS
            ===================================================== */}

        <section className="command-kpis">

          {/* CROSS-CHAIN VOLUME */}

          <article className="command-card command-kpi kpi-green">
            <div className="kpi-top">
              <div className="kpi-icon">
                <CircleDollarSign size={17} />
              </div>

              <div className="command-label">
                Cross-Chain Volume
              </div>
            </div>

            <div className="command-kpi-value">
              {displayedVolume}
            </div>

            <div className="command-kpi-meta positive">
              ↑ 4.8%
              <span>vs last 24h</span>
            </div>

            <svg
              className="command-spark"
              viewBox="0 0 100 35"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id="greenSparkFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#00A16E"
                    stopOpacity="0.20"
                  />

                  <stop
                    offset="65%"
                    stopColor="#00A16E"
                    stopOpacity="0.07"
                  />

                  <stop
                    offset="100%"
                    stopColor="#00A16E"
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>

              {/* Gradient ONLY below the swirl */}
              <path
                d="M2 29 C12 25 16 28 24 20 S37 23 44 14 S56 19 65 9 S77 13 84 5 S94 8 99 1 L99 35 L2 35 Z"
                fill="url(#greenSparkFill)"
              />

              {/* Swirl line */}
              <path
                d="M2 29 C12 25 16 28 24 20 S37 23 44 14 S56 19 65 9 S77 13 84 5 S94 8 99 1"
                fill="none"
                stroke="#00A16E"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </article>


          {/* ACTIVE ROUTES */}

          <article className="command-card command-kpi kpi-blue">
            <div className="kpi-top">
              <div className="kpi-icon">
                <Zap size={17} />
              </div>

              <div className="command-label">
                Active Routes
              </div>
            </div>

            <div className="command-kpi-value">
              {displayedRoutes}
            </div>

            <div className="command-kpi-meta positive">
              ↑ 12%
              <span>vs last 24h</span>
            </div>

            <svg
              className="command-spark"
              viewBox="0 0 100 35"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id="blueSparkFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#378DF5"
                    stopOpacity="0.20"
                  />

                  <stop
                    offset="65%"
                    stopColor="#378DF5"
                    stopOpacity="0.07"
                  />

                  <stop
                    offset="100%"
                    stopColor="#378DF5"
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>

              {/* Gradient ONLY below the swirl */}
              <path
                d="M2 29 C11 26 14 18 23 22 S35 28 43 18 S55 21 63 10 S75 17 83 8 S91 9 99 2 L99 35 L2 35 Z"
                fill="url(#blueSparkFill)"
              />

              {/* Swirl line */}
              <path
                d="M2 29 C11 26 14 18 23 22 S35 28 43 18 S55 21 63 10 S75 17 83 8 S91 9 99 2"
                fill="none"
                stroke="#378DF5"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </article>


          {/* NETWORKS CONNECTED */}

          <article className="command-card command-kpi kpi-purple">
            <div className="kpi-top">
              <div className="kpi-icon">
                <Network size={17} />
              </div>

              <div className="command-label">
                Networks Connected
              </div>
            </div>

            <div className="command-kpi-value">
              {displayedNetworks}
            </div>

            <div className="command-kpi-meta">
              <span className="status-mini-dot" />
              Live network state
            </div>

            <svg
              className="command-spark"
              viewBox="0 0 100 35"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id="purpleSparkFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#7665ED"
                    stopOpacity="0.19"
                  />

                  <stop
                    offset="65%"
                    stopColor="#7665ED"
                    stopOpacity="0.065"
                  />

                  <stop
                    offset="100%"
                    stopColor="#7665ED"
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>

              {/* Gradient ONLY below the swirl */}
              <path
                d="M2 28 C13 27 17 23 25 22 S38 23 45 14 S57 20 64 10 S76 16 84 7 S92 8 99 2 L99 35 L2 35 Z"
                fill="url(#purpleSparkFill)"
              />

              {/* Swirl line */}
              <path
                d="M2 28 C13 27 17 23 25 22 S38 23 45 14 S57 20 64 10 S76 16 84 7 S92 8 99 2"
                fill="none"
                stroke="#7665ED"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </article>


          {/* AVG EXECUTION TIME */}

          <article className="command-card command-kpi kpi-orange">
            <div className="kpi-top">
              <div className="kpi-icon">
                <Clock3 size={17} />
              </div>

              <div className="command-label">
                Avg. Execution Time
              </div>
            </div>

            <div className="command-kpi-value">
              {displayedLatency}
            </div>

            <div className="command-kpi-meta positive">
              ↓ 18%
              <span>vs last 24h</span>
            </div>

            <svg
              className="command-spark"
              viewBox="0 0 100 35"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id="orangeSparkFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#F4A321"
                    stopOpacity="0.20"
                  />

                  <stop
                    offset="65%"
                    stopColor="#F4A321"
                    stopOpacity="0.07"
                  />

                  <stop
                    offset="100%"
                    stopColor="#F4A321"
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>

              {/* Gradient ONLY below the swirl */}
              <path
                d="M2 27 C11 25 17 15 26 19 S39 25 46 17 S58 20 66 10 S77 19 84 8 S94 10 99 2 L99 35 L2 35 Z"
                fill="url(#orangeSparkFill)"
              />

              {/* Swirl line */}
              <path
                d="M2 27 C11 25 17 15 26 19 S39 25 46 17 S58 20 66 10 S77 19 84 8 S94 10 99 2"
                fill="none"
                stroke="#F4A321"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </article>

        </section>

        {/* =====================================================
            INTENT ENGINE
            ===================================================== */}

        <section className="command-card command-intent">
          <div className="intent-icon">
            <Sparkles size={22} />
          </div>

          <div className="intent-content">
            <div className="command-kicker">
              Intent Engine
            </div>

            <div className="command-panel-title">
              What do you want to execute?
            </div>

            <div className="command-intent-input">
              <input
                value={intent}
                onChange={(event) =>
                  setIntent(
                    event.target.value,
                  )
                }
                placeholder="e.g. Move 500 USDC from Ethereum to Base"
              />

              <button
                type="button"
                onClick={() => {
                  const value =
                    intent.trim();

                  if (!value) {
                    return;
                  }

                  const match =
                    value.match(
                      /move\s+([\d,.]+)\s+([A-Za-z0-9._-]+)\s+from\s+(.+?)\s+to\s+(.+)/i,
                    );

                  if (match) {
                    const [
                      ,
                      amount,
                      asset,
                      source,
                      destination,
                    ] = match;

                    const params =
                      new URLSearchParams();

                    params.set(
                      "source",
                      source.trim(),
                    );

                    params.set(
                      "destination",
                      destination.trim(),
                    );

                    params.set(
                      "asset",
                      asset.trim(),
                    );

                    params.set(
                      "amount",
                      amount.replace(
                        /,/g,
                        "",
                      ),
                    );

                    params.set(
                      "preference",
                      "balanced",
                    );

                    window.location.href =
                      `/intelligence?${params.toString()}`;

                    return;
                  }

                  window.location.href =
                    `/intelligence?intent=${encodeURIComponent(
                      value,
                    )}`;
                }}
              >
                Find Route
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <span className="intent-natural">
            + Natural language execution
          </span>
        </section>

        {/* =====================================================
            PERFORMANCE / NETWORK / INTELLIGENCE
            ===================================================== */}

        <section
          className="command-grid-main"
          id="analytics"
        >
          <article className="command-card command-panel performance-card">
            <div className="command-panel-head">
              <div className="command-panel-title">
                Execution Performance
              </div>

              <span className="command-panel-link">
                Volume · Cost · Latency
              </span>
            </div>

            <div className="command-chart">
              {demoBars.map(
                (height, index) => (
                  <div
                    key={index}
                    className="command-bar"
                    style={{
                      height: DEMO_MODE
                        ? `${height}%`
                        : "8%",
                    }}
                  />
                ),
              )}
            </div>

            <div className="command-chart-labels">
              {[
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
                "Sun",
              ].map((day) => (
                <span key={day}>
                  {day}
                </span>
              ))}
            </div>
          </article>

          <article
            className="command-card command-panel network-card"
            id="network"
          >
            <div className="command-panel-head">
              <div className="command-panel-title">
                Network Health
              </div>

              <Link
                className="command-panel-link"
                href="/network"
              >
                View all →
              </Link>
            </div>

            <div className="command-chain-list">
              {chainRows
                .slice(0, 5)
                .map((chain, index) => (
                  <div
                    className="command-chain-row"
                    key={chain.name}
                  >
                    <div
                      className={`chain-icon chain-${index}`}
                    >
                      {chainInitial(
                        chain.name,
                      )}
                    </div>

                    <span className="chain-name">
                      {chain.name}
                    </span>

                    <span className="chain-value">
                      {chain.value}
                    </span>

                    <span className="chain-change">
                      {chain.change ===
                      "Operational"
                        ? "+1.8%"
                        : chain.change}
                    </span>
                  </div>
                ))}
            </div>
          </article>

          <Link
            href="/intelligence"
            className="command-card command-ocean"
          >
            <div className="ocean-content">
              <div className="command-label">
                ROUTEX INTELLIGENCE
              </div>

              <h3>
                Smarter
                <br />
                execution
                <br />
                everywhere.
              </h3>

              <p>
                Evaluate cost, latency,
                liquidity, reliability and
                security assumptions
                before execution.
              </p>
            </div>

            <div className="ocean-globe" />

            <div className="ocean-arrow">
              <ArrowRight size={17} />
            </div>
          </Link>
        </section>

        {/* =====================================================
            RECENT EXECUTIONS / ROUTE GRAPH
            ===================================================== */}

        <section className="command-bottom">
          <article className="command-card command-panel executions-card">
            <div className="command-panel-head">
              <div className="command-panel-title">
                Recent Executions
              </div>

              <Link
                className="command-panel-link"
                href="/transactions"
              >
                View all →
              </Link>
            </div>

            <table className="command-table">
              <thead>
                <tr>
                  <th>Tx Hash</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>

              <tbody>
                {displayTransactions
                  .slice(0, 4)
                  .map((tx) => (
                    <tr key={tx.id}>
                      <td>
                        <span className="tx-icon">
                          □
                        </span>
                        {tx.id.slice(0, 12)}
                      </td>

                      <td>
                        {tx.source_chain}
                      </td>

                      <td>
                        {tx.destination_chain}
                      </td>

                      <td>
                        {formatAmount(tx)}
                      </td>

                      <td>
                        <span
                          className={`command-pill ${
                            tx.status ===
                            "pending"
                              ? "pending"
                              : ""
                          }`}
                        >
                          {tx.status ===
                          "completed" ? (
                            <CheckCircle2
                              size={9}
                            />
                          ) : (
                            <Clock3
                              size={9}
                            />
                          )}

                          {tx.status ===
                          "completed"
                            ? "Completed"
                            : "Pending"}
                        </span>
                      </td>

                      <td>
                        {relativeTime(
                          tx.created_at,
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {!displayTransactions.length && (
              <div className="empty-state">
                No executions returned by
                the backend yet.
              </div>
            )}
          </article>

          <article
            className="command-card command-panel command-route-map"
            id="routes"
          >
            <div className="command-panel-head">
              <div className="command-panel-title">
                Cross-Chain Route Graph
              </div>

              <span className="command-pill live-pill">
                <span className="command-live-dot" />
                Live
              </span>
            </div>

            <div className="route-graph">
              <svg
                viewBox="0 0 520 210"
                preserveAspectRatio="none"
                aria-label="Cross-chain route graph"
              >
                <defs>
                  <linearGradient
                    id="routeBlue"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop
                      offset="0%"
                      stopColor="#61B8FF"
                    />

                    <stop
                      offset="100%"
                      stopColor="#8D7BFF"
                    />
                  </linearGradient>

                  <linearGradient
                    id="routeGreen"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop
                      offset="0%"
                      stopColor="#6FE1B5"
                    />

                    <stop
                      offset="100%"
                      stopColor="#79B9FF"
                    />
                  </linearGradient>

                  <filter
                    id="routeGlow"
                  >
                    <feGaussianBlur
                      stdDeviation="3"
                      result="blur"
                    />

                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <path
                  d="M25 100 C90 35 135 35 205 78 S320 155 375 96 S440 60 500 95"
                  fill="none"
                  stroke="url(#routeBlue)"
                  strokeWidth="2.5"
                  opacity=".8"
                  filter="url(#routeGlow)"
                />

                <path
                  d="M25 100 C105 155 145 155 215 108 S315 55 390 145 S455 160 500 115"
                  fill="none"
                  stroke="url(#routeGreen)"
                  strokeWidth="2"
                  opacity=".6"
                />

                <path
                  d="M25 100 C100 75 135 75 205 125 S325 170 390 82 S450 70 500 95"
                  fill="none"
                  stroke="#B9CFFF"
                  strokeWidth="1.5"
                  opacity=".55"
                />

                {[
                  {
                    x: 35,
                    y: 100,
                    label: "Ethereum",
                    cls: "blue",
                  },
                  {
                    x: 190,
                    y: 70,
                    label: "Arbitrum",
                    cls: "blue",
                  },
                  {
                    x: 440,
                    y: 95,
                    label: "Base",
                    cls: "blue",
                  },
                  {
                    x: 120,
                    y: 135,
                    label: "Polygon",
                    cls: "purple",
                  },
                  {
                    x: 355,
                    y: 140,
                    label: "Optimism",
                    cls: "red",
                  },
                ].map(
                  (node) => (
                    <g
                      key={node.label}
                    >
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="9"
                        fill="white"
                        stroke={
                          node.cls ===
                          "red"
                            ? "#F04E62"
                            : node.cls ===
                                "purple"
                              ? "#8D5DE8"
                              : "#4B9BFF"
                        }
                        strokeWidth="2"
                        opacity=".95"
                      />

                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="4"
                        fill={
                          node.cls ===
                          "red"
                            ? "#F04E62"
                            : node.cls ===
                                "purple"
                              ? "#8D5DE8"
                              : "#4B9BFF"
                        }
                      />

                      <text
                        x={node.x}
                        y={
                          node.y -
                          17
                        }
                        textAnchor="middle"
                        className="route-node-label"
                        fontSize="11"
                        fontWeight="700"
                      >
                        {node.label}
                      </text>
                    </g>
                  ),
                )}
              </svg>

              <div className="route-count-box">
                <strong>
                  {demoKpis
                    ? "12"
                    : displayedRoutes}
                </strong>

                <span>
                  Active routes
                </span>
              </div>
            </div>
          </article>
        </section>

        <footer className="command-footer">
          <span>
            © 2026 RouteX. All
            systems operational.
          </span>

          <span>
            Built for a more connected
            cross-chain ecosystem.
          </span>
        </footer>
      </main>
    </div>
  );
}