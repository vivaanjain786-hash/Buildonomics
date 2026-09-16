from .network_telemetry import collect_and_save_network


SUPPORTED_NETWORKS = [
    "ethereum",
    "base",
    "arbitrum",
    "optimism",
]


def collect_all_networks() -> dict:
    """
    Collect and store a snapshot for every supported network.

    If one network fails, collection continues for
    the remaining networks.
    """

    results = {}
    errors = {}

    for network in SUPPORTED_NETWORKS:

        try:
            result = collect_and_save_network(
                network
            )

            results[network] = result

        except Exception as error:

            errors[network] = str(error)

    return {
        "successful": results,
        "failed": errors,
    }