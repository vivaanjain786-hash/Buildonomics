"use client";

import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Check,
  Command,
  Eye,
  EyeOff,
  LockKeyhole,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Zap,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const AUTH_KEY = "routex-authenticated";

type Theme = "light" | "dark";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState<Theme>("light");
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem("routex-theme") as Theme | null;
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  function selectTheme(nextTheme: Theme) {
    setTheme(nextTheme);
    window.localStorage.setItem("routex-theme", nextTheme);
  }

  function authenticate() {
    window.localStorage.setItem(AUTH_KEY, "true");
    if (remember) {
      window.localStorage.setItem("routex-remember", "true");
    } else {
      window.localStorage.removeItem("routex-remember");
    }
    router.replace("/");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Enter your email and password to continue.");
      return;
    }
    authenticate();
  }

  function continueDemo() {
    setError("");
    authenticate();
  }

  return (
    <main className="login-page">
      <div className="login-orb login-orb-one" />
      <div className="login-orb login-orb-two" />

      <header className="login-header">
        <div className="login-brand">
          <div className="login-brand-mark"><Command size={17} /></div>
          <div>
            <strong>RouteX</strong>
            <span>Cross-Chain Execution Intelligence</span>
          </div>
        </div>

        <div className="login-header-actions">
          <div className="login-system-status">
            <span className="login-status-dot" /> Workspace ready
          </div>
          <div className="login-theme-toggle" aria-label="Theme">
            <button type="button" className={theme === "light" ? "active" : ""} onClick={() => selectTheme("light")} aria-label="Light mode">
              <Sun size={14} />
            </button>
            <button type="button" className={theme === "dark" ? "active" : ""} onClick={() => selectTheme("dark")} aria-label="Dark mode">
              <Moon size={14} />
            </button>
          </div>
        </div>
      </header>

      <section className="login-layout">
        <div className="login-story">
          <div className="login-eyebrow">
            <span className="eyebrow-icon"><Sparkles size={13} /></span>
            Execution Intelligence
            <span className="eyebrow-live"><span /> Live workspace</span>
          </div>

          <h1>Move assets across chains without the guesswork.</h1>
          <p>
            Discover routes, understand tradeoffs, execute with confidence, and keep every transaction observable from one workspace — across networks and providers.
          </p>

          <div className="login-route-preview" aria-hidden="true">
            <div className="preview-label"><Activity size={12} /> EXECUTION GRAPH</div>
            <div className="preview-route">
              <span className="preview-node primary">SOURCE</span>
              <span className="preview-line" />
              <span className="preview-node">ROUTER</span>
              <span className="preview-line" />
              <span className="preview-node">DESTINATION</span>
            </div>
            <div className="preview-meta">
              <span>Cost-aware</span><span>Route-aware</span><span>Explainable</span>
            </div>
          </div>

          <div className="login-features">
            <div>
              <span><Zap size={14} /></span>
              <div><strong>Intelligent routing</strong><small>Compare cost, time, liquidity and route complexity.</small></div>
            </div>
            <div>
              <span><ShieldCheck size={14} /></span>
              <div><strong>Security before signing</strong><small>See approvals, destination and trust assumptions clearly.</small></div>
            </div>
            <div>
              <span><Check size={14} /></span>
              <div><strong>Explainable execution</strong><small>Understand what RouteX is recommending and why.</small></div>
            </div>
          </div>
        </div>

        <div className="login-card">
          <div className="login-card-head">
            <span className="login-card-kicker">Welcome back</span>
            <h2>Sign in to RouteX</h2>
            <p>Access your execution workspace and pick up where you left off.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <label>
              <span>Email address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => { setEmail(event.target.value); setError(""); }}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>

            <label>
              <span>Password</span>
              <div className="login-password">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => { setPassword(event.target.value); setError(""); }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <div className="login-form-options">
              <label className="login-check">
                <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
                <span>Remember this workspace</span>
              </label>
              <button type="button" className="login-forgot" onClick={() => setError("Password recovery will be connected when the authentication service is added.")}>Forgot password?</button>
            </div>

            {error && <p className="login-error" role="alert">{error}</p>}

            <button type="submit" className="login-submit">
              Sign in <ArrowRight size={16} />
            </button>
          </form>

          <div className="login-divider"><span>or</span></div>

          <button type="button" className="login-demo" onClick={continueDemo}>
            Continue with demo workspace
            <ArrowRight size={15} />
          </button>

          <div className="login-trust-row">
            <span><LockKeyhole size={12} /> Local demo session</span>
            <span><ShieldCheck size={12} /> No credentials transmitted</span>
          </div>
          <p className="login-demo-note">For the hackathon demo, authentication is local-only. Connect a real auth provider later without changing the interface.</p>
        </div>
      </section>

      <footer className="login-footer">
        <span>© 2026 RouteX</span>
        <span>Provider-neutral execution intelligence</span>
        <span className="login-footer-link">Explore RouteX <ArrowUpRight size={12} /></span>
      </footer>
    </main>
  );
}
