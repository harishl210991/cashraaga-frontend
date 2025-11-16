"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useCashRaaga } from "./CashRaagaProvider";

/* ---------- TYPES (MATCH BACKEND JSON) ---------- */

type BackendSummary = {
  inflow: number;
  outflow: number;
  net_savings: number;
  this_month: {
    month: string;
    savings: number;
    prev_savings: number;
    mom_change: number;
  };
  safe_daily_spend: number;
};

type MonthlyEntry = {
  month: string;
  signed_amount: number;
};

type CategoryEntry = {
  category: string;
  signed_amount: number;
};

type UpiInfo = {
  this_month: number;
  top_handle: string | null;
  total_upi: number;
};

type EmiInfo = {
  this_month: number;
  months_tracked: number;
};

type ApiResult = {
  summary: BackendSummary;
  monthly_savings: MonthlyEntry[];
  category_summary: CategoryEntry[];
  upi: UpiInfo;
  emi: EmiInfo;
  cleaned_csv: string;
};

/* ---------- CONSTANTS & HELPERS ---------- */

const CATEGORY_COLORS = [
  "#22c55e",
  "#a855f7",
  "#f97316",
  "#3b82f6",
  "#e11d48",
  "#06b6d4",
  "#facc15",
  "#4ade80",
  "#fb923c",
  "#38bdf8",
];

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const fmt = (n: number | undefined) =>
  (n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

/* ======================================================
   MAIN COMPONENT
   ====================================================== */

export default function Home() {
  const { analysis, setAnalysis } = useCashRaaga();

  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ApiResult | null>(
    () => (analysis as ApiResult | null) ?? null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // when provider rehydrates from localStorage, sync into page state
  useEffect(() => {
    if (analysis) {
      setResult(analysis as ApiResult);
    }
  }, [analysis]);

  const summary = result?.summary;
  const monthlyData = result?.monthly_savings ?? [];
  const categoryData = result?.category_summary ?? [];
  const upiInfo = result?.upi;
  const emiInfo = result?.emi;

  const totalCategorySpend = categoryData.reduce(
    (sum, c) => sum + (c.signed_amount ?? 0),
    0
  );

  const growthText =
    summary && summary.this_month
      ? (() => {
          const curr = summary.this_month.savings ?? 0;
          const prev = summary.this_month.prev_savings ?? 0;
          if (prev === 0) return "First month tracked";
          const pct = ((curr - prev) / Math.abs(prev)) * 100;
          const sign = pct >= 0 ? "+" : "";
          return `${sign}${pct.toFixed(0)}% vs last month`;
        })()
      : "-";

  /* ---------- Handlers ---------- */

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setResult(null);
    setAnalysis(null); // clear old global analysis when new file is chosen
    setError("");
  };

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Upload a statement file first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      console.log("API_BASE used in this build:", API_BASE);

      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        body: formData,
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // if backend returns non-JSON or nothing
        throw new Error(`Could not parse server response (status ${res.status})`);
      }

      if (!res.ok) {
        // show backend error text if it exists
        throw new Error(
          data?.error || `Backend error (status ${res.status})`
        );
      }

      setResult(data as ApiResult);
    } catch (err: any) {
      console.error("Analyze error:", err);
      setError(
        typeof err?.message === "string"
          ? err.message
          : "Could not reach the analysis server. Please try again in a moment."
      );
    } finally {
      setLoading(false);
    }
  };

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Backend error");
      }

      setResult(data as ApiResult);
      setAnalysis(data); // persist globally + localStorage
    } catch (err) {
      console.error(err);
      setError(
        "Could not reach the analysis server. Please try again in a moment."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!result?.cleaned_csv) return;
    const csv = result.cleaned_csv;
    if (!csv || csv.trim() === "") return;

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cashraaga_cleaned_statement.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /* ---------- JSX ---------- */

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a_0,_#020617_45%,_#000000_100%)] text-slate-50 flex justify-center px-3 py-6 md:px-6 md:py-10">
      <div className="w-full max-w-5xl flex flex-col gap-6 md:gap-8">
        {/* Top bar */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 text-xs font-semibold">
              CR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
                  CashRaaga
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-700 text-slate-400 uppercase">
                  Beta
                </span>
              </div>
              <p className="text-[11px] md:text-xs text-slate-400 mt-0.5">
                Minimal, private money insights from your bank statements.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <nav className="hidden sm:flex items-center gap-1 text-[11px] bg-slate-900/70 border border-slate-800 rounded-full px-1 py-0.5">
              <Link
                href="/"
                className="px-3 py-1 rounded-full hover:bg-slate-800 text-slate-200"
              >
                Dashboard
              </Link>
              <Link
                href="/advisor"
                className="px-3 py-1 rounded-full hover:bg-slate-800 text-slate-400"
              >
                Can I afford this?
              </Link>
            </nav>

            {result && (
              <button
                onClick={handleDownloadCsv}
                className="hidden md:inline-flex items-center gap-2 rounded-full bg-slate-900/80 border border-slate-700 px-4 py-1.5 text-xs text-slate-100 hover:bg-slate-900"
              >
                ⬇ Cleaned CSV
              </button>
            )}
          </div>
        </header>

        {/* Hero + Upload */}
        <section className="grid grid-cols-1 md:grid-cols-[1.2fr,1fr] gap-5 md:gap-6 items-start">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                One statement.
                <span className="block text-emerald-400">
                  Your whole money story.
                </span>
              </h2>
              <p className="mt-2 text-sm text-slate-400 max-w-md">
                Upload your bank statement. CashRaaga quietly computes your
                inflow, outflow, savings, EMIs, UPI pattern and safe daily
                spend.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-sm p-4 md:p-5 space-y-3"
            >
              <div className="flex flex-col gap-3">
                <label className="text-xs text-slate-300">
                  Bank statement file (.csv / .xlsx)
                </label>

                {/* Upload + Analyze - responsive layout */}
                <div className="border border-dashed border-slate-700 rounded-xl bg-slate-950/50 px-3 py-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex-1 min-w-0">
                    <input
                      type="file"
                      accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                      onChange={handleFileChange}
                      className="block w-full text-[11px] md:text-xs text-slate-300
                                 file:mr-3 file:py-1.5 file:px-3 file:rounded-full
                                 file:border-0 file:text-[11px] file:font-medium
                                 file:bg-emerald-500 file:text-slate-950
                                 hover:file:bg-emerald-400
                                 truncate"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="sm:ml-auto w-full sm:w-auto rounded-full bg-emerald-500 px-4 py-1.5 text-[11px] font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? "Analyzing…" : "Analyze"}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-[11px] text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              {!result && !error && !loading && (
                <p className="text-[11px] text-slate-500">
                  CashRaaga auto-detects columns like{" "}
                  <span className="font-mono text-slate-300">Date</span>,{" "}
                  <span className="font-mono text-slate-300">Narration</span>,{" "}
                  <span className="font-mono text-slate-300">
                    Amount / Credit / Debit
                  </span>{" "}
                  from Indian bank exports.
                </p>
              )}
            </form>
          </div>

          {/* Compact summary hero */}
          <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 p-4 md:p-5 flex flex-col gap-4">
            <p className="text-[11px] text-slate-400 uppercase tracking-wide">
              Snapshot
            </p>
            {summary ? (
              <>
                <div>
                  <p className="text-[11px] text-slate-400 mb-1">
                    This month savings
                  </p>
                  <p className="text-2xl font-semibold text-emerald-300">
                    ₹{fmt(summary.this_month?.savings)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {summary.this_month?.month || "-"} · {growthText}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-2xl bg-slate-950/60 border border-slate-800 px-3 py-2">
                    <p className="text-slate-400">Total inflow</p>
                    <p className="mt-1 text-slate-100 font-medium">
                      ₹{fmt(summary.inflow)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-950/60 border border-slate-800 px-3 py-2">
                    <p className="text-slate-400">Total outflow</p>
                    <p className="mt-1 text-rose-300 font-medium">
                      ₹{fmt(summary.outflow)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-950/60 border border-slate-800 px-3 py-2">
                    <p className="text-slate-400">Net savings</p>
                    <p className="mt-1 text-sky-300 font-medium">
                      ₹{fmt(summary.net_savings)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-950/60 border border-slate-800 px-3 py-2">
                    <p className="text-slate-400">Safe daily spend</p>
                    <p className="mt-1 text-amber-300 font-medium">
                      ₹{fmt(summary.safe_daily_spend)}
                    </p>
                  </div>
                </div>            
              </>
            ) : (
              <p className="text-xs text-slate-500">
                Once you upload a statement, you’ll see your savings, UPI and
                EMI snapshot here.
              </p>
            )}

            {result && (
              <button
                onClick={handleDownloadCsv}
                className="mt-1 inline-flex md:hidden items-center justify-center rounded-full bg-slate-950/70 border border-slate-700 px-3 py-1.5 text-[11px] text-slate-100"
              >
                ⬇ Download cleaned CSV
              </button>
            )}
          </div>
        </section>

        {/* Analytics: only if we have a result */}
        {result && summary && (
          <section className="space-y-5 md:space-y-6">
            {/* Charts row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Monthly savings bar chart */}
              <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-4 md:p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-slate-100">
                    Monthly savings
                  </h3>
                </div>
                {monthlyData.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Not enough history to plot.
                  </p>
                ) : (
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData} barCategoryGap={18}>
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 10, fill: "#9ca3af" }}
                          tickLine={false}
                          axisLine={{ stroke: "#1f2937" }}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#9ca3af" }}
                          tickFormatter={(v) => fmt(v)}
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
                            `₹${fmt(Number(value))}`
                          }
                          labelStyle={{ color: "#e5e7eb" }}
                        />
                        <Bar
                          dataKey="signed_amount"
                          radius={[8, 8, 4, 4]}
                          fill="#38bdf8"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Category donut */}
              <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-4 md:p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-slate-100">
                    Where your money goes
                  </h3>
                </div>
                {categoryData.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No categories detected.
                  </p>
                ) : (
                  <div className="flex gap-3 md:gap-4 items-center">
                    {/* Donut with center label */}
                    <div className="relative h-44 w-1/2">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            dataKey="signed_amount"
                            nameKey="category"
                            innerRadius={40}
                            outerRadius={72}
                            paddingAngle={2}
                            stroke="none"
                          >
                            {categoryData.map((entry, index) => (
                              <Cell
                                key={entry.category}
                                fill={
                                  CATEGORY_COLORS[
                                    index % CATEGORY_COLORS.length
                                  ]
                                }
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            cursor={{ fill: "rgba(15,23,42,0.7)" }}
                            contentStyle={{
                              backgroundColor: "#020617",
                              borderRadius: 10,
                              border: "1px solid #1f2937",
                              fontSize: 11,
                            }}
                            formatter={(value: any, name: any) => {
                              const v = Number(value);
                              const pct =
                                totalCategorySpend > 0
                                  ? (
                                      (v / totalCategorySpend) *
                                      100
                                    ).toFixed(1)
                                  : "0.0";
                              return [`₹${fmt(v)} (${pct}%)`, name];
                            }}
                            labelStyle={{ color: "#e5e7eb" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      {/* Center total label */}
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] uppercase tracking-wide text-slate-500">
                          Total spend
                        </span>
                        <span className="text-sm font-semibold text-slate-100">
                          ₹{fmt(totalCategorySpend)}
                        </span>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex-1 max-h-44 overflow-auto">
                      <ul className="space-y-1 text-[11px]">
                        {categoryData.map((cat, index) => (
                          <li
                            key={cat.category}
                            className="flex items-center justify-between"
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{
                                  backgroundColor:
                                    CATEGORY_COLORS[
                                      index % CATEGORY_COLORS.length
                                    ],
                                }}
                              />
                              <span className="text-slate-100">
                                {cat.category}
                              </span>
                            </span>
                            <span className="text-slate-400">
                              ₹{fmt(cat.signed_amount)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* EMI / UPI / Safe spend cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* UPI card */}
              <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-4">
                <p className="text-[11px] text-slate-400 mb-1">
                  UPI outflow (this month)
                </p>
                <p className="text-lg font-semibold text-rose-300">
                  ₹{fmt(upiInfo?.this_month)}
                </p>

                {upiInfo && summary && summary.outflow !== 0 && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    {(() => {
                      const share =
                        ((upiInfo.this_month ?? 0) /
                          Math.abs(summary.outflow || 1)) *
                        100;
                      return `~${share.toFixed(1)}% of your total spend`;
                    })()}
                  </p>
                )}

                {upiInfo?.top_handle && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    Top handle:{" "}
                    <span className="text-slate-200">
                      {upiInfo.top_handle}
                    </span>
                  </p>
                )}
              </div>

              {/* EMI card */}
              <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-4">
                <p className="text-[11px] text-slate-400 mb-1">
                  EMI load (this month)
                </p>
                <p className="text-lg font-semibold text-rose-300">
                  ₹{fmt(emiInfo?.this_month)}
                </p>
                {emiInfo && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    EMI months tracked:{" "}
                    <span className="text-slate-200">
                      {emiInfo.months_tracked}
                    </span>
                  </p>
                )}
              </div>

              {/* Safe spend card */}
              <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-4">
                <p className="text-[11px] text-slate-400 mb-1">
                  Safe daily spend
                </p>
                <p className="text-lg font-semibold text-amber-300">
                  ₹{fmt(summary.safe_daily_spend)}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  You can roughly spend this per day without touching savings.
                </p>
              </div>
            </div>

            {/* Transactions placeholder */}
            <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-4 md:p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-100">
                  Latest transactions (cleaned)
                </h3>
                <span className="text-[11px] text-slate-500">
                  Coming soon
                </span>
              </div>
              <p className="text-xs text-slate-500">
                In a future update, this section will show a cleaned, searchable
                list of your recent transactions from the statement you upload.
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
