import React from 'react';
import { Send, Wallet, ExternalLink, Copy, Check, Clock } from 'lucide-react';

const PaymentPanel = ({
  pubKey,
  balance,
  recipient,
  setRecipient,
  amount,
  setAmount,
  loading,
  onPay,
  onConnect,
  transactions,
  onCopyTxHash,
  copiedTxIndex,
}) => {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Send size={16} aria-hidden="true" />
          </span>
          <h2 className="font-heading text-base font-semibold text-foreground">Send Payment</h2>
        </div>

        {pubKey ? (
          <>
            <div className="mt-4 rounded-lg bg-muted p-4">
              <span className="block text-xs uppercase tracking-wide text-muted-foreground">
                Available balance
              </span>
              <span className="font-heading text-2xl font-bold text-accent">{balance} XLM</span>
            </div>
            <form onSubmit={onPay} className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Recipient address</span>
                <input
                  type="text"
                  placeholder="G..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  required
                  className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Amount (XLM)</span>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Processing…' : (
                  <>
                    <Send size={16} aria-hidden="true" />
                    Send XLM
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="mt-4 flex flex-col items-center gap-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Connect your wallet to send payments and view your balance.
            </p>
            <button
              onClick={onConnect}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Wallet size={16} aria-hidden="true" />
              Connect Wallet
            </button>
          </div>
        )}
      </div>

      {/* Recent wallet transactions */}
      {pubKey && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-heading text-sm font-semibold text-foreground">Recent Transactions</h3>
          <div className="scroll-slim mt-3 flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
            {transactions.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                No transactions found for this account.
              </p>
            ) : (
              transactions.map((tx, idx) => (
                <div key={idx} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock size={12} aria-hidden="true" />
                      {new Date(tx.created_at).toLocaleTimeString()}
                    </span>
                    <span className="font-medium text-accent">Fee: {tx.fee_charged} st</span>
                  </div>
                  <p className="mt-2 break-all rounded bg-muted px-2 py-1.5 font-mono text-xs text-muted-foreground">
                    {`${tx.id.slice(0, 12)}…${tx.id.slice(-12)}`}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => onCopyTxHash(tx.id, idx)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-muted px-2 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/60"
                    >
                      {copiedTxIndex === idx ? (
                        <>
                          <Check size={12} className="text-accent" aria-hidden="true" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={12} aria-hidden="true" /> Copy hash
                        </>
                      )}
                    </button>
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${tx.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      <ExternalLink size={12} aria-hidden="true" /> Explorer
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPanel;
