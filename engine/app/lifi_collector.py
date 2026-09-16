import requests
import csv
import time


LIFI_API_URL = "https://li.quest/v2/analytics/transfers"

CHAIN_PAIRS = [
    (1, 8453),       # Ethereum → Base
    (1, 42161),      # Ethereum → Arbitrum
    (1, 10),         # Ethereum → Optimism
    (8453, 1),       # Base → Ethereum
    (8453, 42161),   # Base → Arbitrum
    (8453, 10),      # Base → Optimism
]

# 150 pages × 10 records × 6 pairs = up to 9,000 records
PAGES_PER_PAIR = 150
RECORDS_PER_PAGE = 10

# Delay between API requests
REQUEST_DELAY = 0.5

CSV_FILE = "lifi_transfers.csv"

CSV_FIELDS = [
    "transaction_id",
    "source_chain",
    "destination_chain",
    "provider",
    "source_token",
    "destination_token",
    "amount_usd",
    "source_gas_used",
    "destination_gas_used",
    "source_gas_cost_usd",
    "destination_gas_cost_usd",
    "latency_seconds",
    "status",
    "substatus",
    "substatus_message",
    "success",
    "timestamp",
]


def get_lifi_transfers(
    from_chain,
    to_chain,
    limit=10,
    next_token=None
):
    params = {
        "limit": limit,
        "fromChain": from_chain,
        "toChain": to_chain,
    }

    if next_token:
        params["next"] = next_token

    max_retries = 6

    for attempt in range(max_retries):

        response = requests.get(
            LIFI_API_URL,
            params=params,
            timeout=30
        )

        if response.status_code == 429:

            wait_time = 5 * (attempt + 1)

            print(
                f"Rate limited (429). "
                f"Waiting {wait_time}s..."
            )

            time.sleep(wait_time)
            continue

        response.raise_for_status()

        return response.json()

    raise RuntimeError(
        "LI.FI API rate limit persisted "
        "after multiple retries."
    )


def parse_lifi_transfer(transfer):

    sending = transfer["sending"]
    receiving = transfer["receiving"]

    sending_timestamp = int(
        sending["timestamp"]
    )

    receiving_timestamp = int(
        receiving["timestamp"]
    )

    latency_seconds = (
        receiving_timestamp
        - sending_timestamp
    )

    return {
        "transaction_id": transfer.get(
            "transactionId"
        ),

        "source_chain": sending.get(
            "chainId"
        ),

        "destination_chain": receiving.get(
            "chainId"
        ),

        "provider": transfer.get(
            "tool"
        ),

        "source_token": sending.get(
            "token", {}
        ).get("symbol"),

        "destination_token": receiving.get(
            "token", {}
        ).get("symbol"),

        "amount_usd": float(
            sending.get(
                "amountUSD",
                0
            )
        ),

        "source_gas_used": int(
            sending.get(
                "gasUsed",
                0
            )
        ),

        "destination_gas_used": int(
            receiving.get(
                "gasUsed",
                0
            )
        ),

        "source_gas_cost_usd": float(
            sending.get(
                "gasAmountUSD",
                0
            )
        ),

        "destination_gas_cost_usd": float(
            receiving.get(
                "gasAmountUSD",
                0
            )
        ),

        "latency_seconds": latency_seconds,

        "status": transfer.get(
            "status"
        ),

        "substatus": transfer.get(
            "substatus"
        ),

        "substatus_message": transfer.get(
            "substatusMessage"
        ),

        "success": (
            transfer.get("status")
            == "DONE"
        ),

        "timestamp": sending_timestamp,
    }


def collect_chain_pair(
    from_chain,
    to_chain
):

    transfers = []
    next_token = None

    for page in range(
        1,
        PAGES_PER_PAIR + 1
    ):

        try:

            data = get_lifi_transfers(
                from_chain=from_chain,
                to_chain=to_chain,
                limit=RECORDS_PER_PAGE,
                next_token=next_token
            )

        except Exception as error:

            print(
                f"ERROR "
                f"{from_chain} → {to_chain} "
                f"page {page}: {error}"
            )

            break

        page_data = data.get(
            "data",
            []
        )

        valid_records = 0

        for transfer in page_data:

            try:

                parsed = parse_lifi_transfer(
                    transfer
                )

                if parsed["transaction_id"]:

                    transfers.append(
                        parsed
                    )

                    valid_records += 1

            except (
                KeyError,
                TypeError,
                ValueError
            ) as error:

                print(
                    f"Skipping invalid "
                    f"transfer: {error}"
                )

        print(
            f"{from_chain} → {to_chain} | "
            f"Page {page}/{PAGES_PER_PAIR} | "
            f"{valid_records} records"
        )

        next_token = data.get(
            "next"
        )

        if not next_token:

            print(
                f"No more pages for "
                f"{from_chain} → {to_chain}"
            )

            break

        time.sleep(
            REQUEST_DELAY
        )

    return transfers


def save_dataset(
    transfers,
    filename=CSV_FILE
):

    # Deduplicate transactions
    unique_transfers = {}

    for transfer in transfers:

        transaction_id = transfer[
            "transaction_id"
        ]

        unique_transfers[
            transaction_id
        ] = transfer

    unique_transfers = list(
        unique_transfers.values()
    )

    with open(
        filename,
        "w",
        newline="",
        encoding="utf-8"
    ) as file:

        writer = csv.DictWriter(
            file,
            fieldnames=CSV_FIELDS
        )

        writer.writeheader()

        writer.writerows(
            unique_transfers
        )

    return len(
        unique_transfers
    )


def main():

    print("=" * 60)
    print(
        "ROUTEX LI.FI DATA COLLECTOR"
    )
    print("=" * 60)

    maximum_records = (
        len(CHAIN_PAIRS)
        * PAGES_PER_PAIR
        * RECORDS_PER_PAGE
    )

    print(
        f"Maximum target: "
        f"{maximum_records:,} records"
    )

    all_transfers = []

    for from_chain, to_chain in CHAIN_PAIRS:

        print()
        print(
            f"Collecting "
            f"{from_chain} → {to_chain}"
        )

        transfers = collect_chain_pair(
            from_chain,
            to_chain
        )

        all_transfers.extend(
            transfers
        )

        print(
            f"Collected from pair: "
            f"{len(transfers)}"
        )

        # SAVE AFTER EVERY PAIR
        # so we don't lose everything
        # if the API rate-limits us.
        total_saved = save_dataset(
            all_transfers
        )

        print(
            f"Total unique records saved: "
            f"{total_saved}"
        )

        # Extra pause between chain pairs
        time.sleep(3)

    final_count = save_dataset(
        all_transfers
    )

    print()
    print("=" * 60)
    print(
        f"FINAL UNIQUE RECORDS: "
        f"{final_count:,}"
    )
    print("=" * 60)

    print(
        f"Saved to: {CSV_FILE}"
    )


if __name__ == "__main__":
    main()