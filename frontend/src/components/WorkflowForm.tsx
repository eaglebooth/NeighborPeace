"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { readContract, writeContract } from "@/lib/genlayer";
import { useWallet } from "./WalletProvider";
import { ActionResult } from "./ActionResult";
import type { ActionState } from "@/lib/types";
import { useContractAddress } from "@/lib/contract-address";

type Mode = "join" | "bond" | "report" | "respond" | "close" | "evidence" | "review" | "appeal" | "appeal-review" | "finalize";

const copy: Record<Mode, { title: string; button: string; functionName: string }> = {
  join: { title: "Register your unit", button: "Register unit", functionName: "register_unit" },
  bond: { title: "Add to your bond ledger", button: "Add bond", functionName: "deposit_bond" },
  report: { title: "File an incident", button: "File report", functionName: "file_report" },
  respond: { title: "Submit counter-evidence", button: "Submit response", functionName: "submit_response" },
  close: { title: "Waive your response", button: "Waive counter-evidence", functionName: "close_response_window" },
  evidence: { title: "Replace unreadable evidence", button: "Resubmit evidence", functionName: "resubmit_evidence" },
  review: { title: "Request the first jury review", button: "Run AI review", functionName: "evaluate_report" },
  appeal: { title: "Open the single appeal", button: "Open appeal", functionName: "appeal_report" },
  "appeal-review": { title: "Request appeal review", button: "Run appeal jury", functionName: "evaluate_appeal" },
  finalize: { title: "Finalize the ruling", button: "Finalize settlement", functionName: "finalize_report" },
};

export function WorkflowForm({ mode, reportId }: { mode: Mode; reportId?: string }) {
  const contract = useContractAddress();
  const { address, connect } = useWallet();
  const [values, setValues] = useState({ unit: "", bond: "50", member: "", reporter: "", target: "", type: "NOISE", evidence: "", incident: "", incidentKey: "", report: reportId || "", response: "", appeal: "" });
  const [state, setState] = useState<ActionState>({ tone: "idle", message: "" });
  const config = copy[mode];

  const args = useMemo(() => {
    if (mode === "join") return [values.unit];
    if (mode === "bond") return [BigInt(values.member || "0")];
    if (mode === "report") return [BigInt(values.reporter || "0"), BigInt(values.target || "0"), values.type, values.evidence, values.incident, BigInt(values.incidentKey || "0")];
    if (mode === "respond") return [BigInt(values.report || "0"), values.response];
    if (mode === "evidence") return [BigInt(values.report || "0"), values.evidence];
    if (mode === "appeal") return [BigInt(values.report || "0"), values.appeal];
    return [BigInt(values.report || "0")];
  }, [mode, values]);

  function update(key: keyof typeof values, value: string) { setValues((current) => ({ ...current, [key]: value })); }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!address) { await connect(); return; }
    if (!contract) { setState({ tone: "error", message: "NeighborPeace V3 has not been deployed yet. Add the new contract address after Studio deployment." }); return; }
    setState({ tone: "busy", message: "Confirm in your wallet. GenLayer consensus may take a few moments." });
    let value = BigInt(0);
    try {
      if (mode === "join" || mode === "bond") value = genToWei(values.bond);
    } catch {
      setState({ tone: "error", message: "Enter a valid GEN amount with no more than 18 decimal places." });
      return;
    }
    const result = await writeContract(config.functionName, args, contract, value);
    if (result.success) {
      const check = await readContract("get_contract_state", [], contract);
      const verified = check.success ? " Contract state was read back successfully." : " Transaction finalized, but state refresh failed.";
      setState({ tone: "success", message: `${String(result.data ?? result.status ?? "Finalized")}.${verified}`, hash: result.hash });
    }
    else setState({ tone: "error", message: result.error || "Contract call failed", hash: result.hash });
  }

  return (
    <form className="form-panel" onSubmit={submit}>
      <div className="flex items-center gap-3 pb-5 border-b border-[var(--line)]"><CheckCircle2 size={20} /><strong>{config.title}</strong></div>
      {mode === "join" && <><Field label="Unit name" hint="Use the official unit identifier used by your community."><input className="input" value={values.unit} onChange={(e) => update("unit", e.target.value)} placeholder="Apartment 4B" required /></Field><Field label="Initial bond (GEN)" hint="Minimum 20 GEN. This value is transferred to and held by the contract."><input className="input" type="number" min="20" step="0.000000000000000001" value={values.bond} onChange={(e) => update("bond", e.target.value)} required /></Field></>}
      {mode === "bond" && <><Field label="Your member ID"><input className="input" type="number" min="0" value={values.member} onChange={(e) => update("member", e.target.value)} required /></Field><Field label="Additional bond (GEN)" hint="Only the registered owner can send GEN into this member bond."><input className="input" type="number" min="0.000000000000000001" step="0.000000000000000001" value={values.bond} onChange={(e) => update("bond", e.target.value)} required /></Field></>}
      {mode === "report" && <><div className="form-grid"><Field label="Your member ID"><input className="input" type="number" min="0" value={values.reporter} onChange={(e) => update("reporter", e.target.value)} required /></Field><Field label="Accused member ID"><input className="input" type="number" min="0" value={values.target} onChange={(e) => update("target", e.target.value)} required /></Field></div><Field label="Violation type"><select className="select" value={values.type} onChange={(e) => update("type", e.target.value)}><option value="NOISE">Noise after quiet hours</option><option value="LITTER">Litter in a shared area</option><option value="PARKING">Parking or access obstruction</option><option value="PET">Pet nuisance or unsafe handling</option><option value="SMOKE_ODOR">Smoke or persistent odor intrusion</option><option value="PROPERTY_DAMAGE">Damage to shared property</option><option value="SAFETY_OBSTRUCTION">Fire or safety route obstruction</option><option value="COMMON_AREA_MISUSE">Misuse of a shared facility</option></select></Field><Field label="Evidence URL" hint="Use a stable public URL that GenLayer validators can read."><input className="input" type="url" value={values.evidence} onChange={(e) => update("evidence", e.target.value)} placeholder="https://..." required /></Field><div className="form-grid"><Field label="Incident reference" hint="Human-readable case reference."><input className="input" value={values.incident} onChange={(e) => update("incident", e.target.value)} placeholder="BUILDING-A-2026-07-11-2305" required /></Field><Field label="Unique numeric incident key" hint="A non-zero community incident ID used for constant-time replay protection."><input className="input" type="number" min="1" value={values.incidentKey} onChange={(e) => update("incidentKey", e.target.value)} placeholder="202607112305" required /></Field></div></>}
      {(mode === "respond" || mode === "appeal") && <><Field label="Report ID"><input className="input" type="number" min="0" value={values.report} onChange={(e) => update("report", e.target.value)} required /></Field><Field label={mode === "respond" ? "Counter-evidence URL" : "New appeal evidence URL"}><input className="input" type="url" value={mode === "respond" ? values.response : values.appeal} onChange={(e) => update(mode === "respond" ? "response" : "appeal", e.target.value)} placeholder="https://..." required /></Field></>}
      {mode === "evidence" && <><Field label="Report ID"><input className="input" type="number" min="0" value={values.report} onChange={(e) => update("report", e.target.value)} required /></Field><Field label="Replacement evidence URL" hint="The connected reporter replaces complaint evidence; the accused unit replaces counter-evidence."><input className="input" type="url" value={values.evidence} onChange={(e) => update("evidence", e.target.value)} placeholder="https://..." required /></Field></>}
      {(mode === "close" || mode === "review" || mode === "appeal-review" || mode === "finalize") && <Field label="Report ID"><input className="input" type="number" min="0" value={values.report} onChange={(e) => update("report", e.target.value)} required /></Field>}
      <ActionResult state={state} />
      <button className={mode === "finalize" ? "button-danger" : "button-primary"} type="submit"><span>{address ? config.button : "Connect wallet first"}</span><ArrowRight size={17} /></button>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <div className="field"><label>{label}</label>{children}{hint && <small>{hint}</small>}</div>;
}

function genToWei(value: string) {
  if (!/^\d+(\.\d{0,18})?$/.test(value)) throw new Error("INVALID_GEN_AMOUNT");
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * BigInt("1000000000000000000") + BigInt((fraction + "000000000000000000").slice(0, 18));
}
