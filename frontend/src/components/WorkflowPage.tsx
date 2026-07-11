import { ContractGate } from "./ContractGate";
import { WorkflowForm } from "./WorkflowForm";

type Mode = "join" | "bond" | "report" | "respond" | "close" | "review" | "appeal" | "appeal-review" | "finalize";

export function WorkflowPage({ mode, eyebrow, title, description, steps, reportId }: { mode: Mode; eyebrow: string; title: string; description: string; steps: string[]; reportId?: string }) {
  return (
    <>
      <section className="section-space"><div className="page-wrap"><span className="eyebrow">{eyebrow}</span><h1 className="display-font text-[clamp(3rem,7vw,6.5rem)] leading-[.9] max-w-[12ch] my-5">{title}</h1><p className="text-lg text-[var(--ink-soft)] leading-8 max-w-[62ch]">{description}</p><div className="mt-8"><ContractGate /></div></div></section>
      <section className="form-band"><div className="page-wrap form-inner"><aside className="form-aside"><span className="eyebrow">Before you sign</span><h2 className="display-font">A clear action, recorded once.</h2><ol className="grid gap-4 mt-8">{steps.map((step, index) => <li key={step} className="grid grid-cols-[30px_1fr] gap-3 text-[var(--ink-soft)] leading-6"><strong className="text-[var(--evergreen)]">{String(index + 1).padStart(2,"0")}</strong><span>{step}</span></li>)}</ol></aside><WorkflowForm mode={mode} reportId={reportId} /></div></section>
    </>
  );
}
