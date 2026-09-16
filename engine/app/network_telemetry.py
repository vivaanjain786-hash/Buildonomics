from .database import get_connection
from .rpc import get_network_snapshot


def save_network_snapshot(
    snapshot: dict,
) -> int:
    """
    Store a network snapshot in SQLite.

    Duplicate observations for the same network and
    block number are ignored.
    """

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT OR IGNORE INTO network_snapshots (
            network,
            chain_id,
            block_number,
            block_timestamp,
            gas_price_wei,
            base_fee_per_gas_wei,
            gas_used,
            gas_limit,
            block_utilization,
            rpc_latency_ms,
            collected_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            snapshot["network"],
            snapshot["chain_id"],
            snapshot["block_number"],
            snapshot["block_timestamp"],
            snapshot["gas_price_wei"],
            snapshot["base_fee_per_gas_wei"],
            snapshot["gas_used"],
            snapshot["gas_limit"],
            snapshot["block_utilization"],
            snapshot["rpc_latency_ms"],
            snapshot["collected_at"],
        ),
    )

    connection.commit()

    cursor.execute(
        """
        SELECT id
        FROM network_snapshots
        WHERE network = ?
        AND block_number = ?
        """,
        (
            snapshot["network"],
            snapshot["block_number"],
        ),
    )

    row = cursor.fetchone()

    connection.close()

    return row["id"]

    snapshot_id = cursor.lastrowid

    connection.commit()
    connection.close()

    return snapshot_id


def collect_and_save_network(
    network: str,
) -> dict:
    """
    Collect a live RPC snapshot and store it.
    """

    snapshot = get_network_snapshot(
        network
    )

    snapshot_id = save_network_snapshot(
        snapshot
    )

    return {
        "snapshot_id": snapshot_id,
        "snapshot": snapshot,
    }


def get_network_snapshots(
    network: str | None = None,
) -> list[dict]:
    """
    Retrieve stored network snapshots.

    If network is provided, only snapshots
    for that network are returned.
    """

    connection = get_connection()

    cursor = connection.cursor()

    if network:

        cursor.execute(
            """
            SELECT *
            FROM network_snapshots
            WHERE network = ?
            ORDER BY id DESC
            """,
            (network,),
        )

    else:

        cursor.execute(
            """
            SELECT *
            FROM network_snapshots
            ORDER BY id DESC
            """
        )

    rows = cursor.fetchall()

    connection.close()

    return [
        dict(row)
        for row in rows
    ]