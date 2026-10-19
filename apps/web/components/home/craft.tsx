import { Check, Search } from "lucide-react";
import Link from "next/link";

// "What I do": each kind of work gets a small looping scene instead of an icon. Pure CSS
// (site.css, `craft-*`), paused off screen through `data-motion`.

function AgentScene() {
  return (
    <div className="craft-scene craft-agent" aria-hidden>
      <p className="craft-agent__ask">Find my last 3 orders and refund the late one</p>
      <p className="craft-agent__tool">
        <Search className="size-3" /> orders.search(limit: 3)
      </p>
      <p className="craft-agent__tool craft-agent__tool--2">
        <Check className="size-3" /> refund.create(#4821)
      </p>
      <div className="craft-agent__reply">
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}

function ProductScene() {
  return (
    <div className="craft-scene craft-product" aria-hidden>
      <div className="craft-product__side">
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="craft-product__main">
        <div className="craft-product__kpis">
          <span />
          <span />
          <span />
        </div>
        <div className="craft-product__chart">
          {[38, 62, 45, 80, 58, 92, 70].map((h, i) => (
            <i key={i} style={{ "--h": `${h}%`, "--i": i } as React.CSSProperties} />
          ))}
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="craft-product__line">
            <path d="M0 32 L16 24 L33 28 L50 14 L66 19 L83 6 L100 10" pathLength={1} />
          </svg>
        </div>
      </div>
    </div>
  );
}

function ShipScene() {
  return (
    <div className="craft-scene craft-ship" aria-hidden>
      <ol className="craft-ship__stages">
        {["Commit", "Build", "Test", "Deploy"].map((s, i) => (
          <li key={s} style={{ "--i": i } as React.CSSProperties}>
            <span>
              <Check className="size-3" strokeWidth={3} />
            </span>
            {s}
          </li>
        ))}
        <i className="craft-ship__runner" />
      </ol>
      <div className="craft-ship__pods">
        {Array.from({ length: 8 }, (_, i) => (
          <i key={i} style={{ "--i": i } as React.CSSProperties} />
        ))}
      </div>
    </div>
  );
}

const SCENES = { agent: AgentScene, product: ProductScene, ship: ShipScene };

export interface Craft {
  scene: keyof typeof SCENES;
  title: string;
  body: string;
  examples: { title: string; href: string }[];
}

export function CraftGrid({ items }: { items: Craft[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((c, i) => {
        const Scene = SCENES[c.scene];
        return (
          <article
            key={c.title}
            data-reveal
            data-motion
            style={{ "--d": i } as React.CSSProperties}
            className="group flex flex-col overflow-hidden rounded-3xl border bg-card transition-colors hover:border-border-strong"
          >
            <Scene />
            <div className="flex flex-1 flex-col p-6">
              <h3 className="text-xl font-bold tracking-tight">{c.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{c.body}</p>
              <p className="mt-auto pt-5 text-sm text-muted-foreground">
                Built:{" "}
                {c.examples.map((p, j) => (
                  <span key={p.href}>
                    <Link href={p.href} className="font-medium text-foreground underline-offset-4 hover:text-brand-text hover:underline">
                      {p.title}
                    </Link>
                    {j < c.examples.length - 1 && ", "}
                  </span>
                ))}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
