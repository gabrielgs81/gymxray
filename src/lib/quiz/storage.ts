import type { Answers, Lead } from "./types";
import { createAnalyticsIdentity } from "./analytics";

// v2 changes the progress index from individual questions to grouped subject screens.
const STORAGE_KEY = "raiox_quiz_v4";

export interface QuizState {
  visitor_id: string;
  session_id: string;
  write_token: string;
  lead: Lead;
  answers: Answers;
  index: number;
  ultima_pergunta_respondida: string | null;
  completed: boolean;
  events: { name: string; at: string; payload?: Record<string, unknown> | undefined }[];
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `lead_${Math.random().toString(36).slice(2)}${Date.now()}`;
}

export function createInitialState(): QuizState {
  const identity = createAnalyticsIdentity();
  return {
    ...identity,
    lead: {
      lead_id: uuid(),
      nome: null,
      telefone: null,
      email: null,
      cidade: null,
      estado: null,
      data_inicio_quiz: new Date().toISOString(),
      data_finalizacao_quiz: null,
      origem: null,
      utm_source: null,
      utm_campaign: null,
      utm_content: null,
      status_quiz: "iniciado",
    },
    answers: {},
    index: 0,
    ultima_pergunta_respondida: null,
    completed: false,
    events: [],
  };
}

export function loadState(): QuizState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<QuizState>;
    if (!parsed.lead || !parsed.answers) return null;
    const identity = createAnalyticsIdentity();
    return {
      ...(parsed as QuizState),
      visitor_id: parsed.visitor_id ?? identity.visitor_id,
      session_id: parsed.session_id ?? parsed.lead.lead_id ?? identity.session_id,
      write_token: parsed.write_token ?? identity.write_token,
      events: parsed.events ?? [],
    };
  } catch {
    return null;
  }
}

export function saveState(state: QuizState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* armazenamento indisponível */
  }
}

export function clearState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/** Captura telefone e UTMs da URL do disparo (?phone=5517999999999) */
export function readUrlParams(lead: Lead): Lead {
  if (typeof window === "undefined") return lead;
  const p = new URLSearchParams(window.location.search);
  const get = (k: string) => p.get(k);
  return {
    ...lead,
    telefone: lead.telefone ?? get("phone") ?? get("telefone"),
    nome: lead.nome ?? get("nome"),
    email: lead.email ?? get("email"),
    origem: lead.origem ?? get("origem") ?? (get("phone") ? "whatsapp" : null),
    utm_source: lead.utm_source ?? get("utm_source"),
    utm_campaign: lead.utm_campaign ?? get("utm_campaign"),
    utm_content: lead.utm_content ?? get("utm_content"),
  };
}

export type AnalyticsEvent =
  | "quiz_started"
  | "question_answered"
  | "quiz_abandoned"
  | "quiz_completed"
  | "result_preview_viewed"
  | "checkout_clicked";

export function trackEvent(name: AnalyticsEvent, payload?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const entry = { name, at: new Date().toISOString(), payload };
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push({ event: name, ...payload });
  const state = loadState();
  if (state) saveState({ ...state, events: [...(state.events ?? []), entry].slice(-100) });
}
