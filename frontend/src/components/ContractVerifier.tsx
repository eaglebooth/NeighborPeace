"use client";

import { ExternalLink, RefreshCw } from "lucide-react";
import { useState } from "react";
import { readContract } from "@/lib/genlayer";
import { resetContractAddress, saveContractAddress, useContractAddress } from "@/lib/contract-address";
import { ContractGate } from "./ContractGate";

export function ContractVerifier() {
  const address = useContractAddress();
  const [draft, setDraft] = useState("");
  const [state, setState] = useState<Record<string, string> | null>(null);
  const [message, setMessage] = useState("No static state is shown. Sync to request get_contract_state.");
  const [busy, setBusy] = useState(false);
  function useDeployment() {
    try { const saved=saveContractAddress(draft||address); setDraft(saved); setState(null); setMessage("Custom deployment saved. Sync to verify get_contract_state."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Invalid contract address."); }
  }
  function useDefault() { resetContractAddress(); setDraft(""); setState(null); setMessage("Default deployment restored. Sync to verify it."); }
  async function sync() {
    setBusy(true);
    const result = await readContract("get_contract_state", [], address);
    setBusy(false);
    if (!result.success || typeof result.data !== "string") { setMessage(result.error || "Contract read failed"); return; }
    try { setState(JSON.parse(result.data)); setMessage("Live V3 state received from Studionet."); }
    catch { setMessage("The contract returned malformed state."); }
  }
  return <section className="pb-24"><div className="page-wrap"><ContractGate/><div className="mt-10 border-y border-[var(--line)] py-8"><div className="record-meta mb-3">Runtime contract address</div><div className="flex flex-wrap gap-3"><input className="input flex-1 min-w-[280px]" value={draft} onChange={(event)=>setDraft(event.target.value)} placeholder={address||"0x..."} aria-label="Contract address"/><button className="button-primary" type="button" onClick={useDeployment}>Use deployment</button><button className="button-secondary" type="button" onClick={useDefault}>Restore default</button></div><p className="text-sm text-[var(--ink-soft)] mt-3">Saved in this browser only. Reviewers can verify their own Studionet deployment without rebuilding the app.</p><div className="flex flex-wrap items-center justify-between gap-4 mt-8"><div><div className="record-meta">Live read</div><strong>{message}</strong></div><button className="button-secondary" onClick={sync} disabled={!address||busy}><RefreshCw size={16} className={busy?"animate-spin":""}/>{busy?"Syncing":"Sync contract"}</button></div>{state&&<div className="mt-8 record-list">{Object.entries(state).map(([key,value])=><div className="record-row" key={key}><strong>{key}</strong><span className="lg:col-span-3 break-all">{value}</span><span/></div>)}</div>}<a className="button-secondary mt-8" target="_blank" rel="noreferrer" href={address?`https://explorer-studio.genlayer.com/address/${address}`:"https://explorer-studio.genlayer.com/contracts"}>Open Explorer <ExternalLink size={16}/></a></div></div></section>;
}
