"use client";

import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { getTransactions } from "@/lib/api";
import type { Transaction } from "@/lib/types";

function formatAmount(tx: Transaction) {
  return `${tx.amount.toLocaleString()} ${tx.asset}`;
}

function relativeTime(value: string) {
  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) return "—";

  const minutes = Math.max(
    0,
    Math.round((Date.now() - timestamp) / 60000),
  );

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.round(hours / 24)}d ago`;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getTransactions()
      .then((result) => {
        if (!active) return;
        setTransactions(result);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load transactions.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="simple-product-page">
      <Link className="simple-back" href="/">
        <ArrowLeft size={14} />
        Command Center
      </Link>

      <div className="routex-eyebrow">Execution history</div>

      <h1>
        Transactions <span>that actually happened.</span>
      </h1>

      <p className="simple-copy">
        Track route decisions, settlement state and execution outcomes.
      </p>

      {loading && (
        <section className="simple-panel">Loading transaction history...</section>
      )}

      {error && (
        <section className="simple-panel">
          <strong>Unable to load transactions.</strong>
          <p className="simple-copy">{error}</p>
        </section>
      )}

      {!loading && !error && (
        <section className="simple-panel simple-list">
          {transactions.length === 0 ? (
            <div>
              <Activity />
              <span>No transactions returned</span>
              <small>The backend has not returned execution history yet.</small>
            </div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id}>
                {tx.status === "completed" ? (
                  <CheckCircle2 />
                ) : tx.status === "pending" ? (
                  <Clock3 />
                ) : (
                  <XCircle />
                )}

                <span>
                  {formatAmount(tx)} · {tx.source_chain} →{" "}
                  {tx.destination_chain}
                </span>

                <small>
                  {tx.status} · {tx.id} · {relativeTime(tx.created_at)}
                </small>
              </div>
            ))
          )}
        </section>
      )}
    </main>
  );
}
