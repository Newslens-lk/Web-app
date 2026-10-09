import type { BiasLabel } from "./types";

export type AnalyticsBucket = {
  label: BiasLabel | "unclassified";
  count: number;
  percentage: number;
};

export type AnalyticsOverview = {
  date_from: string | null;
  date_to: string | null;
  timezone: string;
  sources: string[];
  bias_label: BiasLabel | null;
  total_articles: number;
  total_events: number;
  total_sources: number;
  missing_publication_dates: number;
  undated_excluded: number;
  bias_distribution: AnalyticsBucket[];
  publishers: {
    source_name: string;
    article_count: number;
    bias_distribution: AnalyticsBucket[];
  }[];
};

export type TimelineDay = {
  date: string;
  total: number;
  bias: Record<string, number>;
};

export type TimelineResponse = {
  days: TimelineDay[];
};

export type TopEvent = {
  event_id: string;
  title: string;
  article_count: number;
  source_count: number;
  bias_distribution: Record<string, number>;
};

export type TopEventsResponse = {
  events: TopEvent[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE?.trim() || "http://localhost:8000/api";

async function safeFetch<T>(url: string): Promise<
  { data: T; error?: never } | { data?: never; error: string }
> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      const messages: Record<number, string> = {
        422: "Check your filters: dates must be valid and the start must not be after the end.",
      };
      return { error: messages[response.status] ?? "Analytics is temporarily unavailable. Please try again." };
    }
    return { data: await response.json() as T };
  } catch {
    return { error: "Analytics is temporarily unavailable. Please try again." };
  }
}

export function getAnalytics(query: URLSearchParams) {
  return safeFetch<AnalyticsOverview>(`${API_BASE}/analytics/overview?${query}`);
}

export function getTimeline(query: URLSearchParams) {
  return safeFetch<TimelineResponse>(`${API_BASE}/analytics/timeline?${query}`);
}

export function getTopEvents(query: URLSearchParams) {
  return safeFetch<TopEventsResponse>(`${API_BASE}/analytics/top-events?${query}`);
}
