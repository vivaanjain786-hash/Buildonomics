import networkx as nx

from .models import Route


def build_demo_graph() -> nx.DiGraph:
    """
    Build the initial execution graph.

    Nodes:
        Blockchain networks

    Edges:
        Possible execution paths between chains

    NOTE:
        Current values are synthetic.
        Later these will come from real provider/blockchain telemetry.
    """

    graph = nx.DiGraph()

    # ---------------------------------------------------------
    # Ethereum -> Base
    # ---------------------------------------------------------

    graph.add_edge(
        "ethereum",
        "base",
        route=Route(
            route_id="eth-base-direct-a",
            provider="ProviderA",
            chains=["ethereum", "base"],
            fee=3.20,
            latency_seconds=42,
            reliability=0.992,
            liquidity=2_000_000,
            hops=1,
        ),
    )

    # ---------------------------------------------------------
    # Ethereum -> Arbitrum
    # ---------------------------------------------------------

    graph.add_edge(
        "ethereum",
        "arbitrum",
        route=Route(
            route_id="eth-arb-b",
            provider="ProviderB",
            chains=["ethereum", "arbitrum"],
            fee=1.40,
            latency_seconds=25,
            reliability=0.995,
            liquidity=3_000_000,
            hops=1,
        ),
    )

    # ---------------------------------------------------------
    # Arbitrum -> Base
    # ---------------------------------------------------------

    graph.add_edge(
        "arbitrum",
        "base",
        route=Route(
            route_id="arb-base-b",
            provider="ProviderB",
            chains=["arbitrum", "base"],
            fee=0.90,
            latency_seconds=18,
            reliability=0.994,
            liquidity=2_500_000,
            hops=1,
        ),
    )

    # ---------------------------------------------------------
    # Ethereum -> Optimism
    # ---------------------------------------------------------

    graph.add_edge(
        "ethereum",
        "optimism",
        route=Route(
            route_id="eth-op-c",
            provider="ProviderC",
            chains=["ethereum", "optimism"],
            fee=1.10,
            latency_seconds=30,
            reliability=0.985,
            liquidity=1_500_000,
            hops=1,
        ),
    )

    # ---------------------------------------------------------
    # Optimism -> Base
    # ---------------------------------------------------------

    graph.add_edge(
        "optimism",
        "base",
        route=Route(
            route_id="op-base-c",
            provider="ProviderC",
            chains=["optimism", "base"],
            fee=0.80,
            latency_seconds=22,
            reliability=0.987,
            liquidity=1_200_000,
            hops=1,
        ),
    )

    return graph


def discover_routes(
    graph: nx.DiGraph,
    source: str,
    destination: str,
    max_hops: int = 3,
) -> list[Route]:
    """
    Discover all simple execution paths between source and destination.

    Example:

        Ethereum -> Base

    could produce:

        Ethereum -> Base
        Ethereum -> Arbitrum -> Base
        Ethereum -> Optimism -> Base
    """

    if source not in graph or destination not in graph:
        return []

    candidates = []

    paths = nx.all_simple_paths(
        graph,
        source,
        destination,
        cutoff=max_hops,
    )

    for path in paths:

        edges = list(
            zip(
                path[:-1],
                path[1:],
            )
        )

        route_parts = [
            graph[source_chain][destination_chain]["route"]
            for source_chain, destination_chain in edges
        ]

        # -----------------------------------------------------
        # Aggregate route characteristics
        # -----------------------------------------------------

        total_fee = sum(
            route.fee
            for route in route_parts
        )

        total_latency = sum(
            route.latency_seconds
            for route in route_parts
        )

        # Conservative reliability model:
        #
        # Every hop must succeed.
        #
        # P(total success)
        # = P(hop1) × P(hop2) × ...
        #
        total_reliability = 1.0

        for route in route_parts:
            total_reliability *= route.reliability

        # The route cannot execute with more liquidity
        # than its weakest hop.
        route_liquidity = min(
            route.liquidity
            for route in route_parts
        )

        total_hops = len(edges)

        providers = sorted(
            {
                route.provider
                for route in route_parts
            }
        )

        provider_name = "+".join(providers)

        route_id = "->".join(path)

        candidates.append(
            Route(
                route_id=route_id,
                provider=provider_name,
                chains=path,
                fee=total_fee,
                latency_seconds=total_latency,
                reliability=total_reliability,
                liquidity=route_liquidity,
                hops=total_hops,
            )
        )

    return candidates