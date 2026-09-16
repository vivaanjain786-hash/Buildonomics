import httpx

from ..models import Route, RouteIntent


LI_FI_BASE_URL = "https://li.quest"


CHAIN_IDS = {
    "ethereum": 1,
    "arbitrum": 42161,
    "optimism": 10,
    "base": 8453,
}


# Native USDC mainnet contract addresses.
USDC_ADDRESSES = {
    "ethereum": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "arbitrum": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    "optimism": "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    "base": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
}


TOKEN_DECIMALS = {
    "USDC": 6,
}


def get_chain_id(chain: str) -> int:
    """
    Convert RouteX's internal chain name into
    the provider's chain ID.
    """

    chain = chain.lower()

    if chain not in CHAIN_IDS:
        raise ValueError(
            f"Unsupported chain: {chain}"
        )

    return CHAIN_IDS[chain]


def get_token_address(
    asset: str,
    chain: str,
) -> str:
    """
    Resolve an asset symbol into its token contract address.
    """

    asset = asset.upper()
    chain = chain.lower()

    if asset != "USDC":
        raise ValueError(
            f"Unsupported asset: {asset}"
        )

    if chain not in USDC_ADDRESSES:
        raise ValueError(
            f"USDC is not configured for chain: {chain}"
        )

    return USDC_ADDRESSES[chain]


def amount_to_base_units(
    amount: float,
    asset: str,
) -> str:
    """
    Convert a human-readable token amount into
    ERC-20 base units.

    Example:

        1000 USDC
        ->
        1000000000
    """

    asset = asset.upper()

    if asset not in TOKEN_DECIMALS:
        raise ValueError(
            f"Unknown token decimals for asset: {asset}"
        )

    decimals = TOKEN_DECIMALS[asset]

    base_units = int(
        amount * (10 ** decimals)
    )

    return str(base_units)


# ============================================================
# BASIC LI.FI QUOTE
# ============================================================

def build_quote_params(
    intent: RouteIntent,
) -> dict:
    """
    Convert a RouteX RouteIntent into LI.FI
    basic quote API parameters.
    """

    if not intent.from_address:
        raise ValueError(
            "from_address is required for a live LI.FI quote."
        )

    from_chain = get_chain_id(
        intent.source_chain
    )

    to_chain = get_chain_id(
        intent.destination_chain
    )

    from_token = get_token_address(
        intent.asset,
        intent.source_chain,
    )

    to_token = get_token_address(
        intent.asset,
        intent.destination_chain,
    )

    from_amount = amount_to_base_units(
        intent.amount,
        intent.asset,
    )

    params = {
        "fromChain": from_chain,
        "toChain": to_chain,
        "fromToken": from_token,
        "toToken": to_token,
        "fromAddress": intent.from_address,
        "fromAmount": from_amount,
    }

    if intent.to_address:
        params["toAddress"] = intent.to_address

    return params


def quote_lifi(
    intent: RouteIntent,
) -> dict:
    """
    Request a single live quote from LI.FI.
    """

    params = build_quote_params(
        intent
    )

    response = httpx.get(
        f"{LI_FI_BASE_URL}/v1/quote",
        params=params,
        timeout=30.0,
    )

    response.raise_for_status()

    return response.json()


def _calculate_fee_cost_usd(
    estimate: dict,
) -> float:
    """
    Sum LI.FI-reported provider/protocol/relayer fees.
    """

    fee_cost_usd = 0.0

    for fee in estimate.get(
        "feeCosts",
        [],
    ):

        amount_usd = fee.get(
            "amountUSD"
        )

        if amount_usd is not None:
            fee_cost_usd += float(
                amount_usd
            )

    return fee_cost_usd


def _calculate_gas_cost_usd(
    estimate: dict,
) -> float:
    """
    Sum LI.FI-reported blockchain gas costs.
    """

    gas_cost_usd = 0.0

    for gas_cost in estimate.get(
        "gasCosts",
        [],
    ):

        amount_usd = gas_cost.get(
            "amountUSD"
        )

        if amount_usd is not None:
            gas_cost_usd += float(
                amount_usd
            )

    return gas_cost_usd





def normalize_quote(
    quote: dict,
    intent: RouteIntent,
) -> Route:
    """
    Convert a single LI.FI quote into
    RouteX's normalized Route model.

    Cost model:

        fee_cost_usd
            +
        gas_cost_usd
            =
        total_cost_usd

    Route.fee is set to total_cost_usd so the
    existing RouteX optimizer can minimize total
    execution cost.
    """

    estimate = quote.get(
        "estimate",
        {},
    )

    tool_details = quote.get(
        "toolDetails",
        {},
    )

    tool = (
        tool_details.get("name")
        or quote.get("tool")
    )

    route_id = quote.get(
        "id"
    ) or "lifi-quote"

    # --------------------------------------------------------
    # Estimated output
    # --------------------------------------------------------

    to_amount_raw = estimate.get(
        "toAmount"
    )

    estimated_output = None

    if to_amount_raw is not None:

        decimals = TOKEN_DECIMALS.get(
            intent.asset.upper(),
            18,
        )

        estimated_output = (
            int(to_amount_raw)
            / (10 ** decimals)
        )

    # --------------------------------------------------------
    # Execution duration
    # --------------------------------------------------------

    execution_duration = estimate.get(
        "executionDuration"
    )

    latency_seconds = float(
        execution_duration or 0
    )

    # --------------------------------------------------------
    # Cost calculation
    # --------------------------------------------------------

    fee_cost_usd = _calculate_fee_cost_usd(
        estimate
    )

    gas_cost_usd = _calculate_gas_cost_usd(
        estimate
    )

    total_cost_usd = (
        fee_cost_usd
        + gas_cost_usd
    )

    return Route(
        route_id=f"lifi-{route_id}",
        provider="LI.FI",

        chains=[
            intent.source_chain.lower(),
            intent.destination_chain.lower(),
        ],

        # RouteX optimizer uses this as total cost.
        fee=total_cost_usd,

        latency_seconds=latency_seconds,

        reliability=None,

        liquidity=0,

        hops=1,

        estimated_output=estimated_output,

        fee_cost_usd=fee_cost_usd,

        gas_cost_usd=gas_cost_usd,

        total_cost_usd=total_cost_usd,

        tool=tool,

        execution_type=quote.get(
            "type"
        ),

        raw_quote=quote,
    )


def get_lifi_route(
    intent: RouteIntent,
) -> Route:
    """
    High-level helper for a single LI.FI quote.

        RouteIntent
            ->
        LI.FI quote
            ->
        normalized Route
    """

    quote = quote_lifi(
        intent
    )

    return normalize_quote(
        quote,
        intent,
    )


# ============================================================
# ADVANCED MULTI-ROUTE API
# ============================================================

def build_advanced_routes_payload(
    intent: RouteIntent,
) -> dict:
    """
    Build the request body for LI.FI's
    advanced routes endpoint.
    """

    if not intent.from_address:
        raise ValueError(
            "from_address is required for live LI.FI routes."
        )

    from_chain = get_chain_id(
        intent.source_chain
    )

    to_chain = get_chain_id(
        intent.destination_chain
    )

    from_token = get_token_address(
        intent.asset,
        intent.source_chain,
    )

    to_token = get_token_address(
        intent.asset,
        intent.destination_chain,
    )

    from_amount = amount_to_base_units(
        intent.amount,
        intent.asset,
    )

    payload = {
        "fromChainId": from_chain,
        "toChainId": to_chain,
        "fromTokenAddress": from_token,
        "toTokenAddress": to_token,
        "fromAmount": from_amount,
        "fromAddress": intent.from_address,

        "options": {
            "allowSwitchChain": False,
        },
    }

    if intent.to_address:
        payload["toAddress"] = intent.to_address

    return payload


def advanced_routes_lifi(
    intent: RouteIntent,
) -> dict:
    """
    Request multiple route options from LI.FI.
    """

    payload = build_advanced_routes_payload(
        intent
    )

    response = httpx.post(
        f"{LI_FI_BASE_URL}/v1/advanced/routes",
        json=payload,
        timeout=30.0,
    )

    response.raise_for_status()

    return response.json()
def _calculate_route_fee_cost_usd(route: dict) -> float:
    """
    Calculate non-gas fees from an advanced LI.FI route.
    Prefer route-level feeCosts; otherwise inspect nested steps.
    """
    total = 0.0

    route_fee_costs = route.get("feeCosts") or []

    if route_fee_costs:
        for fee in route_fee_costs:
            amount_usd = fee.get("amountUSD")
            if amount_usd is not None:
                total += float(amount_usd)

        return total

    for step in route.get("steps", []) or []:
        estimate = step.get("estimate") or {}

        for fee in estimate.get("feeCosts", []) or []:
            amount_usd = fee.get("amountUSD")
            if amount_usd is not None:
                total += float(amount_usd)

    return total


def _calculate_route_gas_cost_usd(route: dict) -> float:
    """
    Calculate blockchain gas cost from an advanced LI.FI route.
    Prefer route-level gasCostUSD to avoid double counting.
    """
    route_gas_cost = route.get("gasCostUSD")

    if route_gas_cost is not None:
        return float(route_gas_cost)

    total = 0.0

    for step in route.get("steps", []) or []:
        estimate = step.get("estimate") or {}

        for gas in estimate.get("gasCosts", []) or []:
            amount_usd = gas.get("amountUSD")
            if amount_usd is not None:
                total += float(amount_usd)

    return total

def normalize_advanced_route(
    route: dict,
    intent: RouteIntent,
) -> Route:
    """
    Convert one LI.FI advanced Route into
    RouteX's normalized Route model.
    """

    steps = route.get("steps", [])

    hops = len(steps)

    if hops == 0:
        hops = 1

    # Primary execution tool
    primary_tool = None

    if steps:
        primary_tool = steps[0].get("tool")

    # Estimated output
    to_amount_raw = route.get("toAmount")

    estimated_output = None

    if to_amount_raw is not None:
        decimals = TOKEN_DECIMALS.get(
            intent.asset.upper(),
            18,
        )

        estimated_output = (
            int(to_amount_raw)
            / (10 ** decimals)
        )

    # Cost
    fee_cost_usd = _calculate_route_fee_cost_usd(route)

    gas_cost_usd = _calculate_route_gas_cost_usd(route)

    total_cost_usd = (
        fee_cost_usd
        + gas_cost_usd
    )

    # Execution duration
    latency_seconds = 0.0

    for step in steps:
        estimate = step.get("estimate", {})

        latency_seconds += float(
            estimate.get(
                "executionDuration",
                0,
            ) or 0
        )

    # Route ID
    route_id = route.get(
        "id",
        "unknown",
    )

    return Route(
        route_id=f"lifi-{route_id}",
        provider="LI.FI",

        chains=[
            intent.source_chain.lower(),
            intent.destination_chain.lower(),
        ],

        # Total estimated execution cost
        fee=total_cost_usd,

        latency_seconds=latency_seconds,

        # Historical reliability will be added by RouteX
        reliability=None,

        # Not available reliably yet
        liquidity=0,

        hops=hops,

        estimated_output=estimated_output,

        fee_cost_usd=fee_cost_usd,
        gas_cost_usd=gas_cost_usd,
        total_cost_usd=total_cost_usd,

        tool=primary_tool,

        execution_type="advanced",

        raw_quote=route,
    )


def get_lifi_routes(
    intent: RouteIntent,
) -> list[Route]:
    """
    Get multiple live execution routes from LI.FI
    and normalize them into RouteX Route objects.
    """

    response = advanced_routes_lifi(intent)

    routes = response.get(
        "routes",
        [],
    )

    normalized_routes = []

    for route in routes:
        normalized_route = normalize_advanced_route(
            route,
            intent,
        )

        normalized_routes.append(
            normalized_route
        )

    return normalized_routes