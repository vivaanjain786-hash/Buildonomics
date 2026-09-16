ROUTEX READABLE TYPOGRAPHY UPDATE

This update changes the website font to Inter and increases the small UI text sizes so the interface is readable while preserving the existing layout, colors, cards and navigation.

REPLACE:
1. app/globals.css -> use the included app/globals.css
2. components/InsightPage.module.css -> use the included file
3. components/OperationsPage.module.css -> use the included file

Do NOT replace RouteXShell.tsx, InsightPage.tsx, OperationsPage.tsx, or any data files.

Then restart the dev server if needed:
npm run dev

Main typography changes:
- Font: Inter (400-800) with Segoe UI/Roboto/Arial fallbacks
- Small labels: roughly 7-8px -> 10-11px
- Body/supporting text: roughly 9-10px -> 12-13px
- Navigation text: 11px -> 13px
- Table/route text: 8-9px -> 11-12px
- Main headings remain visually prominent and are not unnecessarily enlarged
