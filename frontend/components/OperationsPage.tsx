"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Command,
  GitBranch,
  LayoutDashboard,
  LockKeyhole,
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
import {
  DEMO_EXECUTION_ROUTES,
  DEMO_INTENT,
  DEMO_SECURITY_CHECKS,
  DEMO_TRUST_ASSUMPTIONS,
  type ExecutionRoute,
  type Priority,
} from "@/lib/operations";
import styles from "./OperationsPage.module.css";

type Theme = "light" | "dark";
type Mode = "execute" | "security";

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
  return `$${value.toFixed(2)}`;
}

function RouteLine({ route }: { route: ExecutionRoute }) {
  return (
    <div className={styles.routeLine}>
      {route.path.map((chain, index) => (
        <span className={styles.routeNodeWrap} key={`${route.id}-${chain}`}>
          <span className={styles.routeNode}>
            <span>{chain === "Ethereum" ? "Ξ" : chain[0]}</span>
            {chain}
          </span>
          {index < route.path.length - 1 ? (
            <ArrowRight size={14} className={styles.routeArrow} />
          ) : null}
        </span>
      ))}
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className={styles.routeMetric}>
      <Icon size={14} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </div>
  );
}

export default function OperationsPage({ mode }: { mode: Mode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<Theme>("light");
  const [priority, setPriority] = useState<Priority>("Balanced");
  const [amount, setAmount] = useState(DEMO_INTENT.amount);
  const [asset, setAsset] = useState(DEMO_INTENT.asset);
  const [source, setSource] = useState(DEMO_INTENT.source);
  const [destination, setDestination] = useState(DEMO_INTENT.destination);
  const [selectedRouteId, setSelectedRouteId] = useState("route-a");
  const [routeFound, setRouteFound] = useState(false);
  const [approval, setApproval] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("routex-theme") as Theme | null;
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const selectedRoute =
    DEMO_EXECUTION_ROUTES.find((route) => route.id === selectedRouteId) ??
    DEMO_EXECUTION_ROUTES[0];

  const recommendedRoute = useMemo(() => {
    if (priority === "Cheapest") {
      return DEMO_EXECUTION_ROUTES.reduce((a, b) => (a.cost < b.cost ? a : b));
    }
    if (priority === "Fastest") {
      return DEMO_EXECUTION_ROUTES.reduce((a, b) => (a.time < b.time ? a : b));
    }
    if (priority === "Reliability") {
      return DEMO_EXECUTION_ROUTES.reduce((a, b) =>
        a.reliability > b.reliability ? a : b,
      );
    }
    return DEMO_EXECUTION_ROUTES[0];
  }, [priority]);

  useEffect(() => {
    setSelectedRouteId(recommendedRoute.id);
  }, [recommendedRoute.id]);

  const title = mode === "execute" ? "Intelligent Execute" : "Security Intelligence";
  const subtitle =
    mode === "execute"
      ? "Turn your desired outcome into an evaluated, explainable execution plan."
      : "Review what you are signing, what permissions are involved and what the route assumes.";

  return (
    <div className={`${styles.shell} ${theme === "dark" ? styles.dark : ""}`}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandMark}><Command size={15} /></div>
          <span>RouteX</span>
        </div>

        <nav className={styles.nav} aria-label="RouteX navigation">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`${styles.navItem} ${pathname === item.href ? styles.navActive : ""}`}
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
            <input placeholder="Search chains, tokens, protocols..." aria-label="Search" />
            <span>⌘ K</span>
          </div>

          <div className={styles.actions}>
            <div className={styles.themeToggle}>
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
            <div className={styles.kicker}>ROUTEX / {mode === "execute" ? "EXECUTION" : "SECURITY"}</div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          <div className={styles.statusCard}>
            <span className={styles.liveDot} />
            <div>
              <strong>Demo intelligence</strong>
              <small>Ready for backend data</small>
            </div>
          </div>
        </section>

        {mode === "execute" ? (
          <>
            <section className={styles.executeGrid}>
              <article className={styles.intentCard}>
                <div className={styles.cardHead}>
                  <div>
                    <span>STEP 01 / INTENT</span>
                    <h2>What do you want to do?</h2>
                  </div>
                  <Sparkles size={17} />
                </div>

                <p className={styles.helper}>
                  Describe the outcome. RouteX evaluates the available execution paths for you.
                </p>

                <div className={styles.intentForm}>
                  <div className={styles.inputWide}>
                    <label>Amount</label>
                    <div className={styles.inputBox}>
                      <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} />
                      <select value={asset} onChange={(e) => setAsset(e.target.value)}>
                        <option>USDC</option>
                        <option>ETH</option>
                        <option>USDT</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.twoInputs}>
                    <label>
                      From
                      <select value={source} onChange={(e) => setSource(e.target.value)}>
                        <option>Ethereum</option>
                        <option>Arbitrum</option>
                        <option>Optimism</option>
                      </select>
                    </label>
                    <div className={styles.swapIcon}><ArrowRight size={13} /></div>
                    <label>
                      To
                      <select value={destination} onChange={(e) => setDestination(e.target.value)}>
                        <option>Base</option>
                        <option>Arbitrum</option>
                        <option>Optimism</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className={styles.priority}>
                  <span>Policy</span>
                  <div>
                    {(["Balanced", "Cheapest", "Fastest", "Reliability"] as Priority[]).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setPriority(item)}
                        className={priority === item ? styles.priorityActive : ""}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => {
                    setRouteFound(true);
                    setSelectedRouteId(recommendedRoute.id);
                  }}
                >
                  Find execution route
                  <ArrowRight size={15} />
                </button>
              </article>

              <article className={styles.summaryCard}>
                <div className={styles.summaryBadge}><Sparkles size={13} /> ROUTEX INTELLIGENCE</div>
                <span className={styles.summaryLabel}>Recommended execution</span>
                <h2>{amount || "0"} {asset}</h2>
                <RouteLine route={selectedRoute} />

                <div className={styles.metrics}>
                  <Metric icon={CircleDollarSign} label="Estimated cost" value={money(selectedRoute.cost)} detail="network + provider" />
                  <Metric icon={Clock3} label="Estimated time" value={`${selectedRoute.time}s`} detail="execution estimate" />
                  <Metric icon={ShieldCheck} label="Reliability" value={`${selectedRoute.reliability}%`} detail="observed reliability" />
                </div>

                <div className={styles.explanation}>
                  <div className={styles.explanationIcon}><Sparkles size={14} /></div>
                  <div>
                    <strong>Why this route?</strong>
                    <p>
                      {priority === "Balanced"
                        ? "It provides the strongest balance across cost, latency and reliability."
                        : `It is selected according to your ${priority.toLowerCase()} policy.`}
                    </p>
                  </div>
                </div>

                <button type="button" className={styles.executeButton}>
                  Execute route
                  <ArrowRight size={15} />
                </button>
                {routeFound ? <span className={styles.found}>✓ Route evaluation updated</span> : null}
              </article>
            </section>

            <section className={styles.card}>
              <div className={styles.cardHead}>
                <div>
                  <span>STEP 02 / ROUTE OPTIONS</span>
                  <h2>Evaluated execution paths</h2>
                </div>
                <GitBranch size={17} />
              </div>

              <div className={styles.routeList}>
                {DEMO_EXECUTION_ROUTES.map((route) => (
                  <button
                    key={route.id}
                    type="button"
                    className={`${styles.routeOption} ${selectedRouteId === route.id ? styles.routeSelected : ""}`}
                    onClick={() => setSelectedRouteId(route.id)}
                  >
                    <div className={styles.routeOptionMain}>
                      <span className={styles.radio}>{selectedRouteId === route.id ? "✓" : ""}</span>
                      <div>
                        <RouteLine route={route} />
                        <small>{route.provider} · {route.hops} {route.hops === 1 ? "hop" : "hops"}</small>
                      </div>
                    </div>
                    <div className={styles.routeStats}>
                      <span><b>{money(route.cost)}</b><small>cost</small></span>
                      <span><b>{route.time}s</b><small>time</small></span>
                      <span><b>{route.reliability}%</b><small>reliability</small></span>
                      <ChevronRight size={15} />
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            <section className={styles.securityHero}>
              <article className={styles.securitySummary}>
                <div className={styles.summaryBadge}><ShieldCheck size={13} /> BEFORE-SIGN REVIEW</div>
                <span className={styles.summaryLabel}>Execution security</span>
                <h2>{amount} {asset}</h2>
                <div className={styles.securityRoute}>
                  <span>{source}</span><ArrowRight size={14} /><span>{destination}</span>
                </div>
                <p>
                  Review the transaction, approvals, destination and route trust assumptions before signing.
                </p>
              </article>

              <article className={styles.readinessCard}>
                <div className={styles.readinessIcon}><ShieldCheck size={19} /></div>
                <span>Execution readiness</span>
                <strong>Review complete</strong>
                <small>One approval item needs your attention.</small>
              </article>
            </section>

            <section className={styles.grid2}>
              <article className={styles.card}>
                <div className={styles.cardHead}>
                  <div>
                    <span>PRE-EXECUTION</span>
                    <h2>Security checks</h2>
                  </div>
                  <LockKeyhole size={17} />
                </div>

                <div className={styles.checkList}>
                  {DEMO_SECURITY_CHECKS.map((check) => (
                    <div className={styles.checkRow} key={check.label}>
                      <div className={check.status === "pass" ? styles.checkPass : styles.checkAttention}>
                        {check.status === "pass" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                      </div>
                      <div>
                        <strong>{check.label}</strong>
                        <span>{check.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className={styles.card}>
                <div className={styles.cardHead}>
                  <div>
                    <span>PERMISSIONS</span>
                    <h2>Token approval</h2>
                  </div>
                  <WalletCards size={17} />
                </div>

                <div className={styles.approvalBox}>
                  <div className={styles.tokenRow}>
                    <div className={styles.tokenIcon}>$</div>
                    <div><strong>{asset}</strong><span>Token allowance</span></div>
                  </div>
                  <div className={styles.approvalNumbers}>
                    <div><span>Current allowance</span><strong>{approval ? `${amount} ${asset}` : `0 ${asset}`}</strong></div>
                    <div><span>Required</span><strong>{amount} {asset}</strong></div>
                  </div>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => setApproval(true)}
                  >
                    {approval ? "Approval recorded" : `Approve ${amount} ${asset}`}
                    {approval ? <CheckCircle2 size={14} /> : <ArrowRight size={14} />}
                  </button>
                </div>
              </article>
            </section>

            <section className={styles.grid2}>
              <article className={styles.card}>
                <div className={styles.cardHead}>
                  <div>
                    <span>ROUTE TRUST</span>
                    <h2>Trust assumptions</h2>
                  </div>
                  <GitBranch size={17} />
                </div>
                <div className={styles.assumptionList}>
                  {DEMO_TRUST_ASSUMPTIONS.map((item, index) => (
                    <div className={styles.assumption} key={item}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article className={styles.card}>
                <div className={styles.cardHead}>
                  <div>
                    <span>TRANSACTION PREVIEW</span>
                    <h2>What you are signing</h2>
                  </div>
                  <ArrowDown size={17} />
                </div>

                <div className={styles.preview}>
                  <div><span>Asset</span><strong>{amount} {asset}</strong></div>
                  <div><span>Source</span><strong>{source}</strong></div>
                  <div><span>Destination</span><strong>{destination}</strong></div>
                  <div><span>Route</span><strong>{selectedRoute.provider} · {selectedRoute.hops} hop</strong></div>
                  <div><span>Estimated network fee</span><strong>{money(selectedRoute.cost)}</strong></div>
                </div>
              </article>
            </section>

            <div className={styles.securityNotice}>
              <ShieldCheck size={16} />
              <div>
                <strong>Security information is evidence-based</strong>
                <span>Demo values are placeholders for the frontend. Production checks should come from wallet, simulation, provider and blockchain data.</span>
              </div>
            </div>
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
