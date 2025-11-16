"use client";

import React from "react";
import { useCashRaaga } from "../CashRaagaProvider";

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
  const { data } = useCashRaaga(); // or { summary, future_block } depending on your provider

  if (!data || !data.future_block) return null;

  const fb = data.future_block;
  const probPct = Math.round(fb.overspend_risk.probability * 100);

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
              Projected Month-End Savings
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
            This estimate adjusts for how you&apos;ve been spending so far this
            month compared to previous months.
          </p>
        </div>

        {/* Card 2: Overspend risk */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-300">
              Overspend Risk (This Month)
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
              Based on your projected total spend vs. your safe daily limit and
              past months&apos; behaviour.
            </p>
          </div>

          <p className="mt-3 text-[11px] text-slate-500">
            Tip: If risk is medium or high, trim non-essential spends for a few
            days to pull this down.
          </p>
        </div>

        {/* Card 3: Risky categories */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-300">
              Where You May Overspend
            </h3>
            <span className="text-[10px] uppercase tracking-wide text-slate-500">
              Top categories
            </span>
          </div>

          {fb.risky_categories.length === 0 ? (
            <p className="text-xs text-emerald-300">
              No categories look out of control compared to your usual pattern.
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
            Focus on trimming just one or two of these to hit your savings
            target without feeling restricted.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FutureBlock;
