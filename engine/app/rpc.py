import time
from datetime import datetime, timezone

import httpx


NETWORKS = {
    "ethereum": {
    "chain_id": 1,
    "rpc_url": "https://ethereum-rpc.publicnode.com",
    },
    "base": {
        "chain_id": 8453,
        "rpc_url": "https://mainnet.base.org",
    },
    "optimism": {
        "chain_id": 10,
        "rpc_url": "https://mainnet.optimism.io",
    },
        "arbitrum": {
        "chain_id": 42161,
        "rpc_url": "https://arb1.arbitrum.io/rpc",
    },
}


def rpc_call(
    rpc_url: str,
    method: str,
    params: list,
):
    """
    Execute a JSON-RPC request.
    """

    payload = {
        "jsonrpc": "2.0",
        "method": method,
        "params": params,
        "id": 1,
    }

    response = httpx.post(
        rpc_url,
        json=payload,
        timeout=10,
    )

    response.raise_for_status()

    data = response.json()

    if "error" in data:
        raise RuntimeError(
            data["error"]
        )

    return data["result"]


def hex_to_int(value):
    """
    Convert an Ethereum hex quantity to int.
    """

    if value is None:
        return None

    return int(value, 16)


def get_network_snapshot(
    network: str,
) -> dict:
    """
    Collect current network conditions from an EVM RPC.
    """

    if network not in NETWORKS:
        raise ValueError(
            f"Unsupported network: {network}"
        )

    config = NETWORKS[network]

    rpc_url = config["rpc_url"]

    start_time = time.perf_counter()

    chain_id_hex = rpc_call(
        rpc_url,
        "eth_chainId",
        [],
    )

    block_number_hex = rpc_call(
        rpc_url,
        "eth_blockNumber",
        [],
    )

    gas_price_hex = rpc_call(
        rpc_url,
        "eth_gasPrice",
        [],
    )

    block_hex = rpc_call(
        rpc_url,
        "eth_getBlockByNumber",
        ["latest", False],
    )

    rpc_latency_ms = (
        time.perf_counter() - start_time
    ) * 1000

    gas_limit = hex_to_int(
        block_hex.get("gasLimit")
    )

    gas_used = hex_to_int(
        block_hex.get("gasUsed")
    )

    block_utilization = None

    if gas_limit:
        block_utilization = (
            gas_used / gas_limit
        )

    return {
        "network": network,
        "chain_id": hex_to_int(chain_id_hex),
        "block_number": hex_to_int(
            block_number_hex
        ),
        "block_timestamp": datetime.fromtimestamp(
            hex_to_int(
                block_hex["timestamp"]
            ),
            tz=timezone.utc,
        ).isoformat(),
        "gas_price_wei": hex_to_int(
            gas_price_hex
        ),
        "base_fee_per_gas_wei": hex_to_int(
            block_hex.get("baseFeePerGas")
        ),
        "gas_used": gas_used,
        "gas_limit": gas_limit,
        "block_utilization": block_utilization,
        "rpc_latency_ms": rpc_latency_ms,
        "collected_at": datetime.now(
            timezone.utc
        ).isoformat(),
    }