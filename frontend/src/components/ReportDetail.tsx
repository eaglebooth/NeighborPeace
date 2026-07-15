"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { readContract } from "@/lib/genlayer";
import type { Report } from "@/lib/types";
import { useContractAddress } from "@/lib/contract-address";

export function ReportDetail({ id }: { id: string }) {
  const contract = useContractAddress();
  const [report, setReport] = useState<Report | null>(null);
  const [message, setMessage] = useState(contract ? "Loading report..." : "NeighborPeace V3 is not deployed yet.");

  async function sync() {
    if (!contract) return;
    const loaded = await loadReport(contract, id);
    if (loaded.error) setMessage(loaded.error);
    else { setReport(loaded.report); setMessage("Synced from NeighborPeace V3"); }
  }

  useEffect(() => {
    if (!contract) return;
    let cancelled = false;
    void loadReport(contract, id).then((loaded) => {
      if (cancelled) return;
      if (loaded.error) setMessage(loaded.error);
      else { setReport(loaded.report); setMessage("Synced from NeighborPeace V3"); }
    });
    return () => { cancelled = true; };
  }, [contract, id]);

  if (!report) return <div className="page-wrap pb-24"><div className="empty-state"><h2 className="display-font">Report #{id}</h2><p>{message}</p><button className="button-secondary" onClick={sync} disabled={!contract}><RefreshCw size={16}/> Sync report</button></div></div>;

  const actions = [
    ["AWAITING_RESPONSE", "Submit response", `/reports/${id}/respond`],
    ["AWAITING_RESPONSE", "Waive counter-evidence", `/reports/${id}/close-response`],
    ["READY_FOR_REVIEW", "Run first jury", `/reports/${id}/review`],
    ["NEEDS_EVIDENCE", "Replace case evidence", `/reports/${id}/evidence`],
    ["RULING_PROPOSED", "Open appeal", `/reports/${id}/appeal`],
    ["APPEAL_PENDING", "Run appeal jury", `/reports/${id}/appeal/review`],
    ["RULING_PROPOSED", "Finalize ruling", `/reports/${id}/finalize`],
    ["APPEAL_RULING", "Finalize appeal ruling", `/reports/${id}/finalize`],
  ].filter(([status]) => status === report.status);

  const facts = [
    ["Incident reference", report.incident_ref],
    ["Reporter / accused", `Member ${report.reporter_id} / Member ${report.target_id}`],
    ["Verdict", report.verdict],
    ["Confidence", `${report.confidence}%`],
    ["Proposed fine", formatWei(report.fine)],
    ["Compensation", formatWei(report.compensation)],
    ["Treasury fee", formatWei(report.treasury_fee)],
    ["Policy version", report.policy_version],
    ["Evidence revisions", `${report.evidence_revisions} / 2`],
    ["Response deadline", formatTimestamp(report.response_deadline)],
    ["Appeal deadline", formatTimestamp(report.appeal_deadline)],
  ];

  return <div className="page-wrap pb-24"><div className="grid lg:grid-cols-[.72fr_1.28fr] gap-14"><aside><span className="status-pill"><span className="status-dot live"/>{report.status}</span><h2 className="display-font text-5xl my-5">{report.violation_type}</h2><p className="text-[var(--ink-soft)] leading-7">{report.reason}</p><div className="mt-8 grid gap-3">{actions.map(([,label,href])=><Link key={href} href={href} className={label.includes("Finalize") ? "button-danger" : "button-primary"}>{label}<ArrowRight size={16}/></Link>)}</div></aside><div className="border-t border-[var(--line)]">{facts.map(([label,value])=><div key={label} className="grid grid-cols-[160px_1fr] gap-6 py-5 border-b border-[var(--line)]"><span className="record-meta">{label}</span><strong>{value}</strong></div>)}{[["Complaint evidence",report.evidence_url],["Response evidence",report.response_url],["Appeal evidence",report.appeal_url]].filter(([,url])=>url).map(([label,url])=><a key={label} target="_blank" rel="noreferrer" href={url} className="grid grid-cols-[160px_1fr_auto] gap-6 py-5 border-b border-[var(--line)]"><span className="record-meta">{label}</span><span className="truncate">{url}</span><ExternalLink size={16}/></a>)}</div></div></div>;
}

async function loadReport(contract: string, id: string): Promise<{ report: Report | null; error: string }> {
  const result = await readContract("get_report", [Number(id)], contract);
  if (!result.success || typeof result.data !== "string") return { report: null, error: result.error || "Report read failed" };
  try {
    const parsed = JSON.parse(result.data) as Report & { error?: string };
    return parsed.error ? { report: null, error: parsed.error } : { report: parsed, error: "" };
  } catch {
    return { report: null, error: "The contract returned malformed report data." };
  }
}

function formatWei(value: string) {
  const amount = BigInt(value || "0");
  const whole = amount / BigInt("1000000000000000000");
  const fraction = (amount % BigInt("1000000000000000000")).toString().padStart(18, "0").replace(/0+$/, "");
  return `${whole}${fraction ? `.${fraction}` : ""} GEN`;
}

function formatTimestamp(value: string) {
  const seconds = Number(value || "0");
  return seconds > 0 ? new Date(seconds * 1000).toLocaleString() : "Not opened";
}
