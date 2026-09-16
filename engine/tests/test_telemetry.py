import pytest

from app.database import (
    get_connection,
    initialize_database,
)

from app.models import RouteObservation

from app.telemetry import (
    record_observation,
    get_observations,
    get_route_statistics,
)


@pytest.fixture(autouse=True)
def clean_test_database():
    """
    Clear telemetry data before and after every test.

    This prevents previous test runs from affecting
    the current test results.
    """

    initialize_database()

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        DELETE FROM route_observations
        """
    )

    connection.commit()
    connection.close()

    yield

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        DELETE FROM route_observations
        """
    )

    connection.commit()
    connection.close()


def test_telemetry_database_initializes():

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
        AND name = 'route_observations'
        """
    )

    result = cursor.fetchone()

    connection.close()

    assert result is not None


def test_record_observation():

    observation = RouteObservation(
        route_id="test-route-1",
        source_chain="ethereum",
        destination_chain="base",
        provider="TestProvider",
        asset="USDC",
        amount=1000,
        fee=2.5,
        gas_cost=1.2,
        latency_seconds=35,
        liquidity=1_000_000,
        success=True,
        network_congestion=0.35,
    )

    observation_id = record_observation(
        observation
    )

    assert observation_id is not None

    observations = get_observations(
        "test-route-1"
    )

    assert len(observations) == 1


def test_route_statistics():

    route_id = "statistics-test-route"

    successful = RouteObservation(
        route_id=route_id,
        source_chain="ethereum",
        destination_chain="base",
        provider="TestProvider",
        asset="USDC",
        amount=1000,
        fee=2,
        gas_cost=1,
        latency_seconds=30,
        liquidity=1_000_000,
        success=True,
    )

    failed = RouteObservation(
        route_id=route_id,
        source_chain="ethereum",
        destination_chain="base",
        provider="TestProvider",
        asset="USDC",
        amount=1000,
        fee=2,
        gas_cost=1,
        latency_seconds=50,
        liquidity=900_000,
        success=False,
        failure_reason="timeout",
    )

    record_observation(successful)
    record_observation(failed)

    statistics = get_route_statistics(
        route_id
    )

    assert statistics is not None

    assert statistics[
        "total_executions"
    ] == 2

    assert statistics[
        "successful_executions"
    ] == 1

    assert statistics[
        "historical_reliability"
    ] == 0.5


def test_get_observations():

    route_id = "observation-list-test"

    observation = RouteObservation(
        route_id=route_id,
        source_chain="ethereum",
        destination_chain="base",
        provider="TestProvider",
        asset="USDC",
        amount=500,
        fee=1.5,
        gas_cost=0.8,
        latency_seconds=25,
        liquidity=750_000,
        success=True,
    )

    record_observation(observation)

    observations = get_observations(
        route_id
    )

    assert len(observations) == 1

    assert observations[0][
        "route_id"
    ] == route_id

    assert observations[0][
        "success"
    ] == 1