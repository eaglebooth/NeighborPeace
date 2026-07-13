"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, Handshake, Menu, Wallet, X } from "lucide-react";
import { useState } from "react";
import { useWallet } from "./WalletProvider";

const links = [
  ["Community", "/community"],
  ["Reports", "/reports"],
  ["How it works", "/how-it-works"],
  ["Activity", "/activity"],
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { address, busy, connect } = useWallet();
  const [open, setOpen] = useState(false);
  const contract = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
  const explorer = contract ? `https://explorer-studio.genlayer.com/address/${contract}` : "https://explorer-studio.genlayer.com/contracts";

  return (
    <>
      <header className="border-b border-[var(--line)] bg-[rgba(246,244,237,.94)] backdrop-blur-md sticky top-0 z-50">
        <div className="page-wrap h-[82px] flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3 font-extrabold text-[1.05rem]">
            <span className="grid size-10 place-items-center bg-[var(--evergreen)] text-white rounded-[4px]"><Handshake size={21} /></span>
            NeighborPeace
          </Link>
          <nav className="hidden lg:flex items-center gap-7 text-sm font-bold text-[var(--ink-soft)]">
            {links.map(([label, href]) => <Link key={href} href={href} className={path === href ? "text-[var(--evergreen)]" : "hover:text-[var(--evergreen)]"}>{label}</Link>)}
          </nav>
          <div className="hidden md:flex items-center gap-10">
            <a href={explorer} target="_blank" rel="noreferrer" className="text-xs font-bold text-[var(--ink-soft)] flex items-center gap-2">
              {contract ? `${contract.slice(0, 6)}...${contract.slice(-4)}` : "V3 not deployed"}<ExternalLink size={13} />
            </a>
            <button className="button-primary" onClick={connect} disabled={busy}>
              <Wallet size={17} /> {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : busy ? "Connecting" : "Connect wallet"}
            </button>
          </div>
          <button className="md:hidden bg-transparent border-0 text-[var(--ink)]" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
        </div>
        {open && <div className="md:hidden page-wrap pb-5 grid gap-3">{links.map(([label, href]) => <Link onClick={() => setOpen(false)} key={href} href={href} className="py-2 font-bold">{label}</Link>)}<button className="button-primary" onClick={connect}><Wallet size={17} /> Connect wallet</button></div>}
      </header>
      <div className="page-main">{children}</div>
      <footer className="bg-[var(--evergreen-dark)] text-[#e6eee3] py-12">
        <div className="page-wrap grid md:grid-cols-[1fr_auto] gap-8 items-end">
          <div><div className="display-font text-3xl mb-3">Peace needs a process.</div><p className="text-[#bdd0bb] max-w-xl leading-7">Two-sided evidence, semantic AI consensus, one appeal, and a settlement trail anyone can inspect.</p></div>
          <div className="text-sm text-[#bdd0bb] md:text-right"><div>GenLayer Studio / Studionet</div><div className="mt-2">{contract ? "Contract V3 active" : "Contract V3 awaiting deployment"}</div></div>
        </div>
      </footer>
    </>
  );
}
