from fastapi import FastAPI

from .models import (
    RouteIntent,
    RouteObservation,
)

from .graph import (
    build_demo_graph,
    discover_routes,
)

from .optimizer import (
    satisfies_policy,
    apply_historical_reliability,
    pareto_frontier,
    choose_route,
    explain,
)

from .database import (
    initialize_database,
)

from .telemetry import (
    record_observation,
    get_observations,
    get_route_statistics,
)
from .network_telemetry import (
    collect_and_save_network,
    get_network_snapshots,
)
from .providers.manager import get_live_routes
app = FastAPI(
    title="RouteX Execution Intelligence Engine",
    description=(
        "Provider-neutral intelligence layer "
        "for cross-chain execution."
    ),
    version="0.3.0",
)


# ---------------------------------------------------------
# Initialize systems
# ---------------------------------------------------------

graph = build_demo_graph()

initialize_database()


# ---------------------------------------------------------
# Health
# ---------------------------------------------------------

@app.get("/health")
def health():

    return {
        "status": "ok",
        "engine": "routex",
        "version": "0.3.0",
    }


# ---------------------------------------------------------
# Route intelligence
# ---------------------------------------------------------

@app.post("/v1/route/quote")
def route_quote(
    intent: RouteIntent,
):
    """
    Generate an execution decision for a RouteIntent.

    If a wallet address is supplied, live provider routes
    are requested through the provider manager.

    Without a wallet address, the synthetic demo graph is
    used so the original engine remains testable.
    """

    # -----------------------------------------------------
    # 1. Discover candidate routes
    # -----------------------------------------------------

    if intent.from_address:

        # Live provider path
        candidates = get_live_routes(
            intent
        )

        route_source = "live_provider"

    else:

        # Synthetic/demo path
        candidates = discover_routes(
            graph=graph,
            source=intent.source_chain.lower(),
            destination=intent.destination_chain.lower(),
            max_hops=intent.policy.max_hops or 3,
        )

        route_source = "synthetic_demo"

    # -----------------------------------------------------
    # 2. Retrieve historical telemetry
    # -----------------------------------------------------

    telemetry_stats = {}

    for route in candidates:

        statistics = get_route_statistics(
            route.route_id
        )

        if statistics is not None:

            telemetry_stats[
                route.route_id
            ] = statistics

    # -----------------------------------------------------
    # 3. Apply historical reliability
    # -----------------------------------------------------

    evaluated_routes = apply_historical_reliability(
        routes=candidates,
        telemetry_stats=telemetry_stats,
        min_observations=5,
        prior_strength=20,
    )

    # -----------------------------------------------------
    # 4. Apply hard policy constraints
    # -----------------------------------------------------

    feasible_routes = [
        route
        for route in evaluated_routes
        if satisfies_policy(
            route,
            intent.policy,
        )
    ]

    if not feasible_routes:

        return {
            "status": "no_feasible_route",
            "route_source": route_source,
            "intent": intent.model_dump(),
            "candidate_count": len(candidates),
            "feasible_count": 0,
            "routes": [],
        }

    # -----------------------------------------------------
    # 5. Find Pareto frontier
    # -----------------------------------------------------

    frontier = pareto_frontier(
        feasible_routes
    )

    # -----------------------------------------------------
    # 6. Select route
    # -----------------------------------------------------

    selected = choose_route(
        frontier
    )

    # -----------------------------------------------------
    # 7. Generate explanation
    # -----------------------------------------------------

    explanation = explain(
        selected=selected,
        candidates=candidates,
        frontier=frontier,
    )

    # -----------------------------------------------------
    # 8. Return decision
    # -----------------------------------------------------

    return {
        "status": "ok",

        "route_source": route_source,

        "intent": intent.model_dump(),

        "candidate_count": len(candidates),

        "feasible_count": len(feasible_routes),

        "pareto_frontier_count": len(frontier),

        "selected_route": selected.model_dump(),

        "pareto_frontier": [
            route.model_dump()
            for route in frontier
        ],

        "explanation": explanation,
    }
    # -----------------------------------------------------
    # 1. Discover candidate routes
    # -----------------------------------------------------

    candidates = discover_routes(
        graph=graph,
        source=intent.source_chain.lower(),
        destination=intent.destination_chain.lower(),
        max_hops=intent.policy.max_hops or 3,
    )

    # -----------------------------------------------------
    # 2. Retrieve historical telemetry
    # -----------------------------------------------------

    telemetry_stats = {}

    for route in candidates:

        statistics = get_route_statistics(
            route.route_id
        )

        if statistics is not None:

            telemetry_stats[
                route.route_id
            ] = statistics

    # -----------------------------------------------------
    # 3. Apply historical reliability
    # -----------------------------------------------------

    evaluated_routes = apply_historical_reliability(
        routes=candidates,
        telemetry_stats=telemetry_stats,
        min_observations=5,
        prior_strength=20,
    )

    # -----------------------------------------------------
    # 4. Apply hard policy constraints
    # -----------------------------------------------------

    feasible_routes = [
        route
        for route in evaluated_routes
        if satisfies_policy(
            route,
            intent.policy,
        )
    ]

    if not feasible_routes:

        return {
            "status": "no_feasible_route",
            "intent": intent.model_dump(),
            "candidate_count": len(candidates),
            "feasible_count": 0,
            "routes": [],
        }

    # -----------------------------------------------------
    # 5. Find Pareto frontier
    # -----------------------------------------------------

    frontier = pareto_frontier(
        feasible_routes
    )

    # -----------------------------------------------------
    # 6. Select route
    # -----------------------------------------------------

    selected = choose_route(
        frontier
    )

    # -----------------------------------------------------
    # 7. Generate explanation
    # -----------------------------------------------------

    explanation = explain(
    selected=selected,
    candidates=candidates,
    frontier=frontier,
    )

    # -----------------------------------------------------
    # 8. Return decision
    # -----------------------------------------------------

    return {
        "status": "ok",

        "intent": intent.model_dump(),

        "candidate_count": len(candidates),

        "feasible_count": len(feasible_routes),

        "pareto_frontier_count": len(frontier),

        "selected_route": selected.model_dump(),

        "pareto_frontier": [
            route.model_dump()
            for route in frontier
        ],

        "explanation": explanation,
    }


# ---------------------------------------------------------
# Telemetry ingestion
# ---------------------------------------------------------

@app.post("/v1/telemetry/observations")
def create_observation(
    observation: RouteObservation,
):

    observation_id = record_observation(
        observation
    )

    return {
        "status": "recorded",
        "observation_id": observation_id,
    }


# ---------------------------------------------------------
# Retrieve telemetry
# ---------------------------------------------------------

@app.get("/v1/telemetry/observations")
def list_observations(
    route_id: str | None = None,
):

    observations = get_observations(
        route_id
    )

    return {
        "count": len(observations),
        "observations": observations,
    }


# ---------------------------------------------------------
# Route statistics
# ---------------------------------------------------------

@app.get("/v1/telemetry/routes/{route_id}/statistics")
def route_statistics(
    route_id: str,
):

    statistics = get_route_statistics(
        route_id
    )

    if statistics is None:

        return {
            "status": "not_found",
            "route_id": route_id,
        }

    return {
        "status": "ok",
        "statistics": statistics,
    }
# ---------------------------------------------------------
# Network telemetry
# ---------------------------------------------------------

@app.post("/v1/network/snapshot/{network}")
def collect_network_snapshot(
    network: str,
):
    """
    Collect a live network snapshot and store it.
    """

    try:

        result = collect_and_save_network(
            network.lower()
        )

        return {
            "status": "collected",
            **result,
        }

    except ValueError as error:

        return {
            "status": "error",
            "message": str(error),
        }

    except Exception as error:

        return {
            "status": "error",
            "message": str(error),
        }


@app.get("/v1/network/snapshots")
def list_network_snapshots(
    network: str | None = None,
):
    """
    Retrieve stored network snapshots.

    If network is provided, only snapshots
    for that network are returned.
    """

    snapshots = get_network_snapshots(
        network.lower()
        if network
        else None
    )

    return {
        "count": len(snapshots),
        "snapshots": snapshots,
    }
# ---------------------------------------------------------
# Collect all network telemetry
# ---------------------------------------------------------

@app.post("/v1/network/collect")
def collect_all_network_snapshots():
    """
    Collect and store a live snapshot for every
    supported network.
    """

    from .collector import collect_all_networks

    return collect_all_networks()