from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class Policy(BaseModel):
    """
    Constraints defined by the user/application.
    """

    max_fee: Optional[float] = None

    max_latency_seconds: Optional[float] = None

    min_reliability: Optional[float] = Field(
        default=None,
        ge=0,
        le=1,
    )

    max_hops: Optional[int] = Field(
        default=None,
        ge=1,
    )


class RouteIntent(BaseModel):
    """
    Represents what the user/application wants to accomplish.

    For real provider quotes, from_address is required by the
    provider adapter. It remains optional here so that the existing
    synthetic/demo route engine continues to work.
    """

    source_chain: str

    destination_chain: str

    asset: str

    amount: float = Field(gt=0)

    from_address: Optional[str] = None

    to_address: Optional[str] = None

    policy: Policy = Field(
        default_factory=Policy
    )


class Route(BaseModel):
    """
    Represents a candidate execution route.

    The original fields are preserved for compatibility with the
    synthetic route graph and optimizer.

    Additional fields support real provider responses.
    """

    route_id: str

    provider: str

    chains: List[str]

    fee: float = Field(
        ge=0,
        description=(
            "Total estimated execution cost in USD, "
            "including provider fees and blockchain gas."
        ),
    )

    latency_seconds: float = Field(
        ge=0,
    )

    reliability: Optional[float] = Field(
        default=None,
        ge=0,
        le=1,
    )

    liquidity: float = Field(
        default=0,
        ge=0,
    )

    hops: int = Field(
        ge=1,
    )

    # ---------------------------------------------------------
    # Real-provider fields
    # ---------------------------------------------------------

    estimated_output: Optional[float] = Field(
        default=None,
        ge=0,
    )

    fee_cost_usd: Optional[float] = Field(
        default=None,
        ge=0,
        description=(
            "Estimated provider, bridge, relayer, "
            "or protocol fees in USD."
        ),
    )

    gas_cost_usd: Optional[float] = Field(
        default=None,
        ge=0,
        description=(
            "Estimated blockchain gas cost in USD."
        ),
    )

    total_cost_usd: Optional[float] = Field(
        default=None,
        ge=0,
        description=(
            "Estimated total execution cost in USD."
        ),
    )

    price_impact: Optional[float] = None

    tool: Optional[str] = None

    execution_type: Optional[str] = None

    raw_quote: Optional[Dict[str, Any]] = None

class RouteObservation(BaseModel):
    """
    A historical observation of a route execution.

    This is the fundamental unit of our future ML dataset.
    """

    route_id: str

    source_chain: str

    destination_chain: str

    provider: str

    asset: str

    amount: float = Field(
        gt=0,
    )

    fee: float = Field(
        ge=0,
    )

    gas_cost: float = Field(
        default=0,
        ge=0,
    )

    latency_seconds: float = Field(
        ge=0,
    )

    liquidity: float = Field(
        ge=0,
    )

    success: bool

    failure_reason: Optional[str] = None

    network_congestion: Optional[float] = Field(
        default=None,
        ge=0,
    )