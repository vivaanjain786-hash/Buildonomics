from app.models import Route

from app.optimizer import (
    dominates,
    pareto_frontier,
    satisfies_policy,
    calculate_effective_loss,
)

def create_route(
    route_id,
    fee,
    latency,
    reliability,
    liquidity,
    hops,
):
    return Route(
        route_id=route_id,
        provider="TestProvider",
        chains=["ethereum", "base"],
        fee=fee,
        latency_seconds=latency,
        reliability=reliability,
        liquidity=liquidity,
        hops=hops,
    )


def test_dominance():
    """
    Route A is cheaper, faster, more reliable,
    has more liquidity and fewer hops.

    Therefore A must dominate B.
    """

    route_a = create_route(
        "route-a",
        fee=1.0,
        latency=10,
        reliability=0.99,
        liquidity=1000,
        hops=1,
    )

    route_b = create_route(
        "route-b",
        fee=2.0,
        latency=20,
        reliability=0.98,
        liquidity=900,
        hops=2,
    )

    assert dominates(
        route_a,
        route_b,
    )

    assert not dominates(
        route_b,
        route_a,
    )


def test_pareto_frontier():
    """
    Route A is cheap.
    Route B is faster and more reliable.
    Route C is worse than A and should therefore
    be removed from the frontier.
    """

    route_a = create_route(
        "route-a",
        fee=1.0,
        latency=30,
        reliability=0.99,
        liquidity=1000,
        hops=1,
    )

    route_b = create_route(
        "route-b",
        fee=2.0,
        latency=10,
        reliability=0.995,
        liquidity=1200,
        hops=1,
    )

    route_c = create_route(
        "route-c",
        fee=4.0,
        latency=40,
        reliability=0.97,
        liquidity=500,
        hops=2,
    )

    frontier = pareto_frontier(
        [
            route_a,
            route_b,
            route_c,
        ]
    )

    frontier_ids = {
        route.route_id
        for route in frontier
    }

    assert frontier_ids == {
        "route-a",
        "route-b",
    }


def test_policy_rejects_expensive_route():
    """
    A route above the application's fee constraint
    must be rejected.
    """

    route = create_route(
        "expensive",
        fee=15.0,
        latency=20,
        reliability=0.99,
        liquidity=1000,
        hops=1,
    )

    from app.models import Policy

    policy = Policy(
        max_fee=10,
    )

    assert not satisfies_policy(
        route,
        policy,
    )


def test_policy_accepts_valid_route():
    """
    A route satisfying all constraints should pass.
    """

    route = create_route(
        "valid",
        fee=5.0,
        latency=30,
        reliability=0.995,
        liquidity=2000,
        hops=1,
    )

    from app.models import Policy

    policy = Policy(
        max_fee=10,
        max_latency_seconds=60,
        min_reliability=0.99,
        max_hops=2,
    )

    assert satisfies_policy(
        route,
        policy,
    )
    from dataclasses import replace

def test_effective_loss():
    """
    Same-asset transfer should correctly calculate
    the difference between input and estimated output.
    """

    route = Route(
        route_id="route-loss",
        provider="TestProvider",
        chains=["ethereum", "base"],
        fee=0.20,
        latency_seconds=10,
        reliability=0.99,
        liquidity=1000,
        hops=1,
        estimated_output=9.97,
    )

    loss = calculate_effective_loss(
        route,
        input_amount=10.0,
    )

    assert abs(loss - 0.03) < 1e-9