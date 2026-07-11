import { Reveal } from "./Reveal";

export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <section className="section-space">
      <div className="page-wrap max-w-[1180px]">
        <Reveal>
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="display-font text-[clamp(3rem,7vw,6.8rem)] leading-[.9] max-w-[12ch] my-5">{title}</h1>
          <p className="text-[var(--ink-soft)] text-lg leading-8 max-w-[62ch]">{description}</p>
        </Reveal>
      </div>
    </section>
  );
}
