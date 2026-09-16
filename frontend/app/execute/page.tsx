"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ExecutePageContent() {
  const router = useRouter();
  const p = useSearchParams();

  const route = p.get("route") || "RX-01";
  const amount = p.get("amount") || "500";
  const asset = p.get("asset") || "USDC";

  return (
    <main className="simple-product-page">
      <button className="simple-back" onClick={() => router.back()}>
        <ArrowLeft size={14} />
        Back
      </button>

      <div className="routex-eyebrow">Execution control</div>

      <h1>
        Execute <span>with context.</span>
      </h1>

      <p className="simple-copy">
        Review the selected execution plan before handing it to the provider
        execution layer.
      </p>

      <section className="simple-panel">
        <div className="simple-route">
          <strong>{route}</strong>
          <span>
            {amount} {asset}
          </span>
          <span>Ethereum → Base</span>
        </div>

        <div className="simple-checks">
          <div>
            <CheckCircle2 />
            Route evaluated
          </div>

          <div>
            <Clock3 />
            Estimated settlement tracked
          </div>

          <div>
            <ShieldCheck />
            Security assumptions displayed
          </div>

          <div>
            <Zap />
            Provider execution ready
          </div>
        </div>

        <button
          className="simple-primary"
          onClick={() => router.push("/transactions")}
        >
          Simulate execution
          <ArrowRight size={14} />
        </button>
      </section>
    </main>
  );
}

export default function ExecutePage() {
  return (
    <Suspense
      fallback={
        <main
          className="simple-product-page"
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
          }}
        >
          Loading execution interface...
        </main>
      }
    >
      <ExecutePageContent />
    </Suspense>
  );
}