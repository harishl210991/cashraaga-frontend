"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type CashRaagaContextType = {
  // We store the full API result object here
  analysis: any | null;
  setAnalysis: (data: any | null) => void;
};

const CashRaagaContext = createContext<CashRaagaContextType | undefined>(
  undefined
);

export function CashRaagaProvider({ children }: { children: ReactNode }) {
  const [analysis, setAnalysisState] = useState<any | null>(null);

  // Rehydrate from localStorage so data survives navigation / refresh
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("cashraaga-analysis");
    if (stored) {
      try {
        setAnalysisState(JSON.parse(stored));
      } catch {
        window.localStorage.removeItem("cashraaga-analysis");
      }
    }
  }, []);

  const setAnalysis = (data: any | null) => {
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

export function useCashRaaga() {
  const ctx = useContext(CashRaagaContext);
  if (!ctx) {
    throw new Error("useCashRaaga must be used within CashRaagaProvider");
  }
  return ctx;
}
