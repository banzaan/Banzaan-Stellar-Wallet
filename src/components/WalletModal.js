import React from 'react';
import { X, Wallet, ShieldCheck } from 'lucide-react';

const WalletModal = ({ open, onClose, onConnectFreighter, connecting }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Connect wallet"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-heading text-lg font-semibold text-foreground">Connect a Wallet</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Sign in securely on the Stellar testnet
        </p>

        <button
          onClick={onConnectFreighter}
          disabled={connecting}
          className="w-full flex items-center gap-3 rounded-lg border border-border bg-muted px-4 py-3.5 text-left transition-colors hover:border-primary disabled:opacity-60"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Wallet size={20} />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold text-foreground">Freighter</span>
            <span className="block text-xs text-muted-foreground">Stellar browser extension</span>
          </span>
          {connecting && (
            <span className="text-xs text-muted-foreground">Connecting…</span>
          )}
        </button>

        <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck size={14} className="text-accent" />
          <span>Your keys never leave your wallet</span>
        </div>
      </div>
    </div>
  );
};

export default WalletModal;
