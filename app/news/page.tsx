import { PageSection, PageShell } from "@/components/imme/page-shell";
import { IMME_NEWS } from "@/lib/imme/project";
import { ArrowRightIcon } from "@/components/imme/imme-icons";

export const metadata = {
  title: "News & Updates",
  description: "Most recent updates from the IMME Project — workshops, manual milestones, BMS progress, and capacity building.",
};

const CATEGORY_TONE: Record<string, string> = {
  Workshop: "bg-imme-navy text-white",
  Manual: "bg-imme-amber text-white",
  BMS: "bg-imme-green text-white",
  "Capacity Building": "bg-[#7a5a3c] text-white",
};

export default function NewsPage() {
  return (
    <PageShell
      eyebrow="News & updates"
      title="Most recent first."
      subtitle="Project office updates on workshops, manual development, BMS progress, and capacity building. New entries are added by the Project Management Consultant."
      breadcrumbs={[{ label: "News" }]}
    >
      <PageSection eyebrow="Latest" title="From the project office">
        <ul className="flex flex-col gap-4">
          {IMME_NEWS.map((item) => (
            <li key={item.id}>
              <article className="grid gap-4 rounded-imme border border-imme-line bg-white p-6 shadow-imme-card lg:grid-cols-[140px_minmax(0,1fr)_auto] lg:items-start">
                <div className="flex items-center gap-3 lg:flex-col lg:items-start">
                  <span className={["inline-flex items-center rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-wider", CATEGORY_TONE[item.category] ?? "bg-imme-navy text-white"].join(" ")}>
                    {item.category}
                  </span>
                  <p className="font-mono text-[12px] uppercase tracking-wider text-imme-muted">{item.date}</p>
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-imme-navy">{item.title}</h3>
                  <p className="mt-2 text-[15px] leading-7 text-imme-muted">{item.summary}</p>
                </div>
                <div className="lg:self-center">
                  <a
                    href={item.href ?? "#"}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-imme-navy hover:text-imme-amber"
                  >
                    Read more
                    <ArrowRightIcon className="h-4 w-4" />
                  </a>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </PageSection>
    </PageShell>
  );
}
