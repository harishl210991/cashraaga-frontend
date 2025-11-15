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
      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        body: formData,
      });

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
                c
