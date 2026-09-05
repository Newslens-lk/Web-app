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

export type Stats = {
  total_articles: number;
  total_events: number;
  total_sources: number;
  articles_today: number;
  events_today: number;
  bias_breakdown: Record<string, number>;
  articles_per_source: Record<string, number>;
  last_pipeline_run: string | null;
};

export type PipelineRun = {
  dag_run_id: string;
  state: string;
  start_date: string | null;
  end_date: string | null;
  tasks: { task_id: string; state: string; duration: number | null }[];
};
