import type { CampaignKpis } from "@/lib/analytics";

interface Props {
  kpis: CampaignKpis;
}

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toLocaleString();
}

interface Card {
  label: string;
  value: string;
  sub: string;
  accent: string;
}

export function KpiStrip({ kpis }: Props) {
  const cards: Card[] = [
    {
      label: "Audience",
      value: fmt(kpis.audience),
      sub: `${kpis.campaigns} campaigns`,
      accent: "text-zinc-900 dark:text-zinc-100",
    },
    {
      label: "Delivered",
      value: `${kpis.deliveryRate}%`,
      sub: `${fmt(kpis.delivered)} reached`,
      accent: "text-brand-600",
    },
    {
      label: "Read",
      value: `${kpis.readRate}%`,
      sub: `${fmt(kpis.read)} opens`,
      accent: "text-sky-600",
    },
    {
      label: "CTR",
      value: `${kpis.ctr}%`,
      sub: `${fmt(kpis.clicked)} clicks`,
      accent: "text-amber-600",
    },
    {
      label: "Reply rate",
      value: `${kpis.replyRate}%`,
      sub: `${fmt(kpis.replied)} replies`,
      accent: "text-violet-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            {c.label}
          </div>
          <div className={`mt-1 text-2xl font-semibold sm:text-3xl ${c.accent}`}>
            {c.value}
          </div>
          <div className="mt-0.5 text-xs text-zinc-500">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
