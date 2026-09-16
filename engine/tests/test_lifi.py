from app.models import RouteIntent
from app.providers.lifi import normalize_advanced_route

from app.providers.lifi import (
    amount_to_base_units,
    build_quote_params,
    get_chain_id,
    get_token_address,
)


def test_chain_ids():
    assert get_chain_id("ethereum") == 1
    assert get_chain_id("base") == 8453
    assert get_chain_id("arbitrum") == 42161
    assert get_chain_id("optimism") == 10


def test_usdc_addresses_exist():
    assert get_token_address(
        "USDC",
        "ethereum",
    ).startswith("0x")

    assert get_token_address(
        "USDC",
        "base",
    ).startswith("0x")


def test_amount_conversion():
    assert amount_to_base_units(
        1000,
        "USDC",
    ) == "1000000000"


def test_build_quote_params():
    intent = RouteIntent(
        source_chain="ethereum",
        destination_chain="base",
        asset="USDC",
        amount=1000,
        from_address="0x0000000000000000000000000000000000000001",
    )

    params = build_quote_params(intent)

    assert params["fromChain"] == 1
    assert params["toChain"] == 8453
    assert params["fromAmount"] == "1000000000"
    assert params["fromAddress"] == (
        "0x0000000000000000000000000000000000000001"
    )
def test_normalize_advanced_route():
    intent = RouteIntent(
        source_chain="ethereum",
        destination_chain="base",
        asset="USDC",
        amount=10,
        from_address="0x0000000000000000000000000000000000000001",
    )

    raw_route = {
        "id": "test-route-123",
        "toAmount": "9970700",
        "gasCostUSD": "0.1989",
        "steps": [
            {
                "tool": "across",
                "estimate": {
                    "executionDuration": 2,
                },
            }
        ],
    }

    route = normalize_advanced_route(
        raw_route,
        intent,
    )

    assert route.route_id == "lifi-test-route-123"
    assert route.provider == "LI.FI"
    assert route.tool == "across"
    assert route.chains == ["ethereum", "base"]
    assert route.hops == 1
    assert route.estimated_output == 9.9707
    assert route.gas_cost_usd == 0.1989
    assert route.latency_seconds == 2
    assert route.reliability is None


def test_normalize_multi_step_route():
    intent = RouteIntent(
        source_chain="ethereum",
        destination_chain="base",
        asset="USDC",
        amount=10,
        from_address="0x0000000000000000000000000000000000000001",
    )

    raw_route = {
        "id": "multi-step-test",
        "toAmount": "9900000",
        "gasCostUSD": "0.50",
        "steps": [
            {
                "tool": "across",
                "estimate": {
                    "executionDuration": 5,
                },
            },
            {
                "tool": "uniswap",
                "estimate": {
                    "executionDuration": 8,
                },
            },
        ],
    }
def test_normalize_advanced_route():
    intent = RouteIntent(
        source_chain="ethereum",
        destination_chain="base",
        asset="USDC",
        amount=10,
        from_address="0x0000000000000000000000000000000000000001",
    )

    raw_route = {
        "id": "test-route-123",
        "toAmount": "9970700",
        "gasCostUSD": "0.1989",
        "steps": [
            {
                "tool": "across",
                "estimate": {
                    "executionDuration": 2,
                },
            }
        ],
    }

    route = normalize_advanced_route(
        raw_route,
        intent,
    )

    assert route.route_id == "lifi-test-route-123"
    assert route.provider == "LI.FI"
    assert route.tool == "across"
    assert route.chains == ["ethereum", "base"]
    assert route.hops == 1
    assert route.estimated_output == 9.9707
    assert route.gas_cost_usd == 0.1989
    assert route.latency_seconds == 2
    assert route.reliability is None


def test_normalize_multi_step_route():
    intent = RouteIntent(
        source_chain="ethereum",
        destination_chain="base",
        asset="USDC",
        amount=10,
        from_address="0x0000000000000000000000000000000000000001",
    )

    raw_route = {
        "id": "multi-step-test",
        "toAmount": "9900000",
        "gasCostUSD": "0.50",
        "steps": [
            {
                "tool": "across",
                "estimate": {
                    "executionDuration": 5,
                },
            },
            {
                "tool": "uniswap",
                "estimate": {
                    "executionDuration": 8,
                },
            },
        ],
    }
    route = normalize_advanced_route(
        raw_route,
        intent,
    )

    assert route.provider == "LI.FI"
    assert route.tool == "across"
    assert route.hops == 2
    assert route.latency_seconds == 13
    assert route.estimated_output == 9.9