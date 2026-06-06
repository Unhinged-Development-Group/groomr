"use client";

import type { AdminFinancials, AdminMonthlyStats } from "@/app/actions/admin";

function gbp(pence: number, decimals = 0) {
  return (pence / 100).toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: decimals,
  });
}

function formatMonth(ym: string): string {
  const [y, m] = ym.split("-");
  return new Date(+y, +m - 1).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-[20px] p-5 space-y-1 border ${
        highlight
          ? "bg-groomr-gold/10 border-groomr-gold/40"
          : "bg-white border-pebble-grey/20"
      }`}
    >
      <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider">{label}</p>
      <p className="font-fredoka text-3xl text-deep-slate leading-tight">{value}</p>
      {sub && <p className="text-xs text-pebble-grey">{sub}</p>}
    </div>
  );
}

function MonthlyTable({ rows }: { rows: AdminMonthlyStats[] }) {
  if (rows.length === 0) {
    return (
      <div className="py-10 text-center text-pebble-grey font-bold text-sm">
        No payment data yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-pebble-grey/10">
            <th className="text-left px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider">
              Month
            </th>
            <th className="text-right px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider">
              Revenue
            </th>
            <th className="text-right px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider">
              Commission
            </th>
            <th className="text-right px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider">
              Payouts
            </th>
            <th className="text-right px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider hidden sm:table-cell">
              Refunds
            </th>
            <th className="text-right px-4 py-3 text-xs font-bold text-pebble-grey uppercase tracking-wider">
              Bookings
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-pebble-grey/10">
          {rows.map((r) => (
            <tr key={r.month} className="hover:bg-alabaster-cream/50 transition-colors">
              <td className="px-4 py-3 font-bold text-deep-slate">{formatMonth(r.month)}</td>
              <td className="px-4 py-3 text-right text-deep-slate font-bold">
                {gbp(r.revenuePence)}
              </td>
              <td className="px-4 py-3 text-right">
                <span className="inline-block bg-groomr-gold/20 text-deep-slate font-bold rounded-full px-2 py-0.5 text-xs">
                  {gbp(r.feePence)}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-pebble-grey">{gbp(r.payoutPence)}</td>
              <td className="px-4 py-3 text-right text-muted-terracotta hidden sm:table-cell">
                {r.refundPence > 0 ? gbp(r.refundPence) : "—"}
              </td>
              <td className="px-4 py-3 text-right text-pebble-grey">{r.appointmentCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface Props {
  financials: AdminFinancials | null;
}

export function FinancialsTab({ financials }: Props) {
  if (!financials) {
    return (
      <div className="py-12 text-center text-pebble-grey font-bold">
        Failed to load financials data.
      </div>
    );
  }

  const {
    totalRevenuePence,
    totalFeePence,
    totalPayoutPence,
    totalRefundedPence,
    totalTipsPence,
    pendingPayoutsPence,
    pendingPayoutsCount,
    monthlyBreakdown,
  } = financials;

  return (
    <div className="space-y-6">
      {/* Primary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard
          label="Total Revenue"
          value={gbp(totalRevenuePence)}
          sub="Gross booking payments"
        />
        <StatCard
          label="Commission Earned"
          value={gbp(totalFeePence)}
          sub="Groomr 8% platform fee"
          highlight
        />
        <StatCard
          label="Groomer Payouts"
          value={gbp(totalPayoutPence)}
          sub="Net sent to groomers"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Refunds Issued"
          value={totalRefundedPence > 0 ? gbp(totalRefundedPence) : "£0"}
          sub="Processed refunds only"
        />
        <StatCard
          label="Tips Collected"
          value={totalTipsPence > 0 ? gbp(totalTipsPence) : "£0"}
          sub="Customer-added gratuity"
        />
        <StatCard
          label="Pending Payouts"
          value={gbp(pendingPayoutsPence)}
          sub={`${pendingPayoutsCount} payment${pendingPayoutsCount !== 1 ? "s" : ""} queued`}
          highlight={pendingPayoutsCount > 0}
        />
      </div>

      {/* Monthly breakdown */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-pebble-grey uppercase tracking-wider">
          Monthly breakdown · last 6 months
        </p>
        <div className="bg-white border border-pebble-grey/20 rounded-[20px] overflow-hidden">
          <MonthlyTable rows={monthlyBreakdown} />
        </div>
      </div>
    </div>
  );
}
