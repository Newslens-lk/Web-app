import type { BiasBucket, BiasDistribution, Event, Outlet } from "@/lib/mock-events";

export type ApiArticle = {
  article_id: string;
  title: string;
  source_name: string;
  url: string;
  language: string;
  published_at: string | null;
  bias_label: string | null;
  bias_confidence: number | null;
};

export type ApiEventSummary = {
  event_id: string;
  summary: string | null;
  topic: string | null;
  article_count: number;
  source_count: number;
  window_start: string | null;
  window_end: string | null;
};

export type ApiEventDetail = ApiEventSummary & {
  articles: ApiArticle[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api/v1";

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`API request to ${path} failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function getEventSummaries(limit = 20): Promise<ApiEventSummary[]> {
  return apiFetch<ApiEventSummary[]>(`/events?limit=${limit}`);
}

export function getEventDetail(eventId: string): Promise<ApiEventDetail> {
  return apiFetch<ApiEventDetail>(`/events/${eventId}`);
}

// Backend's classifier currently outputs a 3-class taxonomy (left/center/right).
// The UI's spectrum bar has 5 buckets (fl/l/c/r/fr) for when a finer-grained
// model ships; until then the outer buckets stay at zero rather than guessing.
const OUTLET_COLORS = ["#2C5C8A", "#6C97C0", "#9C9482", "#C98552", "#9C3F26"];

function biasBucket(label: string | null): BiasBucket {
  switch (label) {
    case "left":
      return "l";
    case "right":
      return "r";
    default:
      return "c";
  }
}

function outletShort(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 3).toUpperCase();
}

function outletColor(name: string): string {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return OUTLET_COLORS[hash % OUTLET_COLORS.length];
}

export function relativeTime(iso: string | null): string {
  if (!iso) return "recently";
  const diffMinutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMinutes < 60) return `${Math.max(diffMinutes, 1)}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export function toUiEvent(detail: ApiEventDetail): Event {
  const distribution: BiasDistribution = { fl: 0, l: 0, c: 0, r: 0, fr: 0 };
  const outletsByName = new Map<string, Outlet>();

  for (const article of detail.articles) {
    distribution[biasBucket(article.bias_label)] += 1;
    if (!outletsByName.has(article.source_name)) {
      outletsByName.set(article.source_name, {
        id: article.source_name.toLowerCase().replace(/\s+/g, "-"),
        short: outletShort(article.source_name),
        name: article.source_name,
        color: outletColor(article.source_name),
      });
    }
  }

  const headline = detail.summary ?? detail.articles[0]?.title ?? "Untitled event";
  const dek = detail.summary
    ? (detail.articles[0]?.title ?? "")
    : `${detail.article_count} article${detail.article_count === 1 ? "" : "s"} from ${
        detail.source_count
      } outlet${detail.source_count === 1 ? "" : "s"}.`;

  return {
    id: detail.event_id,
    topic: detail.topic ?? "General",
    headline,
    dek,
    outletCount: detail.source_count,
    distribution,
    outlets: Array.from(outletsByName.values()),
    updatedAgo: relativeTime(detail.window_end),
  };
}
