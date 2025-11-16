"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

/* ---------- TYPES ---------- */

type OverspendRisk = {
  level: "low" | "medium" | "high";
  probability: number; // 0–1
};

type RiskyCategory = {
  name: string;
  projected_amount: number;
  baseline_amount: number;
};

export type FutureBlock = {
  predicted_eom_savings: number;
  predicted_eom_range: [number, number];
  overspend_risk: OverspendRisk;
  risky_categories: RiskyCategory[];
};

export type ThisMonthSummary = {
  month: string;
  savings: number;
  prev_savings: number;
  mom_change: number;
};

export type Summary = {
  inflow: number;
  outflow: number;
  net_savings: number;
  this_month: ThisMonthSummary;
  safe_daily_spend: number;
};

export type UpiInfo = {
  this_month: number;
  top_handle: string | null;
  total_upi: number;
};

export type EmiInfo = {
  this_month: number;
  months_tracked: number;
};

export type MonthlySaving = {
  month: string;
  signed_amount: number;
};

export type CategorySummary = {
  category: string;
  signed_amount: number;
};

export type AnalysisResult = {
  summary: Summary;
  upi: UpiInfo;
  emi: EmiInfo;
  monthly_savings: MonthlySaving[];
  category_summary: CategorySummary[];
  cleaned_csv: string;
  future_block?: FutureBlock; // 👈 new ML block from backend (optional for safety)
};

/* ---------- CONTEXT ---------- */

type CashRaagaContextType = {
  analysis: AnalysisResult | null;
  setAnalysis: (data: AnalysisResult | null) => void;
};

const CashRaagaContext = createContext<CashRaagaContextType | undefined>(
  undefined
);

/* ---------- PROVIDER ---------- */

export function CashRaagaProvider({ children }: { children: ReactNode }) {
  const [analysis, setAnalysisState] = useState<AnalysisResult | null>(null);

  // Rehydrate from localStorage so data survives navigation / refresh
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("cashraaga-analysis");
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as AnalysisResult;
      setAnalysisState(parsed);
    } catch (err) {
      console.error("Failed to parse cached CashRaaga analysis", err);
      window.localStorage.removeItem("cashraaga-analysis");
    }
  }, []);

  const setAnalysis = (data: AnalysisResult | null) => {
    setAnalysisState(data);
    if (typeof window === "undefined") return;

    if (data) {
      window.localStorage.setItem("cashraaga-analysis", JSON.stringify(data));
    } else {
      window.localStorage.removeItem("cashraaga-analysis");
    }
  };

  return (
    <CashRaagaContext.Provider value={{ analysis, setAnalysis }}>
      {children}
    </CashRaagaContext.Provider>
  );
}

/* ---------- HOOK ---------- */

export function useCashRaaga() {
  const ctx = useContext(CashRaagaContext);
  if (!ctx) {
    throw new Error("useCashRaaga must be used within CashRaagaProvider");
  }
  return ctx;
}
