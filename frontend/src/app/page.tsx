"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  Scale,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Volume2,
  Trash2,
  Coins,
  Loader2,
  RefreshCw,
  FileText,
  Activity,
  UserCheck,
  Wallet
} from "lucide-react";
import { useState, useEffect } from "react";
import { connectWallet, readContract, writeContract } from "@/lib/genlayer";

type LogEntry = {
  label: string;
  value: string;
  tone: "ok" | "warn" | "bad" | "idle";
};

type ResidentUnit = {
  member_id: string;
  unit_name: string;
  owner: string;
  bond: string;
  violations: string;
};

type IncidentReport = {
  report_id: string;
  reporter_id: string;
  target_id: string;
  violation_type: "NOISE" | "LITTER";
  evidence_url: string;
  status: "PENDING" | "GUILTY" | "NOT_GUILTY" | "DISMISSED";
  reason: string;
  confidence: string;
};

export default function Home() {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
  const networkName = process.env.NEXT_PUBLIC_NETWORK || "studionet";
  const contractConfigured = contractAddress.length > 10;

  // States
  const [wallet, setWallet] = useState<string>("");
  const [busy, setBusy] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"report" | "register" | "topup">("report");
  const [listTab, setListTab] = useState<"cases" | "residents">("cases");

  // Global counts
  const [counts, setCounts] = useState({
    members: "0",
    reports: "0",
    treasury: "0",
  });

  // Mocks/Real Lists
  const [residents, setResidents] = useState<ResidentUnit[]>([
    { member_id: "0", unit_name: "Unit 102", owner: "0x7099...8973", bond: "100", violations: "0" },
    { member_id: "1", unit_name: "Unit 105", owner: "0x3C44...3C89", bond: "40", violations: "1" },
    { member_id: "2", unit_name: "Unit 201", owner: "0x90F7...A321", bond: "150", violations: "0" },
  ]);

  const [reports, setReports] = useState<IncidentReport[]>([
    {
      report_id: "0",
      reporter_id: "0",
      target_id: "1",
      violation_type: "NOISE",
      evidence_url: "https://gist.githubusercontent.com/example/noise-decibels-log.txt",
      status: "GUILTY",
      reason: "Audio recording confirms noise exceeded 84dB (limit is 70dB) at 11:24 PM on weeknight.",
      confidence: "92",
    },
    {
      report_id: "1",
      reporter_id: "2",
      target_id: "1",
      violation_type: "LITTER",
      evidence_url: "https://gist.githubusercontent.com/example/trash-photo-proof.html",
      status: "PENDING",
      reason: "Report filed. Awaiting subjective AI adjudication.",
      confidence: "0",
    },
  ]);

  const [logs, setLogs] = useState<LogEntry[]>([
    {
      label: "System",
      value: contractConfigured
        ? `NeighborPeace active. Connected to ${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)} on ${networkName}.`
        : "Demo mode active. Add NEXT_PUBLIC_CONTRACT_ADDRESS to enable real contract operations.",
      tone: contractConfigured ? "ok" : "warn",
    },
  ]);

  // Form States
  const [regForm, setRegForm] = useState({
    unitName: "Unit 304",
    initialDeposit: "100",
  });

  const [reportForm, setReportForm] = useState({
    reporterId: "0",
    targetId: "1",
    violationType: "NOISE" as "NOISE" | "LITTER",
    evidenceUrl: "https://gist.githubusercontent.com/sample-evidence/noise-log-304.txt",
  });

  const [topupForm, setTopupForm] = useState({
    memberId: "1",
    amount: "50",
  });

  function pushLog(entry: LogEntry) {
    setLogs((current) => [entry, ...current].slice(0, 4));
  }

  // Wallet Connect
  async function handleWallet() {
    setBusy("wallet");
    const result = await connectWallet();
    if (result.success && typeof result.data === "string") {
      setWallet(result.data);
      pushLog({ label: "Wallet Connected", value: result.data, tone: "ok" });
    } else {
      pushLog({ label: "Wallet Error", value: result.error || "No wallet found", tone: "warn" });
    }
    setBusy("");
  }

  // Sync Contract State
  async function syncState() {
    if (!contractConfigured) {
      pushLog({ label: "Demo Mode", value: "Synchronization simulated in demo mode.", tone: "idle" });
      return;
    }
    setBusy("sync");
    try {
      const [mCountRes, rCountRes, tBalRes] = await Promise.all([
        readContract("get_member_count"),
        readContract("get_report_count"),
        readContract("get_treasury_balance"),
      ]);

      if (!mCountRes.success || !rCountRes.success || !tBalRes.success) {
        pushLog({ label: "Sync Fail", value: "Failed to read state from RPC endpoint", tone: "warn" });
        return;
      }

      const mCount = Number(mCountRes.data);
      const rCount = Number(rCountRes.data);
      const tBal = Number(tBalRes.data);

      setCounts({
        members: String(mCount),
        reports: String(rCount),
        treasury: String(tBal),
      });

      // Load members
      const memberReqs = [];
      for (let i = 0; i < mCount; i++) {
        memberReqs.push(readContract("get_member", [i]));
      }
      const memberResults = await Promise.all(memberReqs);
      const fetchedResidents: ResidentUnit[] = [];
      memberResults.forEach((res) => {
        if (res.success && res.data) {
          const parsed = JSON.parse(res.data as string);
          fetchedResidents.push(parsed);
        }
      });
      if (fetchedResidents.length > 0) {
        setResidents(fetchedResidents);
      }

      // Load reports
      const reportReqs = [];
      for (let i = 0; i < rCount; i++) {
        reportReqs.push(readContract("get_report", [i]));
      }
      const reportResults = await Promise.all(reportReqs);
      const fetchedReports: IncidentReport[] = [];
      reportResults.forEach((res) => {
        if (res.success && res.data) {
          const parsed = JSON.parse(res.data as string);
          fetchedReports.push(parsed);
        }
      });
      if (fetchedReports.length > 0) {
        setReports(fetchedReports);
      }

      pushLog({
        label: "Sync Success",
        value: `Fetched ${mCount} residents, ${rCount} reports. Community Treasury balance: ${tBal} mockUSDC.`,
        tone: "ok",
      });
    } catch (e) {
      pushLog({ label: "Sync Error", value: e instanceof Error ? e.message : "Unknown error", tone: "bad" });
    } finally {
      setBusy("");
    }
  }

  useEffect(() => {
    if (contractConfigured) {
      syncState();
    }
  }, []);

  // Write Actions
  async function registerUnit() {
    setBusy("register");
    const deposit = Number(regForm.initialDeposit);
    if (!contractConfigured) {
      // Mock action
      const newId = String(residents.length);
      const newRes: ResidentUnit = {
        member_id: newId,
        unit_name: regForm.unitName,
        owner: wallet || "0xMockUserWallet",
        bond: String(deposit),
        violations: "0",
      };
      setResidents([...residents, newRes]);
      setCounts((curr) => ({ ...curr, members: String(residents.length + 1) }));
      pushLog({ label: "Demo Register", value: `Registered ${regForm.unitName} with ${deposit} USDC bond.`, tone: "ok" });
      setBusy("");
      return;
    }

    try {
      const result = await writeContract("register_unit", [regForm.unitName, wallet, deposit]);
      pushLog({
        label: "Register Transaction",
        value: result.success ? `Success: ${String(result.data ?? result.hash)}` : result.error || "Failed",
        tone: result.success ? "ok" : "bad",
      });
      if (result.success) {
        await syncState();
      }
    } catch (e) {
      pushLog({ label: "Register Error", value: e instanceof Error ? e.message : "Error", tone: "bad" });
    } finally {
      setBusy("");
    }
  }

  async function fileReport() {
    setBusy("report");
    const reporterId = Number(reportForm.reporterId);
    const targetId = Number(reportForm.targetId);

    if (!contractConfigured) {
      // Mock action
      const newId = String(reports.length);
      const newRep: IncidentReport = {
        report_id: newId,
        reporter_id: String(reporterId),
        target_id: String(targetId),
        violation_type: reportForm.violationType,
        evidence_url: reportForm.evidenceUrl,
        status: "PENDING",
        reason: "Report filed. Awaiting subjective AI adjudication.",
        confidence: "0",
      };
      setReports([...reports, newRep]);
      setCounts((curr) => ({ ...curr, reports: String(reports.length + 1) }));
      pushLog({ label: "Demo File", value: `Filed noise report against unit ${residents[targetId]?.unit_name || targetId}`, tone: "ok" });
      setBusy("");
      return;
    }

    try {
      const result = await writeContract("file_report", [
        reporterId,
        targetId,
        reportForm.violationType,
        reportForm.evidenceUrl,
      ]);
      pushLog({
        label: "Dispute Filed",
        value: result.success ? `Report ID ${result.data} created.` : result.error || "Failed",
        tone: result.success ? "ok" : "bad",
      });
      if (result.success) {
        await syncState();
      }
    } catch (e) {
      pushLog({ label: "File Error", value: e instanceof Error ? e.message : "Error", tone: "bad" });
    } finally {
      setBusy("");
    }
  }

  async function evaluateReport(reportId: string) {
    setBusy(`evaluate-${reportId}`);
    if (!contractConfigured) {
      // Mock evaluation
      const updated = reports.map((r) => {
        if (r.report_id === reportId) {
          const isNoise = r.violation_type === "NOISE";
          return {
            ...r,
            status: "GUILTY" as const,
            confidence: "88",
            reason: isNoise
              ? "AI JURY VERDICT: Guilty. Audio stream analysis shows decibel peaks of 74dB occurring at 11:42 PM, which violates the 70dB neighborhood night limit."
              : "AI JURY VERDICT: Guilty. Image audit shows a large cardboard box clearly labeled with Unit 105 dumped in the communal stairwell.",
          };
        }
        return r;
      });

      // Update mock offender bond
      const rep = reports.find((r) => r.report_id === reportId);
      if (rep) {
        const offenderId = rep.target_id;
        const complainantId = rep.reporter_id;
        const newResidents = residents.map((res) => {
          if (res.member_id === offenderId) {
            return { ...res, bond: String(Math.max(0, Number(res.bond) - 50)), violations: String(Number(res.violations) + 1) };
          }
          if (res.member_id === complainantId) {
            return { ...res, bond: String(Number(res.bond) + 40) };
          }
          return res;
        });
        setResidents(newResidents);
        setCounts((curr) => ({ ...curr, treasury: String(Number(curr.treasury) + 10) }));
      }

      setReports(updated);
      pushLog({ label: "Demo Adjudicate", value: `Report #${reportId} evaluated: GUILTY.`, tone: "ok" });
      setBusy("");
      return;
    }

    try {
      const result = await writeContract("evaluate_report", [Number(reportId)]);
      pushLog({
        label: "AI Verdict Output",
        value: result.success ? `Consensus achieved: ${String(result.data)}` : result.error || "Failed",
        tone: result.success ? "ok" : "bad",
      });
      if (result.success) {
        await syncState();
      }
    } catch (e) {
      pushLog({ label: "Verdict Error", value: e instanceof Error ? e.message : "Error", tone: "bad" });
    } finally {
      setBusy("");
    }
  }

  async function topupBond() {
    setBusy("topup");
    const mId = Number(topupForm.memberId);
    const amount = Number(topupForm.amount);

    if (!contractConfigured) {
      // Mock top-up
      const updated = residents.map((r) => {
        if (r.member_id === String(mId)) {
          return { ...r, bond: String(Number(r.bond) + amount) };
        }
        return r;
      });
      setResidents(updated);
      pushLog({ label: "Demo Topup", value: `Topped up unit ${residents[mId]?.unit_name} bond by ${amount} USDC.`, tone: "ok" });
      setBusy("");
      return;
    }

    try {
      const result = await writeContract("deposit_bond", [mId, amount]);
      pushLog({
        label: "Top-up Tx",
        value: result.success ? `Funded: ${String(result.data ?? result.hash)}` : result.error || "Failed",
        tone: result.success ? "ok" : "bad",
      });
      if (result.success) {
        await syncState();
      }
    } catch (e) {
      pushLog({ label: "Top-up Error", value: e instanceof Error ? e.message : "Error", tone: "bad" });
    } finally {
      setBusy("");
    }
  }

  // Helper styles
  const toneClass = (tone: LogEntry["tone"]) => {
    switch (tone) {
      case "ok":
        return "bg-[#0c2f21] border-[#00f6a2]/25 text-[#00f6a2]";
      case "warn":
        return "bg-[#33220f] border-amber-500/20 text-amber-300";
      case "bad":
        return "bg-[#2d1212] border-red-500/20 text-red-400";
      default:
        return "bg-[#111a17] border-white/5 text-[#91a6a0]";
    }
  };

  return (
    <main className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-7xl flex-col gap-6">
        
        {/* Navigation & Wallet */}
        <nav className="mint-card flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-[#00F6A2]/10 border border-[#00F6A2]/30 text-[#00F6A2]">
              <Scale size={20} />
            </div>
            <div>
              <div className="font-bold tracking-tight text-white text-base">NeighborPeace</div>
              <div className="text-xs text-[var(--muted)]">Community Escrow Arbitration</div>
            </div>
          </div>
          <button
            onClick={handleWallet}
            className="mint-btn-secondary flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-semibold"
          >
            {busy === "wallet" ? <Loader2 className="animate-spin" size={14} /> : <Wallet size={14} />}
            {wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : "Connect Wallet"}
          </button>
        </nav>

        {/* Global Dashboard Metrics */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="mint-card p-5">
            <div className="flex items-center justify-between text-[var(--muted)]">
              <span className="text-xs font-semibold uppercase tracking-wider">Registered Units</span>
              <UserCheck size={16} className="text-[#00F6A2]" />
            </div>
            <div className="mt-2 text-3xl font-extrabold tracking-tight text-white">{counts.members}</div>
            <div className="mt-1 text-[10px] text-[#00F6A2]/80">Active civic bonds locked</div>
          </div>
          
          <div className="mint-card p-5">
            <div className="flex items-center justify-between text-[var(--muted)]">
              <span className="text-xs font-semibold uppercase tracking-wider">Report Files</span>
              <FileText size={16} className="text-[#00F6A2]" />
            </div>
            <div className="mt-2 text-3xl font-extrabold tracking-tight text-white">{counts.reports}</div>
            <div className="mt-1 text-[10px] text-[#00F6A2]/80">Noise & trash complaints</div>
          </div>

          <div className="mint-card p-5">
            <div className="flex items-center justify-between text-[var(--muted)]">
              <span className="text-xs font-semibold uppercase tracking-wider">Treasury Hold</span>
              <Coins size={16} className="text-[#00F6A2]" />
            </div>
            <div className="mt-2 text-3xl font-extrabold tracking-tight text-white">{counts.treasury} <span className="text-sm font-semibold">USDC</span></div>
            <div className="mt-1 text-[10px] text-amber-400">Neighborhood reserve fund</div>
          </div>

          <div className="mint-card p-5">
            <div className="flex items-center justify-between text-[var(--muted)]">
              <span className="text-xs font-semibold uppercase tracking-wider">Jury Status</span>
              <span className="status-dot status-dot-active" />
            </div>
            <div className="mt-2 text-lg font-bold text-white uppercase tracking-wider">Subjective AI</div>
            <div className="mt-1.5 text-[10px] text-[var(--muted)]">Consensus protocol active</div>
          </div>
        </section>

        {/* Dashboard Core Layout */}
        <section className="grid flex-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
          
          {/* Left Block - Court Dossiers */}
          <div className="mint-card flex flex-col p-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setListTab("cases")}
                  className={`pb-1 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${listTab === "cases" ? "text-[#00F6A2] border-[#00F6A2]" : "text-[var(--muted)] border-transparent hover:text-white"}`}
                >
                  Active Disputes
                </button>
                <button
                  onClick={() => setListTab("residents")}
                  className={`pb-1 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${listTab === "residents" ? "text-[#00F6A2] border-[#00F6A2]" : "text-[var(--muted)] border-transparent hover:text-white"}`}
                >
                  Neighborhood Registry
                </button>
              </div>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Greenwood Heights</span>
            </div>

            {/* List Tab: Cases */}
            {listTab === "cases" && (
              <div className="flex-1 mt-5 space-y-4">
                {reports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-[var(--muted)]">
                    <Activity size={32} className="opacity-40" />
                    <span className="mt-3 text-sm">No neighborhood disputes logged yet.</span>
                  </div>
                ) : (
                  reports.map((rep) => {
                    const reporterUnit = residents.find((r) => r.member_id === rep.reporter_id)?.unit_name || `Unit ID ${rep.reporter_id}`;
                    const targetUnit = residents.find((r) => r.member_id === rep.target_id)?.unit_name || `Unit ID ${rep.target_id}`;
                    const isPending = rep.status === "PENDING";
                    const isGuilty = rep.status === "GUILTY";

                    return (
                      <div key={rep.report_id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 transition hover:bg-white/[0.04]">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#00F6A2] bg-[#00F6A2]/5 border border-[#00F6A2]/20 px-2 py-0.5 rounded-md">
                              CASE #{rep.report_id}
                            </span>
                            <span className="text-xs text-[var(--muted)] flex items-center gap-1">
                              {rep.violation_type === "NOISE" ? <Volume2 size={13} /> : <Trash2 size={13} />}
                              {rep.violation_type} violation
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${isPending ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : isGuilty ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-emerald-500/10 border-emerald-500/30 text-[#00F6A2]"}`}>
                            {rep.status}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-2 sm:grid-cols-2 text-sm">
                          <div>
                            <span className="text-xs text-[var(--muted)]">Complainant:</span>
                            <div className="font-semibold text-white mt-0.5">{reporterUnit}</div>
                          </div>
                          <div>
                            <span className="text-xs text-[var(--muted)]">Accused Offender:</span>
                            <div className="font-semibold text-white mt-0.5">{targetUnit}</div>
                          </div>
                        </div>

                        <div className="mt-3 text-xs">
                          <span className="text-[var(--muted)]">Evidence URL:</span>
                          <a href={rep.evidence_url} target="_blank" rel="noopener noreferrer" className="block text-[#00F6A2] hover:underline mt-0.5 break-all">
                            {rep.evidence_url}
                          </a>
                        </div>

                        <div className="mt-3 rounded-lg bg-black/40 border border-white/5 p-3">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-white/50">Subjective Arbitrator Verdict</div>
                          <p className="mt-1.5 text-xs text-white/80 leading-relaxed">{rep.reason}</p>
                          {Number(rep.confidence) > 0 && (
                            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[var(--muted)]">
                              <span className="font-bold text-[#00F6A2]">AI Confidence:</span> {rep.confidence}% consensus achieved
                            </div>
                          )}
                        </div>

                        {isPending && (
                          <div className="mt-4 flex justify-end">
                            <button
                              onClick={() => evaluateReport(rep.report_id)}
                              disabled={Boolean(busy)}
                              className="mint-btn-primary flex h-9 items-center gap-1.5 rounded-lg px-4 text-xs"
                            >
                              {busy === `evaluate-${rep.report_id}` ? (
                                <>
                                  <Loader2 className="animate-spin" size={13} /> Evaluating...
                                </>
                              ) : (
                                <>
                                  <Scale size={13} /> Launch AI Adjudication
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* List Tab: Residents */}
            {listTab === "residents" && (
              <div className="flex-1 mt-5 space-y-3">
                {residents.map((res) => {
                  const bondVal = Number(res.bond);
                  const isLow = bondVal < 50;

                  return (
                    <div key={res.member_id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.01] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid size-9 place-items-center rounded-lg bg-white/5 text-white/70 text-sm font-bold">
                          #{res.member_id}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{res.unit_name}</div>
                          <div className="text-[10px] text-[var(--muted)] mt-0.5 truncate max-w-[12rem] sm:max-w-xs">{res.owner}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Escrow Bond</span>
                          <div className={`text-sm font-bold ${isLow ? "text-amber-400" : "text-white"}`}>
                            {res.bond} USDC
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Incidents</span>
                          <div className="text-xs font-bold text-white">{res.violations} violations</div>
                        </div>

                        <div className="flex items-center">
                          {isLow ? (
                            <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                              <AlertTriangle size={10} /> Topup Required
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] text-[#00F6A2] bg-[#00F6A2]/5 border border-[#00F6A2]/20 px-2 py-0.5 rounded-full">
                              <ShieldCheck size={10} /> Bond Secured
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Block - Civic Actions Card */}
          <div className="flex flex-col gap-6">
            
            {/* Action Card Tabs */}
            <div className="mint-card p-5">
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-black/40 p-1">
                <button
                  onClick={() => setActiveTab("report")}
                  className={`flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "report" ? "bg-[#00F6A2] text-[#030605]" : "text-[var(--muted)] hover:text-white"}`}
                >
                  <ShieldAlert size={13} /> Report
                </button>
                <button
                  onClick={() => setActiveTab("register")}
                  className={`flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "register" ? "bg-[#00F6A2] text-[#030605]" : "text-[var(--muted)] hover:text-white"}`}
                >
                  <UserPlus size={13} /> Join
                </button>
                <button
                  onClick={() => setActiveTab("topup")}
                  className={`flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "topup" ? "bg-[#00F6A2] text-[#030605]" : "text-[var(--muted)] hover:text-white"}`}
                >
                  <Coins size={13} /> Fund
                </button>
              </div>

              {/* Form Tab: File Report */}
              {activeTab === "report" && (
                <div className="mt-5 space-y-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-white/70">File Noise or Trash Complaint</div>
                  
                  <div>
                    <label className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Your Unit (Complainant)</label>
                    <select
                      value={reportForm.reporterId}
                      onChange={(e) => setReportForm({ ...reportForm, reporterId: e.target.value })}
                      className="mint-input h-10 px-3 mt-1.5 cursor-pointer text-sm"
                    >
                      {residents.map((r) => (
                        <option key={r.member_id} value={r.member_id} className="bg-[#090f0d] text-white">
                          {r.unit_name} ({r.owner.slice(0, 6)}...{r.owner.slice(-4)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Offending Unit (Accused)</label>
                    <select
                      value={reportForm.targetId}
                      onChange={(e) => setReportForm({ ...reportForm, targetId: e.target.value })}
                      className="mint-input h-10 px-3 mt-1.5 cursor-pointer text-sm"
                    >
                      {residents.map((r) => (
                        <option key={r.member_id} value={r.member_id} className="bg-[#090f0d] text-white">
                          {r.unit_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Violation Type</label>
                    <div className="grid grid-cols-2 gap-2 mt-1.5">
                      <button
                        onClick={() => setReportForm({ ...reportForm, violationType: "NOISE" })}
                        className={`flex h-10 items-center justify-center gap-1.5 rounded-lg border text-xs font-bold transition-all ${reportForm.violationType === "NOISE" ? "border-[#00F6A2] bg-[#00F6A2]/5 text-[#00F6A2]" : "border-white/5 bg-white/[0.01] text-[var(--muted)] hover:text-white"}`}
                      >
                        <Volume2 size={14} /> Noise (after 10 PM)
                      </button>
                      <button
                        onClick={() => setReportForm({ ...reportForm, violationType: "LITTER" })}
                        className={`flex h-10 items-center justify-center gap-1.5 rounded-lg border text-xs font-bold transition-all ${reportForm.violationType === "LITTER" ? "border-[#00F6A2] bg-[#00F6A2]/5 text-[#00F6A2]" : "border-white/5 bg-white/[0.01] text-[var(--muted)] hover:text-white"}`}
                      >
                        <Trash2 size={14} /> Litter / Garbage
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Public Evidence URL</label>
                    <input
                      type="text"
                      value={reportForm.evidenceUrl}
                      onChange={(e) => setReportForm({ ...reportForm, evidenceUrl: e.target.value })}
                      className="mint-input h-10 px-3 mt-1.5 text-sm"
                    />
                  </div>

                  <button
                    onClick={fileReport}
                    disabled={Boolean(busy)}
                    className="mint-btn-primary flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold"
                  >
                    {busy === "report" ? <Loader2 className="animate-spin" size={15} /> : <FileText size={15} />}
                    File Incident Dispute
                  </button>
                </div>
              )}

              {/* Form Tab: Join / Register */}
              {activeTab === "register" && (
                <div className="mt-5 space-y-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-white/70">Register New Unit Membership</div>

                  <div>
                    <label className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Unit Name / Code</label>
                    <input
                      type="text"
                      value={regForm.unitName}
                      onChange={(e) => setRegForm({ ...regForm, unitName: e.target.value })}
                      className="mint-input h-10 px-3 mt-1.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Initial Security Bond (Min 50 USDC)</label>
                    <input
                      type="number"
                      value={regForm.initialDeposit}
                      onChange={(e) => setRegForm({ ...regForm, initialDeposit: e.target.value })}
                      className="mint-input h-10 px-3 mt-1.5 text-sm"
                    />
                  </div>

                  <button
                    onClick={registerUnit}
                    disabled={Boolean(busy)}
                    className="mint-btn-primary flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold"
                  >
                    {busy === "register" ? <Loader2 className="animate-spin" size={15} /> : <UserPlus size={15} />}
                    Lock Escrow & Join Community
                  </button>
                </div>
              )}

              {/* Form Tab: Topup Fund */}
              {activeTab === "topup" && (
                <div className="mt-5 space-y-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-white/70">Deposit Escrow Top-up</div>

                  <div>
                    <label className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Target Resident Unit</label>
                    <select
                      value={topupForm.memberId}
                      onChange={(e) => setTopupForm({ ...topupForm, memberId: e.target.value })}
                      className="mint-input h-10 px-3 mt-1.5 cursor-pointer text-sm"
                    >
                      {residents.map((r) => (
                        <option key={r.member_id} value={r.member_id} className="bg-[#090f0d] text-white">
                          {r.unit_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Amount to Top-up (USDC)</label>
                    <input
                      type="number"
                      value={topupForm.amount}
                      onChange={(e) => setTopupForm({ ...topupForm, amount: e.target.value })}
                      className="mint-input h-10 px-3 mt-1.5 text-sm"
                    />
                  </div>

                  <button
                    onClick={topupBond}
                    disabled={Boolean(busy)}
                    className="mint-btn-primary flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold"
                  >
                    {busy === "topup" ? <Loader2 className="animate-spin" size={15} /> : <Coins size={15} />}
                    Top-up Escrow Account
                  </button>
                </div>
              )}
            </div>

            {/* Neighborhood Telemetry Card */}
            <div className="mint-card flex flex-col p-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Dapp Telemetry Logs</span>
                <button
                  onClick={syncState}
                  disabled={Boolean(busy)}
                  className="inline-flex h-7 items-center justify-center gap-1.5 rounded-full border border-[#00F6A2]/20 bg-[#00F6A2]/5 hover:bg-[#00F6A2]/10 px-3 text-[10px] font-bold uppercase tracking-wider text-[#00F6A2] transition-all disabled:opacity-50"
                >
                  <RefreshCw size={10} className={busy === "sync" ? "animate-spin" : ""} />
                  {busy === "sync" ? "Syncing..." : "Sync"}
                </button>
              </div>

              <div className="mt-3.5 space-y-2">
                {logs.map((entry, index) => (
                  <div key={index} className={`rounded-xl border px-3.5 py-2.5 text-xs transition-all ${toneClass(entry.tone)}`}>
                    <div className="font-semibold text-[10px] uppercase tracking-wider mb-1 opacity-70">
                      {entry.label}
                    </div>
                    <div className="font-medium leading-relaxed">{entry.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
