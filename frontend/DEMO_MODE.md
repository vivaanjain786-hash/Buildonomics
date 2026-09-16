# RouteX demo mode

The frontend now has one centralized demo switch.

## Turn demo data ON

Create or edit `frontend/.env.local`:

```env
NEXT_PUBLIC_DEMO_MODE=true
```

Restart `npm run dev` after changing the variable.

## Turn demo data OFF

Delete the `NEXT_PUBLIC_DEMO_MODE=true` line, or change it to:

```env
NEXT_PUBLIC_DEMO_MODE=false
```

The frontend then uses the real backend API configured by `NEXT_PUBLIC_API_URL`.

## Architecture

```text
UI pages/components
        ↓
frontend/lib/api.ts
        ↓
NEXT_PUBLIC_DEMO_MODE?
     ↙       ↘
 demo.ts     real backend
```

The demo values live only in `frontend/lib/demo.ts`.

The pages do not contain separate fake-data branches. This keeps the UI integration-ready while making presentation/demo mode a one-line switch.
