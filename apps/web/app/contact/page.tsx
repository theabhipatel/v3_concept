import { ArrowUpRight, Mail, MessageCircle, Plus } from "lucide-react";
import { LocalTime } from "@/components/about/about-parts";
import { AvailabilityBadge, PlaneScene, WeekChart } from "@/components/contact/contact-parts";
import { ContactForm } from "@/components/contact/contact-form";
import { OpenAbiButton } from "@/components/home/open-abi-button";
import { NamedIcon } from "@/components/icons";
import { CopyEmail } from "@/components/site/footer-actions";
import { contact, profile } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("contact");

// Contact: a warm hero with a plane flying into the inbox, a friendly compose form, every other
// way to reach him, his week at a glance, and the questions people usually ask first.

export default function ContactPage() {
  const whatsapp = `https://wa.me/${profile.phone.href.replace(/\D/g, "")}`;

  return (
    <>
      <section aria-labelledby="contact-title" className="relative overflow-hidden pb-12 pt-28 sm:pt-36">
        <div data-motion suppressHydrationWarning className="hero__wash pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-8 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <p data-intro>
              <AvailabilityBadge slots={contact.availability} />
            </p>
            <h1
              id="contact-title"
              data-intro
              style={{ "--d": 1 } as React.CSSProperties}
              className="mt-6 text-balance text-5xl font-bold leading-[1.02] tracking-[-0.035em] sm:text-7xl"
            >
              Let&apos;s build <span className="text-brand-text">something good.</span>
            </h1>
            <p data-intro style={{ "--d": 2 } as React.CSSProperties} className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              A role, a product idea or just a question. Write a few lines and I reply {contact.responseTime.toLowerCase()}.
            </p>
            <ul data-intro style={{ "--d": 3 } as React.CSSProperties} className="mt-8 flex flex-wrap gap-2">
              {contact.openTo.map((o) => (
                <li key={o} className="rounded-full border bg-card/80 px-3.5 py-1.5 text-sm text-muted-foreground backdrop-blur">
                  Open to <span className="font-medium text-foreground">{/^[A-Z][a-z]/.test(o) ? o[0].toLowerCase() + o.slice(1) : o}</span>
                </li>
              ))}
            </ul>
          </div>
          <div data-intro="scale" style={{ "--d": 2 } as React.CSSProperties}>
            <PlaneScene />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-24 sm:px-8 lg:grid-cols-[1.4fr_1fr]">
        <section id="form" aria-label="Contact form" data-reveal className="scroll-mt-28">
          <ContactForm />
        </section>

        <aside className="space-y-4">
          <div data-reveal style={{ "--d": 1 } as React.CSSProperties} className="rounded-3xl border bg-card p-5 sm:p-6">
            <p className="font-semibold">Or reach me directly</p>
            <div className="mt-4 space-y-2">
              <div className="reach flex items-center gap-3 rounded-2xl border bg-background p-3">
                <span className="reach__icon grid size-10 shrink-0 place-items-center rounded-xl">
                  <Mail className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <CopyEmail email={profile.email} />
                </div>
              </div>
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="reach group flex items-center gap-3 rounded-2xl border bg-background p-3">
                <span className="reach__icon grid size-10 shrink-0 place-items-center rounded-xl">
                  <MessageCircle className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">WhatsApp only</p>
                  <p className="truncate font-medium">{profile.phone.display}</p>
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
              </a>
            </div>
            <ul className="mt-4 grid grid-cols-4 gap-2">
              {profile.socials.map((s) => (
                <li key={s.name}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.name}
                    title={s.name}
                    className="social grid h-12 place-items-center rounded-2xl border bg-background text-muted-foreground"
                  >
                    <NamedIcon name={s.icon} className="size-4.5" />
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-subtle-foreground">
              <LocalTime city={profile.location.city} timeZone="Asia/Kolkata" />.
            </p>
          </div>

          <div data-reveal style={{ "--d": 2 } as React.CSSProperties}>
            <WeekChart slots={contact.availability} />
          </div>

          <div data-reveal style={{ "--d": 3 } as React.CSSProperties} className="rounded-3xl border border-abi/30 bg-abi-soft/60 p-5 sm:p-6">
            <p className="font-semibold text-abi-text">Not sure what to write?</p>
            <p className="mt-1 text-sm text-muted-foreground">ABI can draft the message for you. You still press Send.</p>
            <div className="mt-4">
              <OpenAbiButton prompt="Help me write a short message to Abhishek about working together">Draft it with ABI</OpenAbiButton>
            </div>
          </div>
        </aside>
      </div>

      <section id="faq" aria-labelledby="faq-title" className="mx-auto max-w-3xl scroll-mt-28 px-4 pb-28 sm:px-8">
        <p data-reveal className="text-sm font-semibold text-brand-text">
          Before you write
        </p>
        <h2 id="faq-title" data-reveal style={{ "--d": 1 } as React.CSSProperties} className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Questions people ask
        </h2>
        <div className="mt-8 space-y-3">
          {contact.faqs.map((f, i) => (
            <details key={f.question} data-reveal style={{ "--d": i } as React.CSSProperties} className="faq group rounded-2xl border bg-card px-5">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 font-semibold marker:hidden">
                {f.question}
                <span className="faq__plus grid size-8 shrink-0 place-items-center rounded-full bg-muted" aria-hidden>
                  <Plus className="size-4" />
                </span>
              </summary>
              <p className="pb-5 leading-relaxed text-muted-foreground">{f.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
