"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const AUTH_KEY = "routex-authenticated";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const authenticated = window.localStorage.getItem(AUTH_KEY) === "true";

    if (pathname !== "/login" && !authenticated) {
      router.replace("/login");
      return;
    }

    if (pathname === "/login" && authenticated) {
      router.replace("/");
      return;
    }

    setReady(true);
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="auth-loading" aria-label="Loading RouteX">
        <div className="auth-loading-mark">R</div>
      </div>
    );
  }

  return <>{children}</>;
}
