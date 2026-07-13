"use client";

import { ExternalLink, RefreshCw } from "lucide-react";
import { useState } from "react";
import { readContract } from "@/lib/genlayer";
import { ContractGate } from "./ContractGate";

export function ContractVerifier() {
  const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
  const [state, setState] = useState<Record<string, string> | null>(null);
  const [message, setMessage] = useState("No static state is shown. Sync to request get_contract_state.");
  const [busy, setBusy] = useState(false);
  async function sync() {
    setBusy(true);
    const result = await readContract("get_contract_state", [], address);
    setBusy(false);
    if (!result.success || typeof result.data !== "string") { setMessage(result.error || "Contract read failed"); return; }
    try { setState(JSON.parse(result.data)); setMessage("Live V3 state received from Studionet."); }
    catch { setMessage("The contract returned malformed state."); }
  }
  return <section className="pb-24"><div className="page-wrap"><ContractGate/><div className="mt-10 border-y border-[var(--line)] py-8"><div className="flex flex-wrap items-center justify-between gap-4"><div><div className="record-meta">Live read</div><strong>{message}</strong></div><button className="button-secondary" onClick={sync} disabled={!address||busy}><RefreshCw size={16} className={busy?"animate-spin":""}/>{busy?"Syncing":"Sync contract"}</button></div>{state&&<div className="mt-8 record-list">{Object.entries(state).map(([key,value])=><div className="record-row" key={key}><strong>{key}</strong><span className="lg:col-span-3 break-all">{value}</span><span/></div>)}</div>}<a className="button-secondary mt-8" target="_blank" rel="noreferrer" href={address?`https://explorer-studio.genlayer.com/address/${address}`:"https://explorer-studio.genlayer.com/contracts"}>Open Explorer <ExternalLink size={16}/></a></div></div></section>;
}
