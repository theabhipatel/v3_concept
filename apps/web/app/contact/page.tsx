import { Clock, Mail, MapPin, MessageCircle } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";
import { NamedIcon } from "@/components/icons";
import { PageHeader } from "@/components/site/page-header";
import { contact, profile } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("contact");

export default function ContactPage() {
  const details = [
    { icon: Mail, label: "Email", value: profile.email, href: `mailto:${profile.email}` },
    { icon: MessageCircle, label: "WhatsApp", value: profile.phone.display, href: `https://wa.me/${profile.phone.href.replace(/\D/g, "")}` },
    { icon: MapPin, label: "Location", value: `${profile.location.city}, ${profile.location.country}` },
    { icon: Clock, label: "Response time", value: contact.responseTime },
  ];
  return (
    <>
      <PageHeader
        label="05 / Deliver - contact"
        title="Let's build something together."
        description={`Open to ${contact.openTo.join(", ").toLowerCase()}. This form works even when the AI is offline.`}
      />
      <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-24 sm:px-8 lg:grid-cols-[1.3fr_1fr]">
        <section id="form" aria-label="Contact form" className="rounded-3xl">
          <ContactForm />
        </section>
        <aside className="space-y-8">
          <ul className="space-y-3">
            {details.map((d) => (
              <li key={d.label} className="flex items-center gap-4 rounded-2xl border bg-card p-4">
                <d.icon className="size-5 shrink-0 text-brand-text" aria-hidden />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{d.label}</p>
                  {d.href ? (
                    <a href={d.href} className="block truncate font-medium hover:underline" target={d.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
                      {d.value}
                    </a>
                  ) : (
                    <p className="font-medium">{d.value}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-subtle-foreground">Availability (IST)</p>
            <ul className="divide-y rounded-2xl border bg-card text-sm">
              {contact.availability.map((a) => (
                <li key={a.day} className="flex justify-between px-4 py-3">
                  <span>{a.day}</span>
                  <span className={a.available ? "text-muted-foreground" : "text-subtle-foreground"}>{a.time}</span>
                </li>
              ))}
            </ul>
          </div>
          <ul className="flex gap-2">
            {profile.socials.map((s) => (
              <li key={s.name}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.name} className="grid size-11 place-items-center rounded-full border bg-card text-muted-foreground hover:text-foreground">
                  <NamedIcon name={s.icon} className="size-4" />
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </div>
      <section id="faq" aria-labelledby="faq-title" className="mx-auto max-w-3xl scroll-mt-28 rounded-3xl px-4 pb-28 sm:px-8">
        <h2 id="faq-title" className="mb-6 text-3xl font-semibold">Questions people ask</h2>
        <div className="space-y-3">
          {contact.faqs.map((f) => (
            <details key={f.question} className="group rounded-2xl border bg-card px-5 py-4">
              <summary className="cursor-pointer list-none font-medium marker:hidden">
                <span className="flex items-center justify-between gap-4">
                  {f.question}
                  <span className="text-subtle-foreground transition-transform group-open:rotate-45" aria-hidden>+</span>
                </span>
              </summary>
              <p className="mt-3 text-muted-foreground">{f.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
