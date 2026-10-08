export type BiasLabel = "far_left" | "left" | "center" | "right" | "far_right";

export type BiasDistribution = Record<BiasLabel, number>;

export type EventSummary = {
  event_id: string;
  summary: string | null;
  topic: string | null;
  article_count: number;
  source_count: number;
  window_start: string | null;
  window_end: string | null;
  created_at: string;
  representative_title: string;
  sources: string[];
  bias_distribution: BiasDistribution;
  image_url: string | null;
};

export type EventList = {
  events: EventSummary[];
  total: number;
  page: number;
  page_size: number;
};

export type ArticleInEvent = {
  article_id: string;
  source_name: string;
  url: string;
  title: string;
  image_url: string | null;
  body: string;
  published_at: string | null;
  bias_label: BiasLabel | null;
  bias_confidence: number | null;
  bias_scores: Record<BiasLabel, number> | null;
};

export type EventDetail = {
  event_id: string;
  summary: string | null;
  topic: string | null;
  representative_title: string | null;
  article_count: number;
  source_count: number;
  window_start: string | null;
  window_end: string | null;
  articles: ArticleInEvent[];
  bias_distribution: BiasDistribution;
};

export type ArticleSummary = {
  article_id: string;
  source_name: string;
  url: string;
  title: string;
  image_url: string | null;
  body_excerpt: string | null;
  published_at: string | null;
  bias_label: BiasLabel | null;
  bias_confidence: number | null;
  event_id: string | null;
};

export type ArticleDetail = {
  article_id: string;
  source_name: string;
  url: string;
  title: string;
  image_url: string | null;
  body: string;
  language: string;
  published_at: string | null;
  scraped_at: string | null;
  bias_label: BiasLabel | null;
  bias_confidence: number | null;
  bias_scores: Record<BiasLabel, number> | null;
  event_id: string | null;
};

export type SimilarArticle = {
  article_id: string;
  title: string;
  source_name: string;
  published_at: string | null;
  bias_label: BiasLabel | null;
  distance: number;
};

export type SourceInfo = {
  source_name: string;
  source_type: string;
  article_count: number;
  latest_article_at: string | null;
};
