"use client";

import { Suspense, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  DollarSign,
  GitBranch,
  Info,
  Network,
  ShieldCheck,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

type Route = {
  id: string;
  provider: string;
  path: string[];
  cost: number;
  latency: number;
  liquidity: number;
  slippage: number;
  reliability: number;
  hops: number;
  security: string;
  pareto: boolean;
};

const routes: Route[] = [
  {
    id: "RX-01",
    provider: "Canonical",
    path: ["Ethereum", "Base"],
    cost: 4.21,
    latency: 124,
    liquidity: 2400000,
    slippage: 0.08,
    reliability: 99.1,
    hops: 1,
    security: "Canonical bridge",
    pareto: true,
  },
  {
    id: "RX-02",
    provider: "Across",
    path: ["Ethereum", "Base"],
    cost: 3.76,
    latency: 68,
    liquidity: 1850000,
    slippage: 0.11,
    reliability: 98.7,
    hops: 1,
    security: "Intent solver",
    pareto: true,
  },
  {
    id: "RX-03",
    provider: "Arbitrum route",
    path: ["Ethereum", "Arbitrum", "Base"],
    cost: 2.94,
    latency: 210,
    liquidity: 3200000,
    slippage: 0.06,
    reliability: 99.4,
    hops: 2,
    security: "2-step bridge",
    pareto: true,
  },
  {
    id: "RX-04",
    provider: "Optimism route",
    path: ["Ethereum", "Optimism", "Base"],
    cost: 3.12,
    latency: 176,
    liquidity: 2700000,
    slippage: 0.07,
    reliability: 98.9,
    hops: 2,
    security: "2-step bridge",
    pareto: false,
  },
  {
    id: "RX-05",
    provider: "Fast solver",
    path: ["Ethereum", "Base"],
    cost: 5.08,
    latency: 43,
    liquidity: 1200000,
    slippage: 0.15,
    reliability: 97.8,
    hops: 1,
    security: "Solver settlement",
    pareto: false,
  },
];

const policies = [
  "Lowest cost",
  "Fastest",
  "Balanced",
  "Reliability",
] as const;

type Policy = (typeof policies)[number];

function choose(routes: Route[], policy: Policy) {
  const score = (r: Route) => {
    if (policy === "Lowest cost") return r.cost;
    if (policy === "Fastest") return r.latency;
    if (policy === "Reliability") return -r.reliability;

    return (
      r.cost / 4.2 +
      r.latency / 120 -
      (r.reliability / 100) * 1.5 +
      r.hops * 0.25
    );
  };

  return [...routes].sort((a, b) => score(a) - score(b))[0];
}

function money(n: number) {
  return (
    "$" +
    n.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })
  );
}

function duration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;

  return m
    ? `${m}m ${String(s).padStart(2, "0")}s`
    : `${s}s`;
}

function IntelligenceContent() {
  const router = useRouter();
  const params = useSearchParams();

  const [policy, setPolicy] = useState<Policy>("Balanced");
  const [selectedId, setSelectedId] = useState("RX-01");

  const recommendation = useMemo(
    () => choose(routes, policy),
    [policy]
  );

  const selected =
    routes.find((r) => r.id === selectedId) ?? recommendation;

  const amount = params.get("amount") || "500";
  const asset = params.get("asset") || "USDC";
  const source = params.get("source") || "ethereum";
  const destination = params.get("destination") || "base";

  return (
    <div className="intelligence-page">
      <header className="intel-topbar">
        <button
          className="intel-back"
          onClick={() => router.push("/")}
        >
          <ArrowLeft size={15} />
          Command Center
        </button>

        <div className="intel-breadcrumb">
          <span>RouteX</span>
          <ChevronRight size={12} />
          <strong>Route Intelligence</strong>
        </div>

        <div className="intel-live">
          <span className="routex-dot" />
          Decision engine ready
        </div>
      </header>

      <main className="intel-content">
        <div className="intel-hero">
          <div>
            <div className="routex-eyebrow">
              Route discovery / decision engine
            </div>

            <h1 className="intel-title">
              Route <span>intelligence.</span>
            </h1>

            <p className="intel-copy">
              Evaluate viable execution paths for {amount} {asset} from{" "}
              {source} to {destination} across cost, latency, liquidity,
              slippage, reliability and security assumptions.
            </p>
          </div>

          <div className="intel-route-pill">
            <Network size={14} />
            {routes.length} candidates ·{" "}
            {routes.filter((r) => r.pareto).length} Pareto-optimal
          </div>
        </div>

        <div className="intel-workspace">
          <section className="intel-card intel-graph-card">
            <div className="intel-card-head">
              <div>
                <div className="intel-label">
                  Dynamic route graph
                </div>

                <h2>
                  Ethereum <span>→</span> Base
                </h2>
              </div>

              <GitBranch size={18} />
            </div>

            <div className="intel-graph">
              <div className="intel-node source">
                <strong>Ethereum</strong>
                <small>SOURCE</small>
              </div>

              <div className="intel-edge edge-a">
                <span>RX-02 · $3.76 · 68s</span>
              </div>

              <div className="intel-node middle">
                <strong>Arbitrum</strong>
                <small>OPTIONAL HOP</small>
              </div>

              <div className="intel-edge edge-b">
                <span>RX-01 · $4.21 · 124s</span>
              </div>

              <div className="intel-edge edge-c">
                <span>
                  RX-03 · via Arbitrum · $2.94
                </span>
              </div>

              <div className="intel-node destination">
                <strong>Base</strong>
                <small>DESTINATION</small>
              </div>
            </div>

            <div className="intel-graph-note">
              <Info size={13} />
              Nodes represent chains. Edges represent bridge, solver or
              settlement mechanisms.
            </div>
          </section>

          <section className="intel-card intel-recommendation">
            <div className="intel-card-head">
              <div>
                <div className="intel-label">
                  Policy layer
                </div>

                <h2>Recommendation</h2>
              </div>

              <Sparkles size={18} />
            </div>

            <div className="intel-rec-main">
              <div className="intel-rec-title">
                <strong>{recommendation.id}</strong>

                <span>
                  <Check size={12} />
                  RECOMMENDED
                </span>
              </div>

              <div className="intel-rec-path">
                {recommendation.path.join(" → ")} ·{" "}
                {recommendation.provider}
              </div>
            </div>

            <div className="intel-metrics">
              <div>
                <small>COST</small>
                <strong>
                  {money(recommendation.cost)}
                </strong>
              </div>

              <div>
                <small>LATENCY</small>
                <strong>
                  {duration(recommendation.latency)}
                </strong>
              </div>

              <div>
                <small>RELIABILITY</small>
                <strong>
                  {recommendation.reliability}%
                </strong>
              </div>
            </div>

            <div className="intel-why">
              <small>WHY THIS ROUTE</small>

              <p>
                {policy === "Balanced"
                  ? "Balances execution cost, speed, reliability and path complexity instead of optimizing a single metric."
                  : `Selected under the ${policy.toLowerCase()} policy while remaining within the discovered candidate set.`}
              </p>
            </div>

            <div className="intel-policy-caption">
              Policy: <strong>{policy}</strong> · choose another policy below.
            </div>
          </section>
        </div>

        <section className="intel-card intel-table-card">
          <div className="intel-table-head">
            <div>
              <div className="intel-label">
                Normalized evaluation
              </div>

              <h2>Compare candidate routes</h2>
            </div>

            <div className="intel-policies">
              {policies.map((p) => (
                <button
                  key={p}
                  className={policy === p ? "active" : ""}
                  onClick={() => {
                    setPolicy(p);
                    setSelectedId(choose(routes, p).id);
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="intel-table-wrap">
            <div className="intel-row intel-header">
              <span>ROUTE</span>
              <span>COST</span>
              <span>TIME</span>
              <span>LIQUIDITY</span>
              <span>SLIPPAGE</span>
              <span>RELIABILITY</span>
              <span>STATUS</span>
            </div>

            {routes.map((r) => (
              <button
                key={r.id}
                className={`intel-row intel-data ${
                  selected.id === r.id ? "selected" : ""
                }`}
                onClick={() => setSelectedId(r.id)}
              >
                <span>
                  <strong>{r.id}</strong>
                  <small>
                    {r.path.join(" → ")} · {r.provider}
                  </small>
                </span>

                <span>{money(r.cost)}</span>

                <span>{duration(r.latency)}</span>

                <span>{money(r.liquidity)}</span>

                <span>{r.slippage.toFixed(2)}%</span>

                <span>{r.reliability}%</span>

                <span
                  className={
                    r.pareto ? "pareto" : "normal"
                  }
                >
                  {r.pareto ? "PARETO" : "Candidate"}
                </span>
              </button>
            ))}
          </div>
        </section>

        <div className="intel-detail-grid">
          <section className="intel-card intel-detail">
            <div className="intel-label">
              Selected route
            </div>

            <h2>
              {selected.id} · {selected.provider}
            </h2>

            <div className="intel-path-large">
              {selected.path.map((node, i) => (
                <span key={`${node}-${i}`}>
                  <b>{node}</b>

                  {i < selected.path.length - 1 && (
                    <ArrowRight size={14} />
                  )}
                </span>
              ))}
            </div>

            <div className="intel-detail-stats">
              <div>
                <DollarSign />

                <small>Execution cost</small>

                <strong>
                  {money(selected.cost)}
                </strong>
              </div>

              <div>
                <Clock3 />

                <small>Estimated latency</small>

                <strong>
                  {duration(selected.latency)}
                </strong>
              </div>

              <div>
                <TrendingDown />

                <small>Expected slippage</small>

                <strong>
                  {selected.slippage.toFixed(2)}%
                </strong>
              </div>

              <div>
                <ShieldCheck />

                <small>Security model</small>

                <strong>
                  {selected.security}
                </strong>
              </div>
            </div>
          </section>

          <section className="intel-card intel-explain">
            <div className="intel-label">
              Explainability
            </div>

            <h2>
              Why the engine surfaced this path
            </h2>

            <ul>
              <li>
                <Check />
                The route satisfies the requested source and destination.
              </li>

              <li>
                <Check />
                Cost, latency and reliability were normalized before
                comparison.
              </li>

              <li>
                <Check />
                Pareto filtering removes dominated alternatives.
              </li>

              <li>
                <Check />
                The active policy determines the final recommendation.
              </li>
            </ul>

            <button
              className="intel-execute"
              onClick={() =>
                router.push(
                  `/execute?route=${selected.id}&amount=${amount}&asset=${asset}`
                )
              }
            >
              Continue to execution
              <ArrowRight size={14} />
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}

export default function IntelligencePage() {
  return (
    <Suspense
      fallback={
        <main className="simple-product-page">
          <div className="routex-eyebrow">
            Route discovery / decision engine
          </div>

          <h1>
            Loading <span>route intelligence.</span>
          </h1>

          <p className="simple-copy">
            Preparing the execution intelligence layer...
          </p>
        </main>
      }
    >
      <IntelligenceContent />
    </Suspense>
  );
}