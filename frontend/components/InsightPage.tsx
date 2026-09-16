"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
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
import { useEffect, useMemo, useState } from "react";
import { getInsightData } from "@/lib/insights";
import styles from "./InsightPage.module.css";

type Theme = "light" | "dark";
type Mode = "bridges" | "analytics" | "network";

const sidebarItems = [
  { label: "Command Center", href: "/", icon: LayoutDashboard },
  { label: "Execution", href: "/execute", icon: Zap },
  { label: "Bridges", href: "/bridges", icon: GitBranch },
  { label: "Analytics", href: "/analytics", icon: Activity },
  { label: "Intelligence", href: "/intelligence", icon: Sparkles },
  { label: "Security", href: "/security", icon: ShieldCheck },
  { label: "Network", href: "/network", icon: Network },
];

function money(value: number) {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function linePath(values: number[], width = 720, height = 230) {
  if (!values.length) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - ((value - min) / range) * (height - 30) - 12;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function Donut({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;
  let offset = 0;
  const radius = 55;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={styles.donutWrap}>
      <svg viewBox="0 0 150 150" className={styles.donut} aria-label="Distribution chart">
        <circle
          cx="75"
          cy="75"
          r={radius}
          fill="none"
          className={styles.donutTrack}
          strokeWidth="19"
        />

        {data.map((item, index) => {
          const length = (item.value / total) * circumference;
          const currentOffset = -offset;
          offset += length;

          return (
            <circle
              key={item.name}
              cx="75"
              cy="75"
              r={radius}
              fill="none"
              className={`${styles.donutSegment} ${styles[`segment${index % 5}`]}`}
              strokeWidth="19"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={currentOffset}
              transform="rotate(-90 75 75)"
            />
          );
        })}

        <text x="75" y="72" textAnchor="middle" className={styles.donutNumber}>
          {Math.round(total)}%
        </text>
        <text x="75" y="88" textAnchor="middle" className={styles.donutLabel}>
          share
        </text>
      </svg>

      <div className={styles.legend}>
        {data.map((item, index) => (
          <div className={styles.legendRow} key={item.name}>
            <span className={`${styles.legendDot} ${styles[`segment${index % 5}`]}`} />
            <span>{item.name}</span>
            <strong>{item.value}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniLine({
  values,
  labels,
  secondaryValues,
}: {
  values: number[];
  labels: string[];
  secondaryValues?: number[];
}) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return (
    <div className={styles.chart}>
      <svg viewBox="0 0 720 230" preserveAspectRatio="none" aria-label="Trend chart">
        <defs>
          <linearGradient id="insightArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" className={styles.areaTop} />
            <stop offset="100%" className={styles.areaBottom} />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3].map((row) => (
          <line
            key={row}
            x1="0"
            x2="720"
            y1={12 + row * 68}
            y2={12 + row * 68}
            className={styles.gridLine}
          />
        ))}

        <path
          d={`${linePath(values)} L 720 230 L 0 230 Z`}
          fill="url(#insightArea)"
          className={styles.chartArea}
        />

        {secondaryValues?.length ? (
          <path
            d={linePath(secondaryValues)}
            fill="none"
            className={styles.chartLineSecondary}
          />
        ) : null}

        <path d={linePath(values)} fill="none" className={styles.chartLine} />

        {values.map((value, index) => {
          const x = (index / Math.max(values.length - 1, 1)) * 720;
          const y = 230 - ((value - min) / range) * 206 - 12;

          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="4"
              className={styles.chartPoint}
            />
          );
        })}
      </svg>

      <div className={styles.xLabels}>
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  meta,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  meta: string;
  icon: typeof Activity;
  tone: "green" | "blue" | "purple" | "orange";
}) {
  return (
    <article className={`${styles.metricCard} ${styles[`tone${tone}`]}`}>
      <div className={styles.metricTop}>
        <div className={styles.metricIcon}>
          <Icon size={16} />
        </div>
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
      <small>{meta}</small>
      <div className={styles.metricGlow} />
    </article>
  );
}

export default function InsightPage({ mode }: { mode: Mode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<Theme>("light");
  const [data, setData] = useState<Awaited<ReturnType<typeof getInsightData>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem("routex-theme") as Theme | null;
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    let active = true;

    getInsightData()
      .then((result) => {
        if (active) setData(result);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const pageData = data;
  const title =
    mode === "bridges"
      ? "Bridge Intelligence"
      : mode === "analytics"
        ? "Execution Analytics"
        : "Network Intelligence";

  const subtitle =
    mode === "bridges"
      ? "Compare provider performance, route share, cost, liquidity and reliability."
      : mode === "analytics"
        ? "Understand execution volume, cost, latency and outcome trends."
        : "Monitor network activity, gas conditions and operational health.";

  const bridgeTotals = useMemo(() => {
    if (!pageData) return { volume: 0, routes: 0, cost: 0, reliability: 0 };
    const volume = pageData.bridges.reduce((s, b) => s + b.volume, 0);
    const routes = pageData.bridges.reduce((s, b) => s + b.routes, 0);
    const cost = pageData.bridges.length
      ? pageData.bridges.reduce((s, b) => s + b.cost, 0) / pageData.bridges.length
      : 0;
    const reliability = pageData.bridges.length
      ? pageData.bridges.reduce((s, b) => s + b.reliability, 0) / pageData.bridges.length
      : 0;
    return { volume, routes, cost, reliability };
  }, [pageData]);

  const analyticsTotals = useMemo(() => {
    if (!pageData) return { volume: 0, cost: 0, latency: 0, success: 0 };
    const points = pageData.analytics;
    return {
      volume: points.at(-1)?.volume ?? 0,
      cost: points.length ? points.reduce((s, p) => s + p.cost, 0) / points.length : 0,
      latency: points.length ? points.reduce((s, p) => s + p.latency, 0) / points.length : 0,
      success: points.length ? points.reduce((s, p) => s + p.success, 0) / points.length : 0,
    };
  }, [pageData]);

  const networkTotals = useMemo(() => {
    if (!pageData) return { total: 0, operational: 0, health: 0, activity: 0 };
    const networks = pageData.networks;
    return {
      total: networks.length,
      operational: networks.filter((n) => n.status === "operational").length,
      health: networks.length ? networks.reduce((s, n) => s + n.health, 0) / networks.length : 0,
      activity: networks.length ? networks.reduce((s, n) => s + n.activity, 0) / networks.length : 0,
    };
  }, [pageData]);

  return (
    <div className={`${styles.shell} ${theme === "dark" ? styles.dark : ""}`}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>
            <Command size={15} />
          </div>
          <span>RouteX</span>
        </div>

        <nav className={styles.nav} aria-label="Command center navigation">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`${styles.navItem} ${active ? styles.navActive : ""}`}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarSpacer} />

        <div className={styles.sidebarLive}>
          <span className={styles.liveDot} />
          <div>
            <strong>Operational</strong>
            <small>RouteX intelligence status</small>
          </div>
        </div>

        <div className={styles.profile}>
          <div className={styles.avatar}>P</div>
          <div>
            <strong>Profile</strong>
            <span>Execution workspace</span>
          </div>
        </div>

        <div className={styles.tagline}>
          Smarter execution
          <br />
          everywhere.
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.orbOne} />
        <div className={styles.orbTwo} />

        <header className={styles.topbar}>
          <div className={styles.search}>
            <Search size={13} />
            <input aria-label="Search" placeholder="Search chains, tokens, protocols..." />
            <span>⌘ K</span>
          </div>

          <div className={styles.actions}>
            <div className={styles.themeToggle} aria-label="Theme">
              <button
                type="button"
                className={theme === "light" ? styles.toggleActive : ""}
                onClick={() => { setTheme("light"); window.localStorage.setItem("routex-theme", "light"); }}
                aria-label="Light mode"
              >
                <Sun size={11} />
              </button>
              <button
                type="button"
                className={theme === "dark" ? styles.toggleActive : ""}
                onClick={() => { setTheme("dark"); window.localStorage.setItem("routex-theme", "dark"); }}
                aria-label="Dark mode"
              >
                <Moon size={11} />
              </button>
            </div>

            <button className={styles.iconButton} type="button" aria-label="Notifications">
              <Bell size={14} />
              <span className={styles.notificationDot} />
            </button>

            <button className={styles.iconButton} type="button" aria-label="Wallet">
              <WalletCards size={14} />
            </button>

            <div className={styles.userAvatar}>P</div>
          </div>
        </header>

        <section className={styles.pageHead}>
          <div>
            <div className={styles.kicker}>ROUTEX / {mode.toUpperCase()}</div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          <div className={styles.statusCard}>
            <span className={styles.liveDot} />
            <div>
              <strong>{loading ? "Syncing" : "Operational"}</strong>
              <small>Intelligence layer online</small>
            </div>
          </div>
        </section>

        {!pageData ? (
          <div className={styles.loadingCard}>
            <div className={styles.loadingPulse} />
            Loading intelligence data...
          </div>
        ) : null}

        {pageData && mode === "bridges" && (
          <>
            <section className={styles.kpis}>
              <MetricCard label="Bridge Volume" value={money(bridgeTotals.volume)} meta="Across tracked providers" icon={CircleDollarSign} tone="green" />
              <MetricCard label="Active Routes" value={String(bridgeTotals.routes)} meta="Available execution paths" icon={Zap} tone="blue" />
              <MetricCard label="Avg. Cost" value={`$${bridgeTotals.cost.toFixed(2)}`} meta="Normalized execution cost" icon={CircleDollarSign} tone="purple" />
              <MetricCard label="Avg. Reliability" value={`${bridgeTotals.reliability.toFixed(1)}%`} meta="Observed route reliability" icon={ShieldCheck} tone="orange" />
            </section>

            <section className={styles.grid2}>
              <article className={styles.card}>
                <div className={styles.cardHead}>
                  <div>
                    <span>Provider comparison</span>
                    <h2>Bridge utilization</h2>
                  </div>
                  <GitBranch size={17} />
                </div>
                <MiniLine values={pageData.bridges.map((b) => b.volume)} labels={pageData.bridges.map((b) => b.provider)} />
              </article>

              <article className={styles.card}>
                <div className={styles.cardHead}>
                  <div>
                    <span>Route distribution</span>
                    <h2>Provider share</h2>
                  </div>
                  <BarChart3 size={17} />
                </div>
                <Donut data={pageData.routeDistribution} />
              </article>
            </section>

            <article className={styles.card}>
              <div className={styles.cardHead}>
                <div>
                  <span>Execution infrastructure</span>
                  <h2>Provider performance</h2>
                </div>
                <ArrowUpRight size={17} />
              </div>
              <div className={styles.tableWrap}>
                <div className={`${styles.tableRow} ${styles.tableHeader}`}>
                  <span>Provider</span><span>Volume</span><span>Avg. time</span><span>Cost</span><span>Reliability</span><span>Liquidity</span>
                </div>
                {pageData.bridges.map((bridge) => (
                  <div className={styles.tableRow} key={bridge.provider}>
                    <span><b>{bridge.provider}</b></span>
                    <span>{money(bridge.volume)}</span>
                    <span>{bridge.avgTime}s</span>
                    <span>${bridge.cost.toFixed(2)}</span>
                    <span className={styles.good}>{bridge.reliability}%</span>
                    <span>{money(bridge.liquidity)}M</span>
                  </div>
                ))}
              </div>
            </article>
          </>
        )}

        {pageData && mode === "analytics" && (
          <>
            <section className={styles.kpis}>
              <MetricCard label="Execution Volume" value={money(analyticsTotals.volume)} meta="Latest tracked period" icon={CircleDollarSign} tone="green" />
              <MetricCard label="Avg. Cost" value={`$${analyticsTotals.cost.toFixed(1)}`} meta="Normalized execution cost" icon={Zap} tone="blue" />
              <MetricCard label="Avg. Latency" value={`${analyticsTotals.latency.toFixed(1)}s`} meta="Observed execution time" icon={Clock3} tone="orange" />
              <MetricCard label="Success Rate" value={`${analyticsTotals.success.toFixed(1)}%`} meta="Successful executions" icon={CheckCircle2} tone="purple" />
            </section>

            <section className={styles.grid2}>
              <article className={styles.card}>
                <div className={styles.cardHead}>
                  <div>
                    <span>Execution trend</span>
                    <h2>Execution volume</h2>
                  </div>
                  <Activity size={17} />
                </div>
                <MiniLine values={pageData.analytics.map((p) => p.volume)} labels={pageData.analytics.map((p) => p.label)} />
              </article>

              <article className={styles.card}>
                <div className={styles.cardHead}>
                  <div>
                    <span>Outcome mix</span>
                    <h2>Success vs failed</h2>
                  </div>
                  <ShieldCheck size={17} />
                </div>
                <Donut
                  data={[
                    { name: "Successful", value: Math.round(analyticsTotals.success) },
                    { name: "Failed", value: Math.max(0, 100 - Math.round(analyticsTotals.success)) },
                  ]}
                />
              </article>
            </section>

            <section className={styles.grid2}>
              <article className={styles.card}>
                <div className={styles.cardHead}>
                  <div>
                    <span>Execution economics</span>
                    <h2>Cost trend</h2>
                  </div>
                  <Zap size={17} />
                </div>
                <MiniLine values={pageData.analytics.map((p) => p.cost)} labels={pageData.analytics.map((p) => p.label)} />
              </article>

              <article className={styles.card}>
                <div className={styles.cardHead}>
                  <div>
                    <span>Execution performance</span>
                    <h2>Latency trend</h2>
                  </div>
                  <Clock3 size={17} />
                </div>
                <MiniLine values={pageData.analytics.map((p) => p.latency)} labels={pageData.analytics.map((p) => p.label)} />
              </article>
            </section>
          </>
        )}

        {pageData && mode === "network" && (
          <>
            <section className={styles.kpis}>
              <MetricCard label="Networks" value={String(networkTotals.total)} meta="Connected execution networks" icon={Network} tone="green" />
              <MetricCard label="Operational" value={String(networkTotals.operational)} meta="Currently operational" icon={CheckCircle2} tone="blue" />
              <MetricCard label="Avg. Health" value={`${networkTotals.health.toFixed(1)}%`} meta="Network health index" icon={ShieldCheck} tone="purple" />
              <MetricCard label="Avg. Activity" value={`${Math.round(networkTotals.activity)}%`} meta="Current chain activity" icon={Activity} tone="orange" />
            </section>

            <section className={styles.grid2}>
              <article className={styles.card}>
                <div className={styles.cardHead}>
                  <div>
                    <span>Network activity</span>
                    <h2>Chain utilization</h2>
                  </div>
                  <Network size={17} />
                </div>
                <MiniLine values={pageData.networks.map((n) => n.activity)} labels={pageData.networks.map((n) => n.chain)} />
              </article>

              <article className={styles.card}>
                <div className={styles.cardHead}>
                  <div>
                    <span>Connected networks</span>
                    <h2>Activity distribution</h2>
                  </div>
                  <Network size={17} />
                </div>
                <Donut data={pageData.networkDistribution} />
              </article>
            </section>

            <article className={styles.card}>
              <div className={styles.cardHead}>
                <div>
                  <span>Operational state</span>
                  <h2>Network health</h2>
                </div>
                <ArrowUpRight size={17} />
              </div>

              <div className={styles.tableWrap}>
                <div className={`${styles.tableRow} ${styles.networkHeader}`}>
                  <span>Network</span><span>Status</span><span>Activity</span><span>Gas</span><span>Health</span>
                </div>
                {pageData.networks.map((network) => (
                  <div className={styles.tableRow} key={network.chain}>
                    <span><b>{network.chain}</b></span>
                    <span>
                      <i className={network.status === "operational" ? styles.statusGood : styles.statusWarn} />
                      {network.status}
                    </span>
                    <span>{network.activity}%</span>
                    <span>{network.gas} gwei</span>
                    <span className={network.health >= 97 ? styles.good : styles.warn}>{network.health}%</span>
                  </div>
                ))}
              </div>
            </article>
          </>
        )}

        <footer className={styles.footer}>
          <span>© 2026 RouteX. All systems operational.</span>
          <span>Built for a more connected cross-chain ecosystem.</span>
        </footer>
      </main>
    </div>
  );
}
