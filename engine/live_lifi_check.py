from app.models import RouteIntent
from app.providers.lifi import get_lifi_routes


intent = RouteIntent(
    source_chain="ethereum",
    destination_chain="base",
    asset="USDC",
    amount=10,
    from_address="0x0000000000000000000000000000000000000001",
)

routes = get_lifi_routes(intent)

print("\n===== ROUTEX LIVE ROUTES =====")
print(f"Number of routes: {len(routes)}")

for index, route in enumerate(routes, start=1):

    print(f"\n--- Route {index} ---")

    print("Route ID:", route.route_id)
    print("Provider:", route.provider)
    print("Tool:", route.tool)
    print("Chains:", route.chains)
    print("Hops:", route.hops)
    print("Estimated output:", route.estimated_output)
    print("Gas cost USD:", route.gas_cost_usd)
    print("Latency:", route.latency_seconds)