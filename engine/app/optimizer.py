from dataclasses import replace

from .models import Route, Policy


def satisfies_policy(
    route: Route,
    policy: Policy,
) -> bool:
    """
    Check whether a route satisfies the application's
    hard constraints.
    """

    # Maximum fee
    if (
        policy.max_fee is not None
        and route.fee > policy.max_fee
    ):
        return False

    # Maximum latency
    if (
        policy.max_latency_seconds is not None
        and route.latency_seconds > policy.max_latency_seconds
    ):
        return False

    # Minimum reliability
    #
    # If the user explicitly requires a minimum reliability,
    # a route with unknown reliability cannot satisfy that
    # hard constraint.
    if policy.min_reliability is not None:

        if route.reliability is None:
            return False

        if route.reliability < policy.min_reliability:
            return False

    # Maximum hops
    if (
        policy.max_hops is not None
        and route.hops > policy.max_hops
    ):
        return False

    return True


def calculate_effective_loss(
    route: Route,
    input_amount: float,
) -> float:
    """
    Calculate estimated output loss for a same-asset transfer.

    Example:

        Input:  10 USDC
        Output: 9.97 USDC

        Effective output loss = 0.03 USDC

    If estimated output is unavailable, the normalized
    execution fee is used as a fallback.
    """

    if route.estimated_output is None:
        return route.fee

    return max(
        0.0,
        input_amount - route.estimated_output,
    )


def apply_historical_reliability(
    routes: list[Route],
    telemetry_stats: dict[str, dict],
    min_observations: int = 5,
    prior_strength: int = 20,
) -> list[Route]:
    """
    Adjust route reliability using historical execution telemetry.

    Historical data is only used when enough observations exist.

    If a route already has a baseline reliability, Bayesian-style
    smoothing combines that baseline with historical observations.

    If the route has no baseline reliability, historical empirical
    reliability is used directly once enough observations exist.
    """

    adjusted_routes = []

    for route in routes:

        stats = telemetry_stats.get(route.route_id)

        # No telemetry for this route.
        if not stats:
            adjusted_routes.append(route)
            continue

        total_executions = stats.get(
            "total_executions",
            0,
        )

        successful_executions = stats.get(
            "successful_executions",
            0,
        )

        # Not enough observations yet.
        if total_executions < min_observations:
            adjusted_routes.append(route)
            continue

        # Empirical historical reliability.
        historical_reliability = (
            successful_executions
            / total_executions
        )

        # If the live provider does not give us a baseline
        # reliability, use the historical value directly.
        if route.reliability is None:

            adjusted_route = replace(
                route,
                reliability=historical_reliability,
            )

            adjusted_routes.append(
                adjusted_route
            )

            continue

        # Existing baseline reliability acts as a prior.
        baseline_reliability = route.reliability

        smoothed_reliability = (
            successful_executions
            + prior_strength * baseline_reliability
        ) / (
            total_executions
            + prior_strength
        )

        adjusted_route = replace(
            route,
            reliability=smoothed_reliability,
        )

        adjusted_routes.append(
            adjusted_route
        )

    return adjusted_routes


def dominates(
    route_a: Route,
    route_b: Route,
) -> bool:
    """
    Determine whether route_a dominates route_b.

    Objectives:

        Minimize:
            fee
            latency
            hops

        Maximize:
            reliability
            liquidity

    Reliability is optional because live providers may not
    expose a reliable historical success probability.

    When reliability is unknown for either route, reliability
    is not used as a comparison dimension between those routes.
    """

    # Core objectives that are always available.
    values_a = [
        route_a.fee,
        route_a.latency_seconds,
        -route_a.liquidity,
        route_a.hops,
    ]

    values_b = [
        route_b.fee,
        route_b.latency_seconds,
        -route_b.liquidity,
        route_b.hops,
    ]

    # Compare the always-available objectives.
    no_worse = all(
        a <= b
        for a, b in zip(
            values_a,
            values_b,
        )
    )

    strictly_better = any(
        a < b
        for a, b in zip(
            values_a,
            values_b,
        )
    )

    # Reliability is compared only when both routes have it.
    if (
        route_a.reliability is not None
        and route_b.reliability is not None
    ):

        if route_a.reliability < route_b.reliability:
            no_worse = False

        if route_a.reliability > route_b.reliability:
            strictly_better = True

    return no_worse and strictly_better


def pareto_frontier(
    routes: list[Route],
) -> list[Route]:
    """
    Return the non-dominated routes.

    These are the routes for which there is no other route
    that is better or equal across every available objective.
    """

    frontier = []

    for candidate in routes:

        is_dominated = any(
            dominates(
                other,
                candidate,
            )
            for other in routes
            if other != candidate
        )

        if not is_dominated:
            frontier.append(candidate)

    return frontier


def choose_route(
    frontier: list[Route],
) -> Route:
    """
    Temporary deterministic selection from the Pareto frontier.

    Routes with known reliability are preferred over routes
    whose reliability is currently unknown.

    Among otherwise comparable routes:

        1. known reliability
        2. higher reliability
        3. lower fee
        4. lower latency
        5. fewer hops
    """

    if not frontier:
        raise ValueError(
            "Cannot choose a route from an empty Pareto frontier."
        )

    return sorted(
        frontier,
        key=lambda route: (
            route.reliability is None,
            -(
                route.reliability
                if route.reliability is not None
                else 0
            ),
            route.fee,
            route.latency_seconds,
            route.hops,
        ),
    )[0]


def explain(
    selected: Route,
    candidates: list[Route],
    frontier: list[Route],
    input_amount: float | None = None,
) -> str:
    """
    Generate a human-readable explanation for the decision.
    """

    if selected.reliability is None:
        reliability_text = (
            "Reliability: unavailable from current provider data."
        )
    else:
        reliability_text = (
            f"Modeled reliability: "
            f"{selected.reliability * 100:.2f}%."
        )

    if input_amount is not None:

        effective_loss = calculate_effective_loss(
            selected,
            input_amount,
        )

        economic_text = (
            f"Estimated output loss: "
            f"{effective_loss:.4f}."
        )

    else:
        economic_text = ""

    return (
        f"Selected route {selected.route_id}. "
        f"Fee: {selected.fee:.2f}. "
        f"Estimated latency: "
        f"{selected.latency_seconds:.0f}s. "
        f"{reliability_text} "
        f"{economic_text} "
        f"Hops: {selected.hops}. "
        f"{len(candidates)} candidate routes were discovered, "
        f"of which {len(frontier)} remained on the Pareto frontier."
    )