from .database import get_connection
from .models import RouteObservation


def record_observation(
    observation: RouteObservation,
):
    """
    Store a route execution observation.
    """

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO route_observations (
            route_id,
            source_chain,
            destination_chain,
            provider,
            asset,
            amount,
            fee,
            gas_cost,
            latency_seconds,
            liquidity,
            success,
            failure_reason,
            network_congestion
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            observation.route_id,
            observation.source_chain,
            observation.destination_chain,
            observation.provider,
            observation.asset,
            observation.amount,
            observation.fee,
            observation.gas_cost,
            observation.latency_seconds,
            observation.liquidity,
            int(observation.success),
            observation.failure_reason,
            observation.network_congestion,
        ),
    )

    observation_id = cursor.lastrowid

    connection.commit()

    connection.close()

    return observation_id


def get_observations(
    route_id: str | None = None,
):
    """
    Retrieve stored telemetry observations.

    If route_id is provided, only observations
    belonging to that route are returned.
    """

    connection = get_connection()

    cursor = connection.cursor()

    if route_id:

        cursor.execute(
            """
            SELECT *
            FROM route_observations
            WHERE route_id = ?
            ORDER BY timestamp DESC
            """,
            (route_id,),
        )

    else:

        cursor.execute(
            """
            SELECT *
            FROM route_observations
            ORDER BY timestamp DESC
            """
        )

    rows = cursor.fetchall()

    connection.close()

    return [
        dict(row)
        for row in rows
    ]


def get_route_statistics(
    route_id: str,
):
    """
    Calculate historical statistics for a route.
    """

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            COUNT(*) AS total_executions,

            SUM(
                CASE
                    WHEN success = 1
                    THEN 1
                    ELSE 0
                END
            ) AS successful_executions,

            AVG(fee) AS average_fee,

            AVG(gas_cost) AS average_gas_cost,

            AVG(latency_seconds)
                AS average_latency,

            AVG(liquidity)
                AS average_liquidity

        FROM route_observations

        WHERE route_id = ?
        """,
        (route_id,),
    )

    row = cursor.fetchone()

    connection.close()

    if row is None:
        return None

    total = row["total_executions"]

    successful = (
        row["successful_executions"]
        or 0
    )

    reliability = (
        successful / total
        if total > 0
        else None
    )

    return {
        "route_id": route_id,
        "total_executions": total,
        "successful_executions": successful,
        "historical_reliability": reliability,
        "average_fee": row["average_fee"],
        "average_gas_cost": row["average_gas_cost"],
        "average_latency_seconds": row[
            "average_latency"
        ],
        "average_liquidity": row[
            "average_liquidity"
        ],
    }