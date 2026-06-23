export interface Campaign {
  id: string;
  name: string;
  template_name: string | null;
  sent_at: string;
  audience_size: number;
  delivered: number;
  read_count: number;
  clicked: number;
  replied: number;
  failed: number;
  source: "manual" | "csv" | "webhook";
}

export interface CampaignKpis {
  campaigns: number;
  audience: number;
  delivered: number;
  read: number;
  clicked: number;
  replied: number;
  failed: number;
  deliveryRate: number; // delivered / audience
  readRate: number; // read / delivered
  ctr: number; // clicked / read
  replyRate: number; // replied / delivered
  failureRate: number; // failed / audience
}

export interface TrendPoint {
  date: string; // YYYY-MM-DD
  delivered: number;
  read: number;
  clicked: number;
  replied: number;
}

export interface CampaignPerf {
  id: string;
  name: string;
  sent_at: string;
  audience_size: number;
  deliveryRate: number;
  readRate: number;
  ctr: number;
  replyRate: number;
}

function pct(num: number, den: number) {
  if (!den) return 0;
  return Math.round((num / den) * 1000) / 10; // one decimal %
}

export function aggregateKpis(rows: Campaign[]): CampaignKpis {
  const sum = rows.reduce(
    (a, r) => {
      a.audience += r.audience_size;
      a.delivered += r.delivered;
      a.read += r.read_count;
      a.clicked += r.clicked;
      a.replied += r.replied;
      a.failed += r.failed;
      return a;
    },
    { audience: 0, delivered: 0, read: 0, clicked: 0, replied: 0, failed: 0 },
  );
  return {
    campaigns: rows.length,
    ...sum,
    deliveryRate: pct(sum.delivered, sum.audience),
    readRate: pct(sum.read, sum.delivered),
    ctr: pct(sum.clicked, sum.read),
    replyRate: pct(sum.replied, sum.delivered),
    failureRate: pct(sum.failed, sum.audience),
  };
}

export function buildTrend(rows: Campaign[]): TrendPoint[] {
  const map = new Map<string, TrendPoint>();
  for (const r of rows) {
    const day = r.sent_at.slice(0, 10);
    const cur = map.get(day) ?? {
      date: day,
      delivered: 0,
      read: 0,
      clicked: 0,
      replied: 0,
    };
    cur.delivered += r.delivered;
    cur.read += r.read_count;
    cur.clicked += r.clicked;
    cur.replied += r.replied;
    map.set(day, cur);
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function buildPerformance(rows: Campaign[]): CampaignPerf[] {
  return rows
    .map((r) => ({
      id: r.id,
      name: r.name,
      sent_at: r.sent_at,
      audience_size: r.audience_size,
      deliveryRate: pct(r.delivered, r.audience_size),
      readRate: pct(r.read_count, r.delivered),
      ctr: pct(r.clicked, r.read_count),
      replyRate: pct(r.replied, r.delivered),
    }))
    .sort((a, b) => b.sent_at.localeCompare(a.sent_at));
}
