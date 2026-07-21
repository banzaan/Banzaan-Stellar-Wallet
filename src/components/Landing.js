import React from 'react';
import {
  ArrowRight,
  Wallet,
  Send,
  BarChart3,
  MessageSquareText,
  ShieldCheck,
  Zap,
  Globe,
  Sparkles,
} from 'lucide-react';

const TelegramIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

const XIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

const features = [
  {
    icon: Send,
    title: 'Instant XLM Payments',
    desc: 'Send Stellar lumens to any address in seconds with near-zero fees on the Stellar network.',
  },
  {
    icon: BarChart3,
    title: 'On-Chain Analytics',
    desc: 'Live platform metrics pulled straight from Horizon and Soroban — volumes, fees, and activity.',
  },
  {
    icon: MessageSquareText,
    title: 'Immutable Feedback',
    desc: 'Feedback is written to a Soroban smart contract, permanently stored on the Stellar ledger.',
  },
  {
    icon: ShieldCheck,
    title: 'Non-Custodial',
    desc: 'Your keys stay in your wallet. Every transaction is signed locally through Freighter.',
  },
];

const stats = [
  { icon: Zap, value: '~5s', label: 'Transaction finality' },
  { icon: Globe, value: '100%', label: 'On-chain data' },
  { icon: Sparkles, value: '0.00001', label: 'XLM base fee' },
];

const Landing = ({ onWalletConnect, onSocialLogin }) => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-heading font-bold text-sm">
            B
          </span>
          <span className="font-heading text-lg font-semibold">Banzaan</span>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex" aria-label="Main">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#signup" className="hover:text-foreground transition-colors">Sign Up</a>
        </nav>
        <button
          onClick={onWalletConnect}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Launch App
        </button>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-20 pt-16 text-center md:pt-24">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          Live on Stellar Testnet
        </span>
        <h1 className="font-heading max-w-3xl text-balance text-4xl font-bold leading-tight md:text-6xl">
          Payments and analytics, {' '}
          <span className="text-primary">verifiably on-chain</span>
        </h1>
        <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
          Banzaan is a Stellar-powered platform for instant XLM payments, transparent
          platform analytics, and feedback stored forever in Soroban smart contracts.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <button
            onClick={onWalletConnect}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Connect Wallet
            <ArrowRight size={16} />
          </button>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Explore Features
          </a>
        </div>

        {/* Stats strip */}
        <div className="mt-16 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card px-4 py-5">
              <s.icon size={18} className="text-primary" aria-hidden="true" />
              <span className="font-heading mt-1 text-xl font-bold">{s.value}</span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-heading text-balance text-center text-3xl font-bold md:text-4xl">
            Everything runs on the ledger
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-center text-sm leading-relaxed text-muted-foreground">
            No hidden databases. Payments, metrics, and feedback all live on Stellar.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <f.icon size={20} aria-hidden="true" />
                </span>
                <h3 className="font-heading mt-4 text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sign up */}
      <section id="signup" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8">
          <h2 className="font-heading text-balance text-center text-2xl font-bold">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
            Choose how you want to join Banzaan
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={onWalletConnect}
              className="flex w-full items-center gap-3 rounded-lg bg-primary px-4 py-3.5 text-left font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Wallet size={20} aria-hidden="true" />
              <span className="flex-1 text-sm">Continue with Wallet</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>

            <div className="flex items-center gap-3 py-1" aria-hidden="true">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <button
              onClick={() => onSocialLogin('telegram')}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-muted px-4 py-3.5 text-left transition-colors hover:border-primary/60"
            >
              <TelegramIcon className="h-5 w-5 text-[#2AABEE]" />
              <span className="flex-1 text-sm font-semibold text-foreground">Continue with Telegram</span>
            </button>

            <button
              onClick={() => onSocialLogin('x')}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-muted px-4 py-3.5 text-left transition-colors hover:border-primary/60"
            >
              <XIcon className="h-5 w-5 text-foreground" />
              <span className="flex-1 text-sm font-semibold text-foreground">Continue with X</span>
            </button>
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
            Social sign-in is coming soon. Wallet connection is fully live on testnet.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <span>Banzaan — built on Stellar</span>
          <span>Soroban smart contracts · Testnet</span>
        </div>
      </footer>
    </main>
  );
};

export default Landing;
