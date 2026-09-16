"use client";

import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Bell,
  Brain,
  ChevronRight,
  CircleDollarSign,
  Command,
  GitBranch,
  LayoutDashboard,
  Network,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Command Center", icon: LayoutDashboard },
  { label: "Execute", icon: Send },
  { label: "Portfolio", icon: Wallet },
  { label: "Intelligence", icon: Brain },
  { label: "Transactions", icon: Activity },
  { label: "Security", icon: ShieldCheck },
];

const chains = [
  { name: "Ethereum", value: "$4,230", width: "72%" },
  { name: "Arbitrum", value: "$3,180", width: "54%" },
  { name: "Base", value: "$2,940", width: "49%" },
  { name: "Optimism", value: "$1,620", width: "31%" },
];

const activities = [
  { name: "Bridge completed", desc: "500 USDC Â· Ethereum â†’ Base", time: "2m ago", icon: GitBranch },
  { name: "Swap executed", desc: "0.42 ETH â†’ 1,724 USDC", time: "18m ago", icon: ArrowUpRight },
  { name: "Transaction pending", desc: "Contract interaction Â· Ethereum", time: "31m ago", icon: Activity },
  { name: "Route analyzed", desc: "3 candidate paths evaluated", time: "1h ago", icon: BarChart3 },
];

export default function RouteXShell() {
  const [active, setActive] = useState("Command Center");
  const [intent, setIntent] = useState("");

  const execute = () => {
    if (!intent.trim()) {
      setIntent("I need 500 USDC on Base");
    }
  };

  return (
    <div className="routex-app">
      <aside className="routex-sidebar">
        <div className="routex-brand">
          <div className="routex-logo">RX</div>
          <div className="routex-brand-copy">
            <div className="routex-brand-name">RouteX</div>
            <div className="routex-brand-sub">Execution OS</div>
          </div>
        </div>

        <div className="routex-nav-label">Workspace</div>
        <nav className="routex-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={`routex-nav-item ${active === item.label ? "active" : ""}`}
                onClick={() => setActive(item.label)}
              >
                <span className="routex-nav-icon">
                  <Icon size={15} strokeWidth={1.8} />
                </span>
                <span className="routex-nav-text">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="routex-sidebar-spacer" />

        <div className="routex-network-box">
          <div className="routex-network-title">
            <span>Network</span>
            <span>4/4</span>
          </div>
          {["Ethereum", "Base", "Arbitrum", "Optimism"].map((chain) => (
            <div className="routex-network-row" key={chain}>
              <span className="routex-dot" />
              <span>{chain}</span>
            </div>
          ))}
        </div>

        <div className="routex-sidebar-bottom">
          <button className="routex-nav-item">
            <span className="routex-nav-icon"><Command size={15} strokeWidth={1.8} /></span>
            <span className="routex-nav-text">Settings</span>
          </button>
        </div>
      </aside>

      <main className="routex-main">
        <header className="routex-topbar">
          <div className="routex-breadcrumb">
            <span>RouteX</span>
            <ChevronRight size={12} />
            <strong>{active}</strong>
          </div>

          <div className="routex-top-actions">
            <button className="routex-icon-btn" aria-label="Search">
              <Search size={15} strokeWidth={1.8} />
            </button>
            <button className="routex-icon-btn" aria-label="Notifications">
              <Bell size={15} strokeWidth={1.8} />
            </button>
            <button className="routex-wallet">
              <span className="routex-wallet-dot" />
              <span>0x8F...2A41</span>
            </button>
          </div>
        </header>

        <section className="routex-content">
          <div className="routex-heading-row">
            <div>
              <div className="routex-eyebrow">Ethereum execution layer</div>
              <h1 className="routex-title">
                Command Center <span>for Ethereum.</span>
              </h1>
              <p className="routex-heading-copy">
                One control plane for fragmented L1 and L2 execution â€” understand your assets,
                choose routes, execute transactions, and see what actually happened.
              </p>
            </div>
            <div className="routex-live">
              <span className="routex-dot" />
              Live network data
            </div>
          </div>

          <div className="routex-grid">
            <div className="routex-card routex-portfolio">
              <div className="routex-card-label">Total portfolio</div>
              <div className="routex-value">$12,482.00</div>
              <div className="routex-change">+2.4% today</div>

              <div className="routex-chain-list">
                {chains.map((chain) => (
                  <div className="routex-chain" key={chain.name}>
                    <div className="routex-chain-name">
                      <span className="routex-dot" />
                      {chain.name}
                    </div>
                    <div className="routex-chain-value">{chain.value}</div>
                    <div className="routex-bar"><span style={{ width: chain.width }} /></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="routex-card routex-gas">
              <div className="routex-card-label">Ethereum gas</div>
              <div className="routex-gas-value">
                14 <span className="routex-gas-unit">gwei</span>
              </div>
              <div className="routex-mini-meta">+3.8% over the last hour</div>
            </div>

            <div className="routex-card routex-health">
              <div className="routex-card-label">Network health</div>
              <div className="routex-health-list">
                {["Ethereum", "Base", "Arbitrum", "Optimism"].map((chain) => (
                  <div className="routex-health-row" key={chain}>
                    <span>{chain}</span>
                    <span className="routex-health-status">
                      <span className="routex-dot" /> Operational
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="routex-card routex-intent">
              <div className="routex-intent-top">
                <div>
                  <div className="routex-card-label">Intent execution</div>
                  <div className="routex-intent-title">What do you want to do?</div>
                  <div className="routex-intent-sub">
                    Describe the outcome. RouteX handles the infrastructure.
                  </div>
                </div>
                <Sparkles size={18} color="#8f86ee" strokeWidth={1.6} />
              </div>

              <div className="routex-intent-input-wrap">
                <input
                  className="routex-intent-input"
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  placeholder="I need 500 USDC on Base"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") execute();
                  }}
                />
                <button className="routex-execute-btn" onClick={execute}>
                  FIND EXECUTION PLAN
                </button>
              </div>

              <div className="routex-intent-chips">
                <button className="routex-chip" onClick={() => setIntent("I need 500 USDC on Base")}>
                  500 USDC â†’ Base
                </button>
                <button className="routex-chip" onClick={() => setIntent("Swap 1 ETH for USDC with minimum slippage")}>
                  Swap ETH â†’ USDC
                </button>
                <button className="routex-chip" onClick={() => setIntent("Move my USDC to the lowest-cost L2")}>
                  Find lowest-cost L2
                </button>
              </div>
            </div>
          </div>

          <div className="routex-bottom-grid">
            <div className="routex-card routex-activity">
              <div className="routex-section-head">
                <div className="routex-section-title">Recent activity</div>
                <div className="routex-section-link">View all</div>
              </div>

              <div className="routex-activity-list">
                {activities.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div className="routex-activity-row" key={`${item.name}-${item.time}`}>
                      <div className="routex-activity-icon">
                        <Icon size={13} strokeWidth={1.7} />
                      </div>
                      <div>
                        <div className="routex-activity-name">{item.name}</div>
                        <div className="routex-activity-desc">{item.desc}</div>
                      </div>
                      <div className="routex-activity-time">{item.time}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="routex-card routex-insight">
              <div className="routex-section-head">
                <div className="routex-section-title">Network intelligence</div>
                <CircleDollarSign size={15} color="#777f8c" strokeWidth={1.6} />
              </div>

              <div className="routex-insight-box">
                <div className="routex-insight-kicker">Live insight</div>
                <div className="routex-insight-text">
                  Ethereum gas is elevated. For a cross-chain transfer, <strong>Base currently
                  offers lower destination execution cost</strong> than mainnet.
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
