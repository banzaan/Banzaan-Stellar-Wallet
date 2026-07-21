import React from 'react';
import { MessageSquareText, Send, Copy, Check, Search } from 'lucide-react';

const FeedbackPanel = ({
  pubKey,
  userName,
  setUserName,
  feedbackInput,
  setFeedbackInput,
  contractLoading,
  onSendFeedback,
  feedbacks,
  onCopyText,
  copiedIndex,
  searchId,
  setSearchId,
  onSearchId,
  searchLoading,
  searchResult,
}) => {
  return (
    <div className="flex flex-col gap-5">
      {/* Submit feedback */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <MessageSquareText size={16} aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-heading text-base font-semibold text-foreground">Feedback Board</h2>
            <p className="text-xs text-muted-foreground">Immutable logs written to Soroban</p>
          </div>
        </div>

        <form onSubmit={onSendFeedback} className="mt-4 flex flex-col gap-3">
          <input
            type="text"
            placeholder="Your name / handle"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
            className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent"
          />
          <textarea
            placeholder="Write your on-chain feedback…"
            value={feedbackInput}
            onChange={(e) => setFeedbackInput(e.target.value)}
            required
            rows={3}
            className="resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent"
          />
          <button
            type="submit"
            disabled={contractLoading || !pubKey}
            className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {contractLoading ? 'Submitting to ledger…' : (
              <>
                <Send size={16} aria-hidden="true" />
                {pubKey ? 'Submit Feedback' : 'Connect wallet to submit'}
              </>
            )}
          </button>
        </form>
      </div>

      {/* On-chain logs */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-sm font-semibold text-foreground">On-Chain Logs</h3>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {feedbacks.length} total
          </span>
        </div>
        <div className="scroll-slim mt-3 flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
          {feedbacks.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">No feedbacks logged yet.</p>
          ) : (
            feedbacks.map((f, i) => (
              <button
                key={i}
                onClick={() => onCopyText(`[ID: ${f.id}] ${f.user}: ${f.message}`, i)}
                className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-accent/60"
              >
                <span className="truncate text-sm text-foreground">
                  <span className="font-semibold text-primary">#{f.id}</span>{' '}
                  <span className="font-medium">{f.user}</span>
                  <span className="text-muted-foreground">: {f.message}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  {copiedIndex === i ? (
                    <>
                      <Check size={12} className="text-accent" aria-hidden="true" /> Copied
                    </>
                  ) : (
                    <Copy size={12} aria-hidden="true" />
                  )}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Inspect by ID */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-heading text-sm font-semibold text-foreground">Inspect Feedback by ID</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Decode any feedback entry stored in the contract ledger.
        </p>
        <form onSubmit={onSearchId} className="mt-3 flex gap-2">
          <input
            type="number"
            placeholder="Enter feedback ID (e.g. 1)"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            required
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
          <button
            type="submit"
            disabled={searchLoading}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Search size={14} aria-hidden="true" />
            {searchLoading ? '…' : 'Search'}
          </button>
        </form>

        {searchResult && (
          <div className="mt-4 rounded-lg border border-accent/40 bg-background p-4">
            <span className="inline-block rounded bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
              On-chain data extracted
            </span>
            <div className="mt-3 space-y-2 text-sm">
              <div>
                <span className="block text-xs text-muted-foreground">Feedback ID</span>
                <span className="font-heading font-bold text-primary">#{searchResult.id}</span>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground">User / handle</span>
                <span className="font-medium text-foreground">{searchResult.name}</span>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground">Content</span>
                <p className="mt-1 rounded-md border-l-2 border-primary bg-muted px-3 py-2 text-foreground">
                  {searchResult.message}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackPanel;
