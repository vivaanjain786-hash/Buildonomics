"use client";

import { ArrowLeft, BarChart3, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getPortfolio } from "@/lib/api";
import type { PortfolioResponse } from "@/lib/types";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function PortfolioPage() {
  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getPortfolio()
      .then((result) => {
        if (!active) return;
        setData(result);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load portfolio.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const chainCount = useMemo(
    () => new Set(data?.assets.map((asset) => asset.chain)).size,
    [data],
  );

  return (
    <main className="simple-product-page">
      <Link className="simple-back" href="/">
        <ArrowLeft size={14} />
        Command Center
      </Link>

      <div className="routex-eyebrow">Portfolio intelligence</div>

      <h1>
        Portfolio <span>across chains.</span>
      </h1>

      <p className="simple-copy">
        A normalized view of tracked execution value and chain distribution.
      </p>

      {loading && (
        <section className="simple-panel">
          Loading portfolio data...
        </section>
      )}

      {error && (
        <section className="simple-panel">
          <strong>Unable to load portfolio.</strong>
          <p className="simple-copy">{error}</p>
        </section>
      )}

      {!loading && !error && data && (
        <>
          <section className="simple-kpi-grid">
            <div className="simple-kpi">
              <Wallet />
              <small>Tracked value</small>
              <strong>{money(data.total_value_usd)}</strong>
              {data.change_24h !== undefined && (
                <span>
                  {data.change_24h >= 0 ? "+" : ""}
                  {data.change_24h}% / 24h
                </span>
              )}
            </div>

            <div className="simple-kpi">
              <BarChart3 />
              <small>Chains</small>
              <strong>{chainCount} active</strong>
            </div>
          </section>

          <section className="simple-panel simple-list">
            {data.assets.map((asset) => (
              <div key={`${asset.asset}-${asset.chain}`}>
                <Wallet />
                <span>
                  {asset.asset} · {asset.chain}
                </span>
                <small>
                  {asset.balance} · {money(asset.value_usd)}
                </small>
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
