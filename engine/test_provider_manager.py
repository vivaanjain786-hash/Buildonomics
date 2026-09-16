from app.models import RouteIntent
from app.providers.manager import get_live_routes


intent = RouteIntent(
    source_chain="ethereum",
    destination_chain="base",
    asset="USDC",
    amount=10,
    from_address="0x0000000000000000000000000000000000000001",
)


routes = get_live_routes(intent)


print("\n===== PROVIDER MANAGER =====")
print("Routes received:", len(routes))

for route in routes:
    print(
        route.tool,
        "|",
        route.estimated_output,
        "|",
        route.gas_cost_usd,
        "|",
        route.latency_seconds,
    )