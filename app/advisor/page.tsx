"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCashRaaga } from "../CashRaagaProvider";   // 👈 NEW

const fmt = (n: number) =>
  n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

type VerdictType = "comfortable" | "stretch" | "risky" | null;

export default function AdvisorPage() {
  const { analysis } = useCashRaaga();                 // 👈 shared data from dashboard

  const [income, setIncome] = useState<string>("");
  const [existingEmi, setExistingEmi] = useState<string>("");
  const [loanAmount, setLoanAmount] = useState<string>("");
  const [rate, setRate] = useState<string>("12");
  const [tenureYears, setTenureYears] = useState<string>("3");
  const [oneTimeExpense, setOneTimeExpense] = useState<string>("");

  const [emi, setEmi] = useState<number | null>(null);
  const [totalInterest, setTotalInterest] = useState<number | null>(null);
  const [totalPayable, setTotalPayable] = useState<number | null>(null);
  const [verdict, setVerdict] = useState<VerdictType>(null);
  const [note, setNote] = useState<string>("");

  // 🔁 Auto-populate from dashboard analysis (but only if fields are empty)
  useEffect(() => {
    if (!analysis) return;

    const inflow = analysis?.summary?.inflow ?? 0;
    const emiThisMonth = analysis?.emi?.this_month ?? 0;

    setIncome((prev) => (prev ? prev : inflow ? fmt(inflow) : ""));
    setExistingEmi((prev) =>
      prev ? prev : emiThisMonth ? fmt(emiThisMonth) : ""
    );
  }, [analysis]);

  const toNumber = (s: string) => {
    const clean = s.replace(/,/g, "").trim();
    const n = Number(clean);
    return isNaN(n) ? 0 : n;
  };

  const handleEvaluate = (e: React.FormEvent) => {
    e.preventDefault();

    const monthlyIncome = toNumber(income);
    const currentEmi = toNumber(existingEmi);
    const principal = toNumber(loanAmount);
    const annualRate = Number(rate) || 0;
    const years = Number(tenureYears) || 0;
    const upcoming = toNumber(oneTimeExpense);

    if (!monthlyIncome || !principal || !annualRate || !years) {
      setVerdict(null);
      setNote("Fill income, loan amount, interest rate and tenure to evaluate.");
      setEmi(null);
      setTotalInterest(null);
      setTotalPayable(null);
      return;
    }

    const months = years * 12;
    const monthlyRate = annualRate / 12 / 100;

    // EMI formula
    let emiValue: number;
    if (monthlyRate === 0) {
      emiValue = principal / months;
    } else {
      const factor = Math.pow(1 + monthlyRate, months);
      emiValue = (principal * monthlyRate * factor) / (factor - 1);
    }

    const totalPaid = emiValue * months;
    const interestPaid = totalPaid - principal;

    setEmi(emiValue);
    setTotalInterest(interestPaid);
    setTotalPayable(totalPaid);

    const totalEmiAfter = currentEmi + emiValue;
    const emiShare = (totalEmiAfter / monthlyIncome) * 100;

    let verdictResult: VerdictType = "comfortable";
    let verdictNote = "";

    if (emiShare <= 30) {
      verdictResult = "comfortable";
      verdictNote =
        "EMIs stay within ~30% of your income. This is usually considered comfortable if your job is stable.";
    } else if (emiShare <= 45) {
      verdictResult = "stretch";
      verdictNote =
        "Total EMIs will eat 30–45% of your income. Manageable, but you should control lifestyle spends and keep an emergency fund.";
    } else {
      verdictResult = "risky";
      verdictNote =
        "Total EMIs will cross 45% of your income. This is risky, especially if you have dependents or unstable income.";
    }

    if (upcoming > 0) {
      verdictNote +=
        " You also mentioned an upcoming one-time expense. Keep that in a separate buffer and avoid using credit to fund it fully.";
    }

    setVerdict(verdictResult);
    setNote(verdictNote);
  };

  const verdictLabel =
    verdict === "comfortable"
      ? "Comfortable"
      : verdict === "stretch"
      ? "Stretch"
      : verdict === "risky"
      ? "Risky"
      : "";

  const verdictColor =
    verdict === "comfortable"
      ? "text-emerald-300"
      : verdict === "stretch"
      ? "text-amber-300"
      : verdict === "risky"
      ? "text-rose-300"
      : "text-slate-300";

  return (
    /* …keep the rest of your JSX exactly as it is… */
  );
}
