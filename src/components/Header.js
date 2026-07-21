import React from 'react';
import { Wallet, LogOut, Power } from 'lucide-react';

const Header = ({ pubKey, balance, onConnect, onDisconnect }) => {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-heading font-bold text-sm">
            B
          </span>
          <div className="leading-tight">
            <span className="block font-heading text-base font-semibold text-foreground">Banzaan</span>
            <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
              Stellar Testnet
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {pubKey ? (
            <>
              <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                <span className="font-mono text-xs text-foreground">
                  {`${pubKey.slice(0, 4)}…${pubKey.slice(-4)}`}
                </span>
              </div>
              <div className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-accent">
                {balance} XLM
              </div>
              <button
                onClick={onDisconnect}
                aria-label="Disconnect wallet"
                className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
              >
                <LogOut size={14} aria-hidden="true" />
                <span className="hidden sm:inline">Disconnect</span>
              </button>
            </>
          ) : (
            <button
              onClick={onConnect}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Wallet size={16} aria-hidden="true" />
              Connect
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
