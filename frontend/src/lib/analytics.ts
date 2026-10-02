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

export type AnalyticsInsights = {
  date_from: string | null;
  date_to: string | null;
  timezone: string;
  total_articles: number;
  missing_confidence: number;
  low_confidence_threshold: number;
  confidence: {
    label: AnalyticsBucket["label"];
    total: number;
    scored: number;
    mean: number | null;
    low_count: number;
    histogram: number[];
  }[];
  timeline: { week_start: string; total: number; counts: Record<string, number> }[];
  languages: { language: string; count: number }[];
  publishers: {
    source_name: string;
    article_count: number;
    dated_articles: number;
    first_published: string | null;
    latest_published: string | null;
  }[];
};

type ApiResult<T> =
  | { data: T; error?: never; status?: never }
  | { data?: never; error: string; status: number };

async function getFromApi<T>(path: string, query: URLSearchParams): Promise<ApiResult<T>> {
  const base = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api";
  try {
    const response = await fetch(`${base}/analytics/${path}?${query}`, { cache: "no-store" });
    if (!response.ok) {
      const messages: Record<number, string> = {
        422: "Check your filters: dates must be valid and the start must not be after the end.",
      };
      return { status: response.status, error: messages[response.status] ?? "Analytics is temporarily unavailable. Please try again." };
    }
    return { data: await response.json() as T };
  } catch {
    return { status: 503, error: "Analytics is temporarily unavailable. Please try again." };
  }
}

export const getAnalytics = (query: URLSearchParams) => getFromApi<AnalyticsOverview>("overview", query);
export const getInsights = (query: URLSearchParams) => getFromApi<AnalyticsInsights>("insights", query);

export type AnalyticsStories = {
  date_from: string | null;
  date_to: string | null;
  shared_events: number;
  unanimous_events: number;
  min_pair_events: number;
  stories: {
    event_id: string;
    headline: string;
    spread: number;
    dots: { source_name: string; lean: number; articles: number }[];
  }[];
  pairs: { source_a: string; source_b: string; shared_events: number; differing_events: number; mean_gap: number }[];
};

export const getStories = (query: URLSearchParams) => getFromApi<AnalyticsStories>("stories", query);
