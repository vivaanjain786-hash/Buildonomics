"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
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

import { evaluateRoutes } from "@/lib/api";
import type {
  Preference,
  Route,
  RouteEvaluationResponse,
} from "@/lib/types";

/*
 * These are UI controls only.
 *
 * They are NOT blockchain data, route data, provider data,
 * pricing data, or recommendation data.
 *
 * The selected preference is sent to the backend.
 */
const policies: {
  label: string;
  value: Preference;
}[] = [
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
];

function money(value: number) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return `$${value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;
}

function duration(seconds: number) {
  if (!Number.isFinite(seconds)) {
    return "—";
  }

  const totalSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s`;
}

/*
 * Supports both common backend representations:
 *
 * 0.991  -> 99.1%
 * 99.1   -> 99.1%
 *
 * This does not create data. It only formats the value returned
 * by the backend.
 */
function reliability(value: number) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  const percentage = value >= 0 && value <= 1 ? value * 100 : value;

  return `${percentage.toFixed(1)}%`;
}

function percentage(value: number) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  const normalized = value >= 0 && value <= 1 ? value * 100 : value;

  return `${normalized.toFixed(2)}%`;
}

function formatPreference(preference: Preference) {
  switch (preference) {
    case "lowest_cost":
      return "Lowest cost";

    case "fastest":
      return "Fastest";

    case "reliability":
      return "Reliability";

    case "balanced":
      return "Balanced";

    default:
      return preference;
  }
}

function getSecurityText(route: Route) {
  if (
    Array.isArray(route.security_assumptions) &&
    route.security_assumptions.length > 0
  ) {
    return route.security_assumptions.join(" · ");
  }

  return "Not provided";
}

function IntelligenceContent() {
  const router = useRouter();
  const params = useSearchParams();

  /*
   * The execution intent comes from the previous page.
   *
   * Nothing related to a blockchain, route, provider, amount,
   * price, latency, liquidity, reliability, etc. is created here.
   */
  const source = params.get("source");
  const destination = params.get("destination");
  const asset = params.get("asset");
  const amount = params.get("amount");
  const urlPreference = params.get("preference");

  const validPreference: Preference | null =
    urlPreference === "lowest_cost" ||
    urlPreference === "fastest" ||
    urlPreference === "balanced" ||
    urlPreference === "reliability"
      ? urlPreference
      : null;

  const [preference, setPreference] =
    useState<Preference | null>(validPreference);

  const [data, setData] =
    useState<RouteEvaluationResponse | null>(null);

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * Keep the local preference synchronized with the URL.
   */
  useEffect(() => {
    setPreference(validPreference);
  }, [validPreference]);

  /*
   * Ask the backend for route intelligence.
   *
   * The frontend sends ONLY the execution intent.
   *
   * The backend is responsible for:
   *
   * - discovering routes
   * - calculating cost
   * - calculating latency
   * - calculating liquidity
   * - calculating slippage
   * - calculating reliability
   * - calculating Pareto optimality
   * - selecting the recommended route
   * - generating the explanation
   */
  useEffect(() => {
    if (
      !source ||
      !destination ||
      !asset ||
      !amount ||
      !preference
    ) {
      setData(null);
      setSelectedId(null);
      setError(null);
      setLoading(false);
      return;
    }

    const sourceChain = source;
    const destinationChain = destination;
    const assetName = asset;
    const amountValue = Number(amount);
    const preferenceValue = preference;

    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setData(null);
      setSelectedId(null);
      setError("Invalid execution amount.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadRoutes() {
      try {
        setLoading(true);
        setError(null);

        const result = await evaluateRoutes({
          source_chain: sourceChain,
          destination_chain: destinationChain,
          asset: assetName,
          amount: amountValue,
          preference: preferenceValue,
        });

        if (cancelled) {
          return;
        }

        setData(result);

        /*
         * Recommendation comes from the backend.
         *
         * First preference:
         * recommended_route_id
         *
         * Fallback:
         * route.recommended
         *
         * If neither exists, nothing is selected.
         */
        const backendRecommended =
          result.recommended_route_id;

        const recommendedRoute =
          backendRecommended
            ? result.routes.find(
                (route) =>
                  route.id === backendRecommended
              )
            : result.routes.find(
                (route) => route.recommended
              );

        setSelectedId(
          recommendedRoute?.id ?? null
        );
      } catch (err) {
        if (cancelled) {
          return;
        }

        setData(null);
        setSelectedId(null);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load route intelligence."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRoutes();

    return () => {
      cancelled = true;
    };
  }, [
    source,
    destination,
    asset,
    amount,
    preference,
  ]);

  /*
   * EVERYTHING below this point is derived from backend data.
   */
  const routes = data?.routes ?? [];

  const selected =
    routes.find(
      (route) => route.id === selectedId
    ) ?? null;

  /*
   * Create graph nodes from route paths returned
   * by the backend.
   */
  const graphNodes = useMemo(() => {
    const nodes: string[] = [];

    for (const route of routes) {
      for (const chain of route.path) {
        if (!nodes.includes(chain)) {
          nodes.push(chain);
        }
      }
    }

    return nodes;
  }, [routes]);

  /*
   * Create graph connections from backend route paths.
   */
  const graphEdges = useMemo(() => {
    const edgeMap = new Map<
      string,
      {
        from: string;
        to: string;
        routeIds: string[];
      }
    >();

    for (const route of routes) {
      if (!Array.isArray(route.path)) {
        continue;
      }

      for (
        let i = 0;
        i < route.path.length - 1;
        i++
      ) {
        const from = route.path[i];
        const to = route.path[i + 1];

        if (!from || !to) {
          continue;
        }

        const key = `${from}::${to}`;

        const existing = edgeMap.get(key);

        if (existing) {
          if (!existing.routeIds.includes(route.id)) {
            existing.routeIds.push(route.id);
          }
        } else {
          edgeMap.set(key, {
            from,
            to,
            routeIds: [route.id],
          });
        }
      }
    }

    return Array.from(edgeMap.values());
  }, [routes]);

  const paretoCount = routes.filter(
    (route) => route.pareto_optimal
  ).length;

  /*
   * graphNodes is intentionally calculated above even though
   * the current visual graph uses edges directly.
   *
   * This gives us a clean backend-driven graph model for
   * future D3 / interactive graph implementation.
   */
  void graphNodes;

  const handlePolicyChange = (
    nextPreference: Preference
  ) => {
    const nextParams =
      new URLSearchParams(params.toString());

    nextParams.set(
      "preference",
      nextPreference
    );

    router.replace(
      `/intelligence?${nextParams.toString()}`,
      {
        scroll: false,
      }
    );
  };

  const continueToExecution = () => {
    if (!selected || !data) {
      return;
    }

    const nextParams =
      new URLSearchParams();

    /*
     * Route ID comes directly from backend data.
     */
    nextParams.set(
      "route",
      selected.id
    );

    /*
     * Request ID comes directly from backend data.
     */
    nextParams.set(
      "request_id",
      data.request_id
    );

    /*
     * Preserve the execution intent supplied by
     * the previous page.
     */
    if (source) {
  nextParams.set(
    "source_chain",
    source
  );
}

if (destination) {
  nextParams.set(
    "destination_chain",
    destination
  );
}

    if (asset) {
      nextParams.set(
        "asset",
        asset
      );
    }

    if (amount) {
      nextParams.set(
        "amount",
        amount
      );
    }

    if (preference) {
      nextParams.set(
        "preference",
        preference
      );
    }

    router.push(
      `/execute?${nextParams.toString()}`
    );
  };

  /*
   * No execution intent was supplied.
   */
  if (
    !source ||
    !destination ||
    !asset ||
    !amount ||
    !preference
  ) {
    return (
      <div className="intelligence-page">
        <header className="intel-topbar">
          <button
            className="intel-back"
            onClick={() =>
              router.push("/")
            }
          >
            <ArrowLeft size={15} />
            Command Center
          </button>

          <div className="intel-breadcrumb">
            <span>RouteX</span>
            <ChevronRight size={12} />
            <strong>
              Route Intelligence
            </strong>
          </div>

          <div className="intel-live">
            <span className="routex-dot" />
            Waiting for execution intent
          </div>
        </header>

        <main className="intel-content">
          <div className="intel-hero">
            <div>
              <div className="routex-eyebrow">
                Route discovery / decision engine
              </div>

              <h1 className="intel-title">
                Route{" "}
                <span>
                  intelligence.
                </span>
              </h1>

              <p className="intel-copy">
                Submit a complete execution
                intent to discover and evaluate
                available routes.
              </p>
            </div>
          </div>

          <section className="intel-card intel-detail">
            <div className="intel-label">
              Execution intent
            </div>

            <h2>
              No execution request available
            </h2>

            <p className="simple-copy">
              Source chain, destination chain,
              asset, amount and preference are
              required before route evaluation
              can begin.
            </p>

            <button
              className="intel-execute"
              onClick={() =>
                router.push("/")
              }
            >
              Return to Command Center
              <ArrowRight size={14} />
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="intelligence-page">
      <header className="intel-topbar">
        <button
          className="intel-back"
          onClick={() =>
            router.push("/")
          }
        >
          <ArrowLeft size={15} />
          Command Center
        </button>

        <div className="intel-breadcrumb">
          <span>RouteX</span>
          <ChevronRight size={12} />
          <strong>
            Route Intelligence
          </strong>
        </div>

        <div className="intel-live">
          <span className="routex-dot" />

          {loading
            ? "Evaluating routes"
            : error
              ? "Engine unavailable"
              : "Decision engine ready"}
        </div>
      </header>

      <main className="intel-content">
        <div className="intel-hero">
          <div>
            <div className="routex-eyebrow">
              Route discovery / decision engine
            </div>

            <h1 className="intel-title">
              Route{" "}
              <span>
                intelligence.
              </span>
            </h1>

            <p className="intel-copy">
              Evaluate viable execution paths
              for{" "}
              <strong>
                {amount} {asset}
              </strong>{" "}
              from{" "}
              <strong>
                {source}
              </strong>{" "}
              to{" "}
              <strong>
                {destination}
              </strong>{" "}
              across cost, latency, liquidity,
              slippage, reliability and security
              assumptions.
            </p>
          </div>

          {!loading &&
            !error &&
            data && (
              <div className="intel-route-pill">
                <Network size={14} />

                {routes.length} candidates ·{" "}
                {paretoCount} Pareto-optimal
              </div>
            )}
        </div>

        {loading && (
          <section className="intel-card intel-detail">
            <div className="intel-label">
              Route evaluation
            </div>

            <h2>
              Evaluating execution paths...
            </h2>

            <p className="simple-copy">
              The execution intelligence backend
              is evaluating available routes for
              this intent.
            </p>
          </section>
        )}

        {!loading && error && (
          <section className="intel-card intel-detail">
            <div className="intel-label">
              Route evaluation
            </div>

            <h2>
              Unable to load route intelligence
            </h2>

            <p className="simple-copy">
              {error}
            </p>

            <button
              className="intel-execute"
              onClick={() =>
                window.location.reload()
              }
            >
              Retry evaluation
              <ArrowRight size={14} />
            </button>
          </section>
        )}

        {!loading &&
          !error &&
          data &&
          routes.length === 0 && (
            <section className="intel-card intel-detail">
              <div className="intel-label">
                Route evaluation
              </div>

              <h2>
                No candidate routes returned
              </h2>

              <p className="simple-copy">
                The backend did not return an
                executable route for this
                execution intent.
              </p>
            </section>
          )}

        {!loading &&
          !error &&
          data &&
          routes.length > 0 && (
            <>
              <div className="intel-workspace">
                <section className="intel-card intel-graph-card">
                  <div className="intel-card-head">
                    <div>
                      <div className="intel-label">
                        Dynamic route graph
                      </div>

                      <h2>
                        {data.source_chain}
                        <span> → </span>
                        {data.destination_chain}
                      </h2>
                    </div>

                    <GitBranch size={18} />
                  </div>

                  <div
                    className="intel-graph"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                      padding: "24px",
                    }}
                  >
                    {graphEdges.length > 0 ? (
                      graphEdges.map(
                        (edge) => (
                          <div
                            key={`${edge.from}-${edge.to}`}
                            style={{
                              display: "flex",
                              alignItems:
                                "center",
                              gap: "12px",
                              flexWrap:
                                "wrap",
                            }}
                          >
                            <div className="intel-node">
                              <strong>
                                {edge.from}
                              </strong>

                              <small>
                                CHAIN
                              </small>
                            </div>

                            <div
                              style={{
                                flex:
                                  "1 1 80px",
                                minWidth:
                                  "80px",
                                height: "1px",
                                background:
                                  "rgba(143, 134, 238, 0.45)",
                              }}
                            />

                            <div
                              className="intel-edge"
                              style={{
                                position:
                                  "static",
                                transform:
                                  "none",
                              }}
                            >
                              <span>
                                {edge.routeIds.join(
                                  " · "
                                )}
                              </span>
                            </div>

                            <div
                              style={{
                                flex:
                                  "1 1 80px",
                                minWidth:
                                  "80px",
                                height: "1px",
                                background:
                                  "rgba(143, 134, 238, 0.45)",
                              }}
                            />

                            <div className="intel-node">
                              <strong>
                                {edge.to}
                              </strong>

                              <small>
                                CHAIN
                              </small>
                            </div>
                          </div>
                        )
                      )
                    ) : (
                      <div className="simple-copy">
                        No graph connections were
                        returned by the backend.
                      </div>
                    )}
                  </div>

                  <div className="intel-graph-note">
                    <Info size={13} />

                    Nodes represent chains.
                    Connections represent the
                    mechanisms represented by
                    routes returned by the execution
                    intelligence backend.
                  </div>
                </section>

                <section className="intel-card intel-recommendation">
                  <div className="intel-card-head">
                    <div>
                      <div className="intel-label">
                        Policy layer
                      </div>

                      <h2>
                        Recommendation
                      </h2>
                    </div>

                    <Sparkles size={18} />
                  </div>

                  {data.recommended_route_id &&
                  routes.find(
                    (route) =>
                      route.id ===
                      data.recommended_route_id
                  ) ? (
                    (() => {
                      const recommendation =
                        routes.find(
                          (route) =>
                            route.id ===
                            data.recommended_route_id
                        );

                      if (!recommendation) {
                        return null;
                      }

                      return (
                        <>
                          <div className="intel-rec-main">
                            <div className="intel-rec-title">
                              <strong>
                                {
                                  recommendation.id
                                }
                              </strong>

                              <span>
                                <Check size={12} />
                                RECOMMENDED
                              </span>
                            </div>

                            <div className="intel-rec-path">
                              {recommendation.path.join(
                                " → "
                              )}{" "}
                              ·{" "}
                              {
                                recommendation.provider
                              }
                            </div>
                          </div>

                          <div className="intel-metrics">
                            <div>
                              <small>
                                COST
                              </small>

                              <strong>
                                {money(
                                  recommendation.cost
                                )}
                              </strong>
                            </div>

                            <div>
                              <small>
                                LATENCY
                              </small>

                              <strong>
                                {duration(
                                  recommendation.latency_seconds
                                )}
                              </strong>
                            </div>

                            <div>
                              <small>
                                RELIABILITY
                              </small>

                              <strong>
                                {reliability(
                                  recommendation.reliability
                                )}
                              </strong>
                            </div>
                          </div>

                          <div className="intel-why">
                            <small>
                              WHY THIS ROUTE
                            </small>

                            <p>
                              {data.explanation ||
                                "No explanation was provided by the backend."}
                            </p>
                          </div>

                          <div className="intel-policy-caption">
                            Policy:{" "}
                            <strong>
                              {formatPreference(
                                data.preference
                              )}
                            </strong>
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <div className="simple-copy">
                      The backend did not provide a
                      recommended route.
                    </div>
                  )}
                </section>
              </div>

              <section className="intel-card intel-table-card">
                <div className="intel-table-head">
                  <div>
                    <div className="intel-label">
                      Normalized evaluation
                    </div>

                    <h2>
                      Compare candidate routes
                    </h2>
                  </div>

                  <div className="intel-policies">
                    {policies.map(
                      (policy) => (
                        <button
                          key={
                            policy.value
                          }
                          className={
                            preference ===
                            policy.value
                              ? "active"
                              : ""
                          }
                          onClick={() =>
                            handlePolicyChange(
                              policy.value
                            )
                          }
                        >
                          {policy.label}
                        </button>
                      )
                    )}
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

                  {routes.map(
                    (route) => (
                      <button
                        key={route.id}
                        className={`intel-row intel-data ${
                          selected?.id ===
                          route.id
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedId(
                            route.id
                          )
                        }
                      >
                        <span>
                          <strong>
                            {route.id}
                          </strong>

                          <small>
                            {route.path.join(
                              " → "
                            )}{" "}
                            ·{" "}
                            {
                              route.provider
                            }
                          </small>
                        </span>

                        <span>
                          {money(
                            route.cost
                          )}
                        </span>

                        <span>
                          {duration(
                            route.latency_seconds
                          )}
                        </span>

                        <span>
                          {money(
                            route.liquidity
                          )}
                        </span>

                        <span>
                          {percentage(
                            route.slippage
                          )}
                        </span>

                        <span>
                          {reliability(
                            route.reliability
                          )}
                        </span>

                        <span
                          className={
                            route.pareto_optimal
                              ? "pareto"
                              : "normal"
                          }
                        >
                          {route.pareto_optimal
                            ? "PARETO"
                            : route.status ||
                              "Candidate"}
                        </span>
                      </button>
                    )
                  )}
                </div>
              </section>

              {selected && (
                <div className="intel-detail-grid">
                  <section className="intel-card intel-detail">
                    <div className="intel-label">
                      Selected route
                    </div>

                    <h2>
                      {selected.id} ·{" "}
                      {selected.provider}
                    </h2>

                    <div className="intel-path-large">
                      {selected.path.map(
                        (
                          node,
                          index
                        ) => (
                          <span
                            key={`${node}-${index}`}
                          >
                            <b>
                              {node}
                            </b>

                            {index <
                              selected.path
                                .length -
                                1 && (
                              <ArrowRight
                                size={14}
                              />
                            )}
                          </span>
                        )
                      )}
                    </div>

                    <div className="intel-detail-stats">
                      <div>
                        <DollarSign />

                        <small>
                          Execution cost
                        </small>

                        <strong>
                          {money(
                            selected.cost
                          )}
                        </strong>
                      </div>

                      <div>
                        <Clock3 />

                        <small>
                          Estimated latency
                        </small>

                        <strong>
                          {duration(
                            selected.latency_seconds
                          )}
                        </strong>
                      </div>

                      <div>
                        <TrendingDown />

                        <small>
                          Expected slippage
                        </small>

                        <strong>
                          {percentage(
                            selected.slippage
                          )}
                        </strong>
                      </div>

                      <div>
                        <ShieldCheck />

                        <small>
                          Security model
                        </small>

                        <strong>
                          {getSecurityText(
                            selected
                          )}
                        </strong>
                      </div>
                    </div>
                  </section>

                  <section className="intel-card intel-explain">
                    <div className="intel-label">
                      Explainability
                    </div>

                    <h2>
                      Route evaluation details
                    </h2>

                    {data.explanation ? (
                      <p className="simple-copy">
                        {data.explanation}
                      </p>
                    ) : (
                      <p className="simple-copy">
                        The backend did not
                        provide an explanation
                        for this route.
                      </p>
                    )}

                    {Array.isArray(
                      selected.security_assumptions
                    ) &&
                      selected
                        .security_assumptions
                        .length > 0 && (
                        <ul>
                          {selected.security_assumptions.map(
                            (
                              assumption,
                              index
                            ) => (
                              <li
                                key={`${assumption}-${index}`}
                              >
                                <Check />
                                {assumption}
                              </li>
                            )
                          )}
                        </ul>
                      )}

                    <button
                      className="intel-execute"
                      onClick={
                        continueToExecution
                      }
                    >
                      Continue to execution
                      <ArrowRight size={14} />
                    </button>
                  </section>
                </div>
              )}
            </>
          )}
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
            Loading{" "}
            <span>
              route intelligence.
            </span>
          </h1>

          <p className="simple-copy">
            Preparing the execution intelligence
            layer...
          </p>
        </main>
      }
    >
      <IntelligenceContent />
    </Suspense>
  );
}