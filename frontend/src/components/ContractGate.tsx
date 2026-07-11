"use client";

import Link from "next/link";
import { CircleDot, ExternalLink } from "lucide-react";

export function ContractGate() {
  const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
  return (
    <div className={address ? "notice success" : "notice"}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-bold flex items-center gap-2"><CircleDot size={16} />{address ? "NeighborPeace V2 is configured" : "Awaiting NeighborPeace V2 deployment"}</span>
        {address ? <a className="font-bold inline-flex items-center gap-1" target="_blank" rel="noreferrer" href={`https://explorer-studio.genlayer.com/address/${address}`}>Explorer <ExternalLink size={14} /></a> : <Link className="font-bold" href="/how-it-works">Review the lifecycle</Link>}
      </div>
      <div className="mt-2 text-sm">{address ? address : "Forms are ready, but writes remain disabled until the new Studio contract address is added."}</div>
    </div>
  );
}
