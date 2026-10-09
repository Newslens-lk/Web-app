import type {
  EventList,
  EventDetail,
  ArticleDetail,
  SimilarArticle,
  SourceInfo,
  ArticleSummary,
} from "./types";
import type { Dictionary } from "./i18n/dictionaries";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE?.trim() || "http://localhost:8000/api";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    ...init,
  });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      // Keep the status-based message when the response is not JSON.
    }
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
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

export function summarizeEvent(eventId: string): Promise<{ event_id: string; summary: string; topic: string | null }> {
  return apiFetch(`/events/${eventId}/summarize`, { method: "POST" });
}

export function relativeTime(iso: string | null, t: Dictionary): string {
  if (!iso) return t.time.recently;
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 60) return t.time.minutesAgo(Math.max(diff, 1));
  const hours = Math.floor(diff / 60);
  if (hours < 24) return t.time.hoursAgo(hours);
  return t.time.daysAgo(Math.floor(hours / 24));
}
