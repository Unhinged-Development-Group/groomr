"use client";

import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { adminGetAnalytics } from "@/app/actions/admin";
import type { AnalyticsData } from "@/app/actions/admin";
import { Eyebrow } from "@/components/ui/Eyebrow";

const BRAND = {
  gold: "#eae45c",
  sage: "#88a096",
  terra: "#c87964",
  slate: "#2c3e50",
};

function gbp(pence: number) {
  return (pence / 100).toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  });
}

function shortMonth(ym: string) {
  const [year, month] = ym.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

function ChartSkeleton() {
  return (
    <div className="h-[220px] bg-pebble-grey/10 rounded-[14px] animate-pulse" />
  );
}

function CustomTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-pebble-grey/20 rounded-[12px] shadow-modal px-3 py-2 font-nunito text-xs">
      <p className="font-bold text-deep-slate mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {formatter ? formatter(p.value) : p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export function AnalyticsTab() {
  const [months, setMonths] = useState(6);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setData(null);
    adminGetAnalytics(months).then((result) => {
      if ("error" in result) {
        setError(result.error);
      } else {
        setData(result.data);
        setError(null);
      }
      setLoading(false);
    });
  }, [months]);

  const revenueChartData = data?.revenue.map((p) => ({
    month: shortMonth(p.month),
    Revenue: p.value,
  })) ?? [];

  const bookingsChartData = data?.bookings.map((p) => ({
    month: shortMonth(p.month),
    Bookings: p.value,
  })) ?? [];

  const signupsChartData = data?.signups.map((p) => ({
    month: shortMonth(p.month),
    Owners: p.owners,
    Groomers: p.groomers,
  })) ?? [];

  return (
    <div className="space-y-6">
      {/* Time range selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-pebble-grey uppercase tracking-wider mr-1">Range</span>
        {[3, 6, 12].map((m) => (
          <button
            key={m}
            onClick={() => setMonths(m)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors focus-ring ${
              months === m
                ? "bg-deep-slate text-alabaster-cream border-deep-slate"
                : "bg-white text-deep-slate border-pebble-grey/30 hover:bg-alabaster-cream"
            }`}
          >
            {m}M
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-muted-terracotta/10 border border-muted-terracotta/30 rounded-[14px] px-4 py-3 text-sm text-muted-terracotta font-bold">
          Failed to load analytics: {error}
        </div>
      )}

      {/* Revenue chart */}
      <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5 space-y-4">
        <Eyebrow>Revenue</Eyebrow>
        {loading ? (
          <ChartSkeleton />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: "Nunito", fill: BRAND.slate }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(v) => gbp(v)} tick={{ fontSize: 10, fontFamily: "Nunito", fill: "#95a5a6" }} tickLine={false} axisLine={false} width={72} />
              <Tooltip content={<CustomTooltip formatter={gbp} />} />
              <Line type="monotone" dataKey="Revenue" stroke={BRAND.gold} strokeWidth={2.5} dot={{ r: 3, fill: BRAND.gold, strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bookings chart */}
      <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5 space-y-4">
        <Eyebrow>Bookings</Eyebrow>
        {loading ? (
          <ChartSkeleton />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={bookingsChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: "Nunito", fill: BRAND.slate }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fontFamily: "Nunito", fill: "#95a5a6" }} tickLine={false} axisLine={false} width={32} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Bookings" fill={BRAND.sage} radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Signups chart */}
      <div className="bg-white border border-pebble-grey/20 rounded-[20px] p-5 space-y-4">
        <Eyebrow>Signups</Eyebrow>
        {loading ? (
          <ChartSkeleton />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={signupsChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: "Nunito", fill: BRAND.slate }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fontFamily: "Nunito", fill: "#95a5a6" }} tickLine={false} axisLine={false} width={32} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "Nunito" }} />
              <Bar dataKey="Owners" stackId="a" fill={BRAND.gold} radius={[0, 0, 0, 0]} maxBarSize={40} />
              <Bar dataKey="Groomers" stackId="a" fill={BRAND.terra} radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
