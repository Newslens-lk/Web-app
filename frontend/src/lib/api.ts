import type {
  EventList,
  EventDetail,
  ArticleDetail,
  SimilarArticle,
  SourceInfo,
  Stats,
  PipelineRun,
  ArticleSummary,
  User,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    credentials: "include",
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

export function registerUser(payload: {
  email: string;
  display_name: string;
  password: string;
}): Promise<{ user: User }> {
  return apiFetch("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function loginUser(payload: {
  email: string;
  password: string;
}): Promise<{ user: User }> {
  return apiFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function getCurrentUser(): Promise<User> {
  return apiFetch<User>("/auth/me");
}

export function logoutUser(): Promise<void> {
  return apiFetch<void>("/auth/logout", { method: "POST" });
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

export function triggerPipeline(): Promise<{ dag_run_id: string; state: string }> {
  return apiFetch(`/admin/pipeline/trigger`, {
    method: "POST",
  });
}

export function getPipelineStatus(): Promise<{ runs: PipelineRun[] }> {
  return apiFetch(`/admin/pipeline/status`);
}

export function getPipelineHistory(limit = 20): Promise<{ runs: PipelineRun[] }> {
  return apiFetch(`/admin/pipeline/history?limit=${limit}`);
}

export function relativeTime(iso: string | null): string {
  if (!iso) return "recently";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 60) return `${Math.max(diff, 1)}m ago`;
  const hours = Math.floor(diff / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
