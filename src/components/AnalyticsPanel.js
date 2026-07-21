import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Activity, MessageSquareText, Coins, Layers } from 'lucide-react';

const COLORS = {
  primary: 'hsl(41 92% 57%)',
  accent: 'hsl(160 66% 50%)',
  grid: 'hsl(219 16% 17%)',
  text: 'hsl(219 14% 62%)',
};

const tooltipStyle = {
  backgroundColor: 'hsl(221 20% 9%)',
  border: '1px solid hsl(219 16% 17%)',
  borderRadius: '8px',
  fontSize: '12px',
  color: 'hsl(220 25% 95%)',
};

const StatCard = ({ icon: Icon, label, value, sub, accent }) => (
  <div className="rounded-xl border border-border bg-card p-5">
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
          accent ? 'bg-accent/15 text-accent' : 'bg-primary/15 text-primary'
        }`}
      >
        <Icon size={16} aria-hidden="true" />
      </span>
    </div>
    <p className="font-heading mt-3 text-2xl font-bold text-foreground">{value}</p>
    {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
  </div>
);

const AnalyticsPanel = ({ transactions, feedbacks, balance, pubKey }) => {
  // Group wallet transactions by day for the volume chart
  const txByDay = useMemo(() => {
    const map = new Map();
    transactions.forEach((tx) => {
      const day = new Date(tx.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const entry = map.get(day) || { day, count: 0, fees: 0 };
      entry.count += 1;
      entry.fees += Number(tx.fee_charged || 0);
      map.set(day, entry);
    });
    return Array.from(map.values()).reverse();
  }, [transactions]);

  // Feedback contribution per user handle
  const feedbackByUser = useMemo(() => {
    const map = new Map();
    feedbacks.forEach((f) => {
      const user = f.user || 'anon';
      map.set(user, (map.get(user) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([user, count]) => ({ user: user.length > 10 ? `${user.slice(0, 10)}…` : user, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [feedbacks]);

  const totalFees = useMemo(
    () => transactions.reduce((sum, tx) => sum + Number(tx.fee_charged || 0), 0),
    [transactions]
  );

  return (
    <section aria-label="Platform analytics" className="flex flex-col gap-5">
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={MessageSquareText}
          label="On-Chain Feedbacks"
          value={feedbacks.length}
          sub="Stored in Soroban contract"
        />
        <StatCard
          icon={Activity}
          label="Wallet Transactions"
          value={pubKey ? transactions.length : '—'}
          sub={pubKey ? 'Recent activity (Horizon)' : 'Connect wallet to view'}
          accent
        />
        <StatCard
          icon={Coins}
          label="Your Balance"
          value={pubKey ? `${balance} XLM` : '—'}
          sub={pubKey ? 'Stellar testnet' : 'Connect wallet to view'}
        />
        <StatCard
          icon={Layers}
          label="Fees Paid"
          value={pubKey ? `${totalFees} st` : '—'}
          sub="Stroops across recent txs"
          accent
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-heading text-sm font-semibold text-foreground">
            Transaction Volume
          </h3>
          <p className="mb-4 text-xs text-muted-foreground">
            {pubKey ? 'Your recent on-chain activity per day' : 'Connect a wallet to see live data'}
          </p>
          <div className="h-56">
            {txByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={txByDay} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="txFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: COLORS.text, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: COLORS.text, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Transactions"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    fill="url(#txFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No transaction data yet
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-heading text-sm font-semibold text-foreground">
            Feedback Contributors
          </h3>
          <p className="mb-4 text-xs text-muted-foreground">
            Messages per handle, decoded from contract storage
          </p>
          <div className="h-56">
            {feedbackByUser.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feedbackByUser} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="user" tick={{ fill: COLORS.text, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: COLORS.text, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(220 15% 14% / 0.5)' }} />
                  <Bar dataKey="count" name="Feedbacks" fill={COLORS.accent} radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No feedback data yet
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnalyticsPanel;
