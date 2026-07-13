"use client";

import Link from "next/link";
import { ArrowUpRight, RefreshCw, Users, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { readContract } from "@/lib/genlayer";
import type { Member, Report } from "@/lib/types";

export function OnchainList({ kind }: { kind: "members" | "reports" }) {
  const contract = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
  const [records, setRecords] = useState<(Member | Report)[]>([]);
  const [message, setMessage] = useState(contract ? "Loading contract state..." : "NeighborPeace V3 is awaiting deployment.");
  const [busy, setBusy] = useState(false);

  async function sync() {
    if (!contract) return;
    setBusy(true);
    const loaded = await loadRecords(contract, kind);
    if (loaded.error) setMessage(loaded.error);
    else {
      setRecords(loaded.records);
      setMessage(loaded.total === 0 ? `No ${kind} have been recorded on Contract V3 yet.` : `Synced ${loaded.records.length} ${kind} from Studionet.`);
    }
    setBusy(false);
  }

  useEffect(() => {
    if (!contract) return;
    let cancelled = false;
    void loadRecords(contract, kind).then((loaded) => {
      if (cancelled) return;
      if (loaded.error) setMessage(loaded.error);
      else {
        setRecords(loaded.records);
        setMessage(loaded.total === 0 ? `No ${kind} have been recorded on Contract V3 yet.` : `Synced ${loaded.records.length} ${kind} from Studionet.`);
      }
    });
    return () => { cancelled = true; };
  }, [contract, kind]);

  return (
    <div className="page-wrap pb-24">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-5"><span className="text-[var(--ink-soft)]">{message}</span><button className="button-secondary" onClick={sync} disabled={!contract || busy}><RefreshCw size={16} className={busy ? "animate-spin" : ""} /> Sync contract</button></div>
      {records.length === 0 ? <div className="empty-state">{kind === "members" ? <Users className="mx-auto" /> : <FileText className="mx-auto" />}<h2 className="display-font">Nothing fabricated here.</h2><p>This page only displays records returned by the deployed NeighborPeace V3 contract.</p><Link className="button-primary" href={kind === "members" ? "/join" : "/reports/new"}>{kind === "members" ? "Register the first unit" : "File the first report"}</Link></div> : <div className="record-list">{records.map((record) => kind === "members" ? <MemberRow key={(record as Member).member_id} member={record as Member} /> : <ReportRow key={(record as Report).report_id} report={record as Report} />)}</div>}
    </div>
  );
}

function MemberRow({ member }: { member: Member }) { return <div className="record-row"><strong>#{member.member_id}</strong><div><strong>{member.unit_name}</strong><div className="record-meta mt-1">{member.owner}</div></div><div><strong>{formatWei(member.bond)}</strong><div className="record-meta">real bonded value</div></div><div>{member.violations} violations</div><span /></div>; }
function ReportRow({ report }: { report: Report }) { return <Link href={`/reports/${report.report_id}`} className="record-row"><strong>#{report.report_id}</strong><div><strong>{report.violation_type}</strong><div className="record-meta mt-1">{report.incident_ref}</div></div><div>{report.status}</div><div>{report.confidence}% confidence</div><ArrowUpRight size={18} /></Link>; }

async function loadRecords(contract: string, kind: "members" | "reports") {
  const countFn = kind === "members" ? "get_member_count" : "get_report_count";
  const itemFn = kind === "members" ? "get_member" : "get_report";
  const count = await readContract(countFn, [], contract);
  if (!count.success) return { records: [] as (Member | Report)[], total: 0, error: count.error || "Contract read failed" };
  const total = Number(count.data || 0);
  const results = await Promise.all(Array.from({ length: total }, (_, id) => readContract(itemFn, [id], contract)));
  const records = results.flatMap((result) => { try { return result.success && typeof result.data === "string" ? [JSON.parse(result.data) as Member | Report] : []; } catch { return []; } });
  return { records, total, error: "" };
}

function formatWei(value: string) { const amount=BigInt(value||"0"); const whole=amount/BigInt("1000000000000000000"); const fraction=(amount%BigInt("1000000000000000000")).toString().padStart(18,"0").replace(/0+$/,""); return `${whole}${fraction?`.${fraction}`:""} GEN`; }
