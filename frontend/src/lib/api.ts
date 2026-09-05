import type {
  EventList,
  EventDetail,
  ArticleDetail,
  SimilarArticle,
  SourceInfo,
  Stats,
  PipelineRun,
  ArticleSummary,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store", ...init });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function getEvents(params?: Record<string, string>): Promise<EventList> {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return apiFetch<EventList>(`/events${qs}`);
}

export function getEventDetail(eventId: string): Promise<EventDetail> {
  return apiFetch<EventDetail>(`/events/${eventId}`);
}

export function getArticles(params?: Record<string, string>): Promise<{ articles: ArticleSummary[]; total: number; page: number; page_size: number }> {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return apiFetch(`/articles${qs}`);
}

export function getArticleDetail(articleId: string): Promise<ArticleDetail> {
  return apiFetch<ArticleDetail>(`/articles/${articleId}`);
}

export function getSimilarArticles(articleId: string, limit = 5): Promise<{ similar_articles: SimilarArticle[] }> {
  return apiFetch(`/articles/${articleId}/similar?limit=${limit}`);
}

export function getSources(): Promise<{ sources: SourceInfo[] }> {
  return apiFetch(`/sources`);
}

export function getStats(): Promise<Stats> {
  return apiFetch<Stats>(`/stats`);
}

export function triggerPipeline(apiKey: string): Promise<{ dag_run_id: string; state: string }> {
  return apiFetch(`/admin/pipeline/trigger`, {
    method: "POST",
    headers: { "X-API-Key": apiKey },
  });
}

export function getPipelineStatus(apiKey: string): Promise<{ runs: PipelineRun[] }> {
  return apiFetch(`/admin/pipeline/status`, {
    headers: { "X-API-Key": apiKey },
  });
}

export function getPipelineHistory(apiKey: string, limit = 20): Promise<{ runs: PipelineRun[] }> {
  return apiFetch(`/admin/pipeline/history?limit=${limit}`, {
    headers: { "X-API-Key": apiKey },
  });
}

export function relativeTime(iso: string | null): string {
  if (!iso) return "recently";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 60) return `${Math.max(diff, 1)}m ago`;
  const hours = Math.floor(diff / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
