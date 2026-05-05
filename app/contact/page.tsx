import { PageSection, PageShell } from "@/components/imme/page-shell";
import { IMME_CONTACTS } from "@/lib/imme/project";
import { ContactForm } from "@/components/imme/contact-form";
import { MailIcon, MapPinIcon, PeopleIcon } from "@/components/imme/imme-icons";

export const metadata = {
  title: "Contact",
  description: "Reach the IMME Project Management Consultant, MoWT counterpart, and KOICA Uganda office.",
};

const CONTACT_CARDS = [
  { id: "pmc", label: IMME_CONTACTS.pmc.label, detail: IMME_CONTACTS.pmc.detail, Icon: PeopleIcon },
  { id: "mowt", label: IMME_CONTACTS.mowt.label, detail: IMME_CONTACTS.mowt.detail, Icon: MailIcon },
  { id: "koica", label: IMME_CONTACTS.koica.label, detail: IMME_CONTACTS.koica.detail, Icon: MapPinIcon },
];

export default function ContactPage() {
  return (
    <PageShell
      eyebrow="Contact"
      title="Talk to the project office."
      subtitle="The Project Management Consultant fields incoming questions and routes them to the right partner. For ministry-internal coordination, use the MoWT counterpart."
      breadcrumbs={[{ label: "Contact" }]}
    >
      <PageSection eyebrow="Direct" title="Three points of contact">
        <ul className="grid gap-5 md:grid-cols-3">
          {CONTACT_CARDS.map(({ id, label, detail, Icon }) => (
            <li key={id} className="flex h-full flex-col gap-3 rounded-imme border border-imme-line bg-white p-6 shadow-imme-card">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-imme-navy text-white">
                <Icon className="h-5 w-5" />
              </span>
              <p className="font-display text-base font-semibold text-imme-navy">{label}</p>
              <p className="break-words font-mono text-sm text-imme-ink">{detail}</p>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection variant="concrete" eyebrow="Send a message" title="The Project Management Consultant will respond.">
        <ContactForm />
      </PageSection>
    </PageShell>
  );
}
