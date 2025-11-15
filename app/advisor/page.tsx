"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useCashRaaga } from "../CashRaagaProvider";

const fmt = (n: number) =>
  n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

type VerdictType = "comfortable" | "stretch" | "risky" | null;

export default function AdvisorPage() {
  const { analysis } = useCashRaaga();

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

  // Auto-fill income & existing EMIs from dashboard analysis
  useEffect(() => {
    if (!analysis) return;

    const inflow = analysis?.summary?.inflow ?? 0;
    const emiThisMonth = analysis?.emi?.this_month ?? 0;

    setIncome((prev) => (prev || !inflow ? prev : fmt(inflow)));
    setExistingEmi((prev) =>
      prev || !emiThisMonth ? prev : fmt(emiThisMonth)
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

          <nav className="flex items-center gap-1 text-[11px] bg-slate-900/70 border border-slate-800 rounded-full px-1 py-0.5">
            <Link
              href="/"
              className="px-3 py-1 rounded-full hover:bg-slate-800 text-slate-400"
            >
              Dashboard
            </Link>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-200">
              Can I afford this?
            </span>
          </nav>
        </header>

        {/* Hero + form */}
        <section className="grid grid-cols-1 md:grid-cols-[1.15fr,1fr] gap-5 md:gap-6 items-start">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Can I afford this?
              </h2>
              <p className="mt-2 text-sm text-slate-400 max-w-md">
                Quickly sanity-check a new loan, big purchase, vacation or
                tuition fee. We&apos;ll estimate the EMI and show how hard it
                will hit your monthly cash-flow.
              </p>
            </div>

            <form
              onSubmit={handleEvaluate}
              className="rounded-2xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-sm p-4 md:p-5 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">
                    Monthly take-home income (₹)
                  </label>
                  <input
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    className="w-full rounded-xl bg-slate-950/60 border border-slate-700 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-400"
                    placeholder="e.g. 80,000"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">
                    Existing EMIs per month (₹)
                  </label>
                  <input
                    value={existingEmi}
                    onChange={(e) => setExistingEmi(e.target.value)}
                    className="w-full rounded-xl bg-slate-950/60 border border-slate-700 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-400"
                    placeholder="e.g. 15,000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">
                    Loan amount / cost (₹)
                  </label>
                  <input
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    className="w-full rounded-xl bg-slate-950/60 border border-slate-700 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-400"
                    placeholder="e.g. 7,00,000"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">
                    Interest rate (% p.a.)
                  </label>
                  <input
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full rounded-xl bg-slate-950/60 border border-slate-700 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-400"
                    placeholder="e.g. 12"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">
                    Tenure (years)
                  </label>
                  <input
                    value={tenureYears}
                    onChange={(e) => setTenureYears(e.target.value)}
                    className="w-full rounded-xl bg-slate-950/60 border border-slate-700 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-400"
                    placeholder="e.g. 3"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">
                  Upcoming one-time expense (optional, ₹)
                </label>
                <input
                  value={oneTimeExpense}
                  onChange={(e) => setOneTimeExpense(e.target.value)}
                  className="w-full rounded-xl bg-slate-950/60 border border-slate-700 px-3 py-2 text-xs text-slate-100 outline-none focus:border-emerald-400"
                  placeholder="e.g. 1,20,000 for vacation / fees"
                />
              </div>

              <button
                type="submit"
                className="mt-1 inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2 text-xs font-medium text-slate-950 hover:bg-emerald-400"
              >
                Check affordability
              </button>
            </form>
          </div>

          {/* Result card */}
          <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 p-4 md:p-5 flex flex-col gap-4">
            <p className="text-[11px] text-slate-400 uppercase tracking-wide">
              Result
            </p>

            {emi == null ? (
              <p className="text-xs text-slate-500">
                Fill in your income, existing EMIs and loan details, then hit
                &quot;Check affordability&quot; to see the impact on your
                monthly cash-flow.
              </p>
            ) : (
              <>
                <div className="space-y-1">
                  <p className="text-[11px] text-slate-400 mb-1">
                    Estimated EMI
                  </p>
                  <p className="text-2xl font-semibold text-emerald-300">
                    ₹{fmt(Math.round(emi))}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Total payable:{" "}
                    <span className="text-slate-100">
                      ₹{fmt(Math.round(totalPayable || 0))}
                    </span>{" "}
                    · Interest cost:{" "}
                    <span className="text-slate-100">
                      ₹{fmt(Math.round(totalInterest || 0))}
                    </span>
                  </p>
                </div>

                {verdict && (
                  <div className="space-y-1">
                    <p className="text-[11px] text-slate-400 mb-1">
                      Affordability verdict
                    </p>
                    <p className={`text-lg font-semibold ${verdictColor}`}>
                      {verdictLabel}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">{note}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
