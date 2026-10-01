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

export async function getAnalytics(query: URLSearchParams): Promise<
  { data: AnalyticsOverview; error?: never; status?: never } |
  { data?: never; error: string; status: number }
> {
  const base = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api";
  try {
    const response = await fetch(`${base}/analytics/overview?${query}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      const messages: Record<number, string> = {
        422: "Check your filters: dates must be valid and the start must not be after the end.",
      };
      return { status: response.status, error: messages[response.status] ?? "Analytics is temporarily unavailable. Please try again." };
    }
    return { data: await response.json() as AnalyticsOverview };
  } catch {
    return { status: 503, error: "Analytics is temporarily unavailable. Please try again." };
  }
}
