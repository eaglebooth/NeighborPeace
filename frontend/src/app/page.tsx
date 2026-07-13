import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FileSearch, Handshake, Scale, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { ContractGate } from "@/components/ContractGate";

export default function Home() {
  return (
    <>
      <section className="pt-12 md:pt-20">
        <div className="page-wrap grid lg:grid-cols-[.84fr_1.16fr] items-center gap-10">
          <Reveal>
            <span className="eyebrow"><Scale size={15} /> Neighborhood mediation on GenLayer</span>
            <h1 className="display-font text-[clamp(4rem,8vw,8rem)] leading-[.82] my-7">Settle close to home.</h1>
            <p className="text-lg md:text-xl leading-8 text-[var(--ink-soft)] max-w-[52ch]">NeighborPeace gives both neighbors a voice, asks an AI jury to compare web evidence, and records the final ruling on-chain.</p>
            <div className="flex flex-wrap gap-3 mt-8"><Link href="/reports/new" className="button-primary">File a report <ArrowRight size={17} /></Link><Link href="/how-it-works" className="button-secondary">See the full process</Link></div>
          </Reveal>
          <Reveal delay={.1} className="relative lg:-mr-16">
            <Image src="/images/neighborpeace-courtyard.png" alt="Neighbors meeting with a community mediator in a shared courtyard" width={1536} height={1024} priority className="w-full aspect-[3/2] object-cover rounded-[4px] shadow-[var(--shadow)]" />
            <div className="absolute bottom-4 right-4 bg-[var(--paper-strong)] px-4 py-3 border border-[var(--line)] text-sm font-bold">Two sides · One public trail</div>
          </Reveal>
        </div>
      </section>

      <section className="section-space"><div className="page-wrap"><ContractGate /></div></section>

      <section className="bg-[var(--evergreen-dark)] text-white section-space">
        <div className="page-wrap grid lg:grid-cols-[.72fr_1.28fr] gap-16">
          <Reveal><span className="eyebrow !text-[var(--sage)]">The civic case file</span><h2 className="display-font text-[clamp(3rem,6vw,6rem)] leading-[.92] mt-5">Fairness needs more than one upload.</h2></Reveal>
          <div className="grid md:grid-cols-2 border-t border-[#49645c]">
            {[['01','File evidence','The reporting neighbor submits a stable public evidence URL and unique incident reference.'],['02','Hear the response','The accused unit can submit counter-evidence before the review begins.'],['03','Reach semantic consensus','Validators compare the meaning of verdicts, not identical wording.'],['04','Appeal, then finalize','One appeal can change the ruling before the ledger settlement is applied once.']].map(([n,t,d],i)=><Reveal key={n} delay={i*.06} className="py-8 md:px-6 border-b border-[#49645c]"><span className="text-[var(--sage)] text-sm font-bold">{n}</span><h3 className="display-font text-2xl my-3">{t}</h3><p className="text-[#bdd0bb] leading-7">{d}</p></Reveal>)}
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="page-wrap">
          <Reveal><span className="eyebrow">What the contract protects</span><h2 className="display-font text-[clamp(3rem,6vw,5.5rem)] leading-[.92] max-w-[12ch] mt-5">A process neighbors can inspect.</h2></Reveal>
          <div className="grid md:grid-cols-3 gap-10 mt-16">
            {[[ShieldCheck,'Wallet ownership','Only the registered wallet can act for a unit.'],[FileSearch,'Evidence integrity','Duplicate incident references and unreadable evidence are guarded.'],[Handshake,'Real settlement','A final guilty ruling emits real GEN compensation and treasury transfers exactly once.']].map(([Icon,t,d],i)=>{const C=Icon as typeof ShieldCheck;return <Reveal key={String(t)} delay={i*.08}><C size={28}/><h3 className="display-font text-3xl mt-5 mb-3">{String(t)}</h3><p className="text-[var(--ink-soft)] leading-7">{String(d)}</p><div className="mt-6 flex items-center gap-2 text-sm font-bold text-[var(--evergreen)]"><CheckCircle2 size={16}/> Contract V3 rule</div></Reveal>})}
          </div>
        </div>
      </section>
    </>
  );
}
