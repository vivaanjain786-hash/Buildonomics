import sqlite3
from pathlib import Path


DATABASE_PATH = (
    Path(__file__).resolve().parent.parent
    / "routex.db"
)


def get_connection():
    """
    Create a connection to the RouteX SQLite database.
    """

    connection = sqlite3.connect(
        DATABASE_PATH
    )

    connection.row_factory = sqlite3.Row

    return connection


def initialize_database():
    """
    Create RouteX telemetry tables if they do not exist.
    """

    connection = get_connection()

    cursor = connection.cursor()

    # -----------------------------------------------------
    # Route execution observations
    # -----------------------------------------------------

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS route_observations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            route_id TEXT NOT NULL,

            source_chain TEXT NOT NULL,

            destination_chain TEXT NOT NULL,

            provider TEXT NOT NULL,

            asset TEXT NOT NULL,

            amount REAL NOT NULL,

            fee REAL NOT NULL,

            gas_cost REAL NOT NULL,

            latency_seconds REAL NOT NULL,

            liquidity REAL NOT NULL,

            success INTEGER NOT NULL,

            failure_reason TEXT,

            network_congestion REAL,

            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    # -----------------------------------------------------
    # Network snapshots
    # -----------------------------------------------------

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS network_snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            network TEXT NOT NULL,

            chain_id INTEGER NOT NULL,

            block_number INTEGER NOT NULL,

            block_timestamp DATETIME NOT NULL,

            gas_price_wei INTEGER,

            base_fee_per_gas_wei INTEGER,

            gas_used INTEGER,

            gas_limit INTEGER,

            block_utilization REAL,

            rpc_latency_ms REAL,

            collected_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    cursor.execute(
        """
        CREATE UNIQUE INDEX IF NOT EXISTS
        idx_network_snapshots_network_block
        ON network_snapshots (
            network,
            block_number
        )
        """
    )
    

    connection.commit()

    connection.close()