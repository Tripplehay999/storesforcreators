import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { LEGAL } from "@/lib/legal";
import "@/app/(site)/legal.css";

export type LegalSection = { id: string; title: string; body: React.ReactNode };

type Props = {
  title: string;
  intro: React.ReactNode;
  /** A few plain-language points at the top, for people who won't read the whole page. */
  summary: React.ReactNode[];
  sections: LegalSection[];
  other: { href: string; label: string };
};

/** Shared layout for the Privacy Policy and Terms pages: summary, contents list, numbered sections. */
export default function LegalPage({ title, intro, summary, sections, other }: Props) {
  return (
    <>
      <main className="subpage legal">
        <header className="legal-hero">
          <div className="container">
            <span className="legal-eyebrow">Legal</span>
            <h1>{title}</h1>
            <p className="legal-updated">Last updated {LEGAL.updated}</p>
            <p className="legal-intro">{intro}</p>
          </div>
        </header>

        <div className="container legal-layout">
          <nav className="legal-toc" aria-label="On this page">
            <strong>On this page</strong>
            <ol>
              {sections.map(section => (
                <li key={section.id}><a href={`#${section.id}`}>{section.title}</a></li>
              ))}
            </ol>
          </nav>

          <article className="legal-body">
            <section className="legal-summary" aria-labelledby="legal-summary-title">
              <h2 id="legal-summary-title">The short version</h2>
              <ul>
                {summary.map((point, index) => <li key={index}><span>{point}</span></li>)}
              </ul>
            </section>

            {sections.map((section, index) => (
              <section className="legal-section" id={section.id} key={section.id}>
                <h2><span>{index + 1}.</span> {section.title}</h2>
                {section.body}
              </section>
            ))}

            <section className="legal-contact">
              <h2>Questions?</h2>
              <p>
                Email us at <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> and we&apos;ll help.
              </p>
              <p>
                See also our <Link href={other.href}>{other.label}</Link>.
              </p>
            </section>
          </article>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
