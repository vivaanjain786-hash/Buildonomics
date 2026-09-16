from ..models import Route, RouteIntent
from .lifi import get_lifi_routes


def get_live_routes(intent: RouteIntent) -> list[Route]:
    """
    Get live execution routes from all configured providers.

    Currently:
        LI.FI
    """

    routes = []

    try:
        lifi_routes = get_lifi_routes(intent)
        routes.extend(lifi_routes)
    except Exception as error:
        print(f"LI.FI provider error: {error}")

    return routes