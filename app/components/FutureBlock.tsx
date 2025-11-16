"use client";

import React, { useState } from "react";
import { useCashRaaga } from "../CashRaagaProvider";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function formatCurrency(amount: number | null | undefined) {
  if (amount == null) return "₹0";
  return amount.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

function riskColor(level: "low" | "medium" | "high") {
  switch (level) {
    case "low":
      return "text-emerald-400 bg-emerald-950/60 border-emerald-700/50";
    case "medium":
      return "text-amber-400 bg-amber-950/60 border-amber-700/50";
    case "high":
      return "text-rose-400 bg-rose-950/60 border-rose-700/50";
    default:
      return "text-slate-200 bg-slate-900/60 border-slate-700/60";
  }
}

const FutureBlock: React.FC = () => {
  const { analysis } = useCashRaaga();

  // if no analysis yet or backend hasn't sent future_block
  if (!analysis || !analysis.future_block) return null;

  const fb = analysis.future_block;
  const probPct = Math.round(fb.overspend_risk.probability * 100);
  const diag = fb.diagnostics;

  const [showWhy, setShowWhy] = useState(false);

  // chart: safe vs projected vs spent so far
  const paceData =
    diag &&
    [
      {
        name: "Safe limit",
        amount: diag.safe_monthly_limit,
      },
      {
        name: "Projected",
        amount: diag.projected_month_spend,
      },
      {
        name: "Spent so far",
        amount: diag.current_month_spend,
      },
    ];

  const paceRatio =
    diag && diag.safe_monthly_limit > 0
      ? diag.projected_month_spend / diag.safe_monthly_limit
      : null;

  const topRiskyCats = fb.risky_categories.slice(0, 2);

  return (
    <section className="mt-8 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg md:text-xl font-semibold text-slate-50">
          The Future – Smart Predictions
        </h2>
        <span className="text-xs md:text-sm text-slate-400">
          Based on your recent spending pattern
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: End-of-month savings */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-300">
              Projected month-end savings
            </h3>
            <span className="text-[10px] uppercase tracking-wide text-slate-500">
              Forecast
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-semibold text-emerald-400">
              {formatCurrency(fb.predicted_eom_savings)}
            </p>
            <p className="text-xs text-slate-400">
              Likely range:{" "}
              <span className="font-medium text-slate-200">
                {formatCurrency(fb.predicted_eom_range[0])} –{" "}
                {formatCurrency(fb.predicted_eom_range[1])}
              </span>
            </p>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            This is what you&apos;re likely to save by month-end if your income
            and spending stay roughly on the current track.
          </p>
        </div>

        {/* Card 2: Overspend risk + pace chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-300">
              Overspend risk (this month)
            </h3>
            <span className="text-[10px] uppercase tracking-wide text-slate-500">
              Risk score
            </span>
          </div>

          <div className="space-y-2">
            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs border ${riskColor(
                fb.overspend_risk.level
              )}`}
            >
              <span className="font-semibold capitalize">
                {fb.overspend_risk.level} risk
              </span>
              <span className="text-[11px] opacity-80">
                {probPct}
                {"%"}
              </span>
            </div>

            <p className="text-xs text-slate-400">
              We check how fast you&apos;re spending this month compared to what
              would keep your savings target safe.
            </p>

            {paceData && (
              <div className="mt-2 h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paceData} barCategoryGap={22}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      tickLine={false}
                      axisLine={{ stroke: "#1f2937" }}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(15,23,42,0.7)" }}
                      contentStyle={{
                        backgroundColor: "#020617",
                        borderRadius: 10,
                        border: "1px solid #1f2937",
                        fontSize: 11,
                      }}
                      formatter={(value: any) =>
                        formatCurrency(Number(value)).replace("₹", "₹")
                      }
                      labelStyle={{ color: "#e5e7eb" }}
                    />
                    <Bar
                      dataKey="amount"
                      radius={[6, 6, 2, 2]}
                      fill="#38bdf8"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-[11px] text-slate-500">
              Tip: if risk is medium or high, slow down on non-essential spends
              for a week or two.
            </p>
            <button
              type="button"
              onClick={() => setShowWhy((v) => !v)}
              className="text-[11px] text-emerald-300 hover:text-emerald-200 underline underline-offset-4"
            >
              {showWhy ? "Hide why" : "Why is my risk high?"}
            </button>
          </div>

          {showWhy && (
            <div className="mt-2 rounded-xl bg-slate-950/70 border border-slate-800/80 p-3 text-[11px] text-slate-300 space-y-1.5">
              {diag && (
                <>
                  <p>
                    • Safe spend this month:{" "}
                    <span className="font-medium">
                      {formatCurrency(diag.safe_monthly_limit)}
                    </span>
                  </p>
                  <p>
                    • Projected spend this month:{" "}
                    <span className="font-medium">
                      {formatCurrency(diag.projected_month_spend)}
                    </span>
                  </p>
                  <p>
                    • Spent so far:{" "}
                    <span className="font-medium">
                      {formatCurrency(diag.current_month_spend)}
                    </span>
                  </p>
                  {paceRatio !== null && (
                    <p>
                      • At this pace you&apos;ll use about{" "}
                      <span className="font-medium">
                        {(paceRatio * 100).toFixed(0)}%
                      </span>{" "}
                      of your safe limit.
                    </p>
                  )}
                </>
              )}

              {topRiskyCats.length > 0 && (
                <p>
                  • Biggest jumps vs usual:{" "}
                  {topRiskyCats.map((cat, idx) => {
                    const diff =
                      cat.projected_amount - (cat.baseline_amount || 0);
                    const pct =
                      cat.baseline_amount > 0
                        ? Math.round((diff / cat.baseline_amount) * 100)
                        : 0;
                    return (
                      <span key={cat.name}>
                        {idx > 0 && ", "}
                        <span className="font-medium">{cat.name}</span>{" "}
                        {pct > 0 && <span>(+{pct}% vs usual)</span>}
                      </span>
                    );
                  })}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Card 3: Risky categories list */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-300">
              Where you may overspend
            </h3>
            <span className="text-[10px] uppercase tracking-wide text-slate-500">
              Top categories
            </span>
          </div>

          {fb.risky_categories.length === 0 ? (
            <p className="text-xs text-emerald-300">
              Nothing looks out of control compared to your usual pattern.
            </p>
          ) : (
            <ul className="space-y-2">
              {fb.risky_categories.map((cat) => {
                const diff =
                  cat.projected_amount - (cat.baseline_amount || 0);
                const diffPct =
                  cat.baseline_amount > 0
                    ? Math.round((diff / cat.baseline_amount) * 100)
                    : 0;

                return (
                  <li
                    key={cat.name}
                    className="flex items-start justify-between gap-2 text-xs"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-100">
                        {cat.name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Projected:{" "}
                        <span className="text-slate-200">
                          {formatCurrency(cat.projected_amount)}
                        </span>{" "}
                        {cat.baseline_amount > 0 && (
                          <>
                            · Usual:{" "}
                            <span className="text-slate-300">
                              {formatCurrency(cat.baseline_amount)}
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                    {diff > 0 && cat.baseline_amount > 0 && (
                      <span className="text-[11px] font-semibold text-rose-400 whitespace-nowrap">
                        +{diffPct}%
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <p className="mt-3 text-[11px] text-slate-500">
            Pick one or two of these to trim a bit. That&apos;s usually enough
            to protect your savings without feeling restricted.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FutureBlock;
