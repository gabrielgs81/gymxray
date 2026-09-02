import type { DiagnosticResult } from "./types";
import type { QuizState } from "./storage";

const VISITOR_KEY = "raiox_visitor_id";
const QUIZ_VERSION = "2026-09-expert-v2";

function uuid() {
  return crypto.randomUUID();
}

function config() {
  const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
  const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined;
  return url && key ? { url, key } : null;
}

async function rpc(name: string, body: Record<string, unknown>, keepalive = false) {
  const connection = config();
  if (!connection) return null;
  const response = await fetch(`${connection.url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: connection.key,
      Authorization: `Bearer ${connection.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    keepalive,
  });
  if (!response.ok) throw new Error(`X-Ray analytics: ${response.status}`);
  return response.json() as Promise<unknown>;
}

export function getVisitorId() {
  const current = window.localStorage.getItem(VISITOR_KEY);
  if (current) return current;
  const id = uuid();
  window.localStorage.setItem(VISITOR_KEY, id);
  return id;
}

export function createAnalyticsIdentity() {
  return { visitor_id: getVisitorId(), session_id: uuid(), write_token: uuid() };
}

function attribution() {
  const params = new URLSearchParams(window.location.search);
  return Object.fromEntries(
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"]
      .map((key) => [key, params.get(key)])
      .filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
}

function device() {
  return {
    language: navigator.language,
    screen: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    user_agent: navigator.userAgent,
  };
}

export function trackPageView() {
  return rpc("xray_track_page_view", {
    p_visitor_id: getVisitorId(),
    p_payload: {
      path: `${window.location.pathname}${window.location.search}`,
      referrer: document.referrer || null,
      attribution: attribution(),
      device: device(),
    },
  }).catch(() => null);
}

export function startAnalyticsSession(state: QuizState, currentStep: string, totalSteps: number) {
  return rpc("xray_start_session", {
    p_session_id: state.session_id,
    p_visitor_id: state.visitor_id,
    p_write_token: state.write_token,
    p_payload: {
      quiz_version: QUIZ_VERSION,
      current_step: currentStep,
      total_steps: totalSteps,
      lead: state.lead,
      attribution: attribution(),
      device: device(),
    },
  }).catch(() => null);
}

export function ingestAnalytics(
  state: QuizState,
  action: string,
  payload: Record<string, unknown> = {},
  keepalive = false,
) {
  return rpc(
    "xray_ingest",
    {
      p_session_id: state.session_id,
      p_write_token: state.write_token,
      p_action: action,
      p_payload: payload,
    },
    keepalive,
  ).catch(() => null);
}

export function persistDiagnostic(state: QuizState, result: DiagnosticResult) {
  return ingestAnalytics(state, "diagnostic_generated", {
    score: result.scores.score_geral,
    path: result.path,
    scores: result.scores,
    metrics: result.metrics,
    diagnosis: result.diagnosis,
    result,
  });
}

export async function getReportUrl(state: QuizState) {
  const slug = await rpc("xray_get_report_slug", {
    p_session_id: state.session_id,
    p_write_token: state.write_token,
  });
  if (typeof slug !== "string" || !slug) return null;
  const base =
    (import.meta.env["VITE_XRAY_REPORT_URL"] as string | undefined) ??
    "https://report.r2flow.com.br";
  return `${base.replace(/\/$/, "")}/resultado/${slug}`;
}
