import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Activity } from "lucide-react";
import { toast } from "sonner";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "./QuestionCard";
import { QuestionGroupCard } from "./QuestionGroupCard";
import { ResultPreview } from "./ResultPreview";
import { EngagementCard } from "./EngagementCard";
import { TrailUnlock } from "./TrailUnlock";
import { softWarning } from "@/lib/quiz/questions";
import { stepAnchorId, visibleQuizSteps } from "@/lib/quiz/steps";
import { getQuizEngagement, getQuizStage, getStageCount } from "@/lib/quiz/engagement";
import { buildDiagnostic } from "@/lib/quiz/diagnosis";
import { fetchMunicipalPopulation } from "@/lib/quiz/market";
import {
  getReportUrl,
  ingestAnalytics,
  persistDiagnostic,
  startAnalyticsSession,
} from "@/lib/quiz/analytics";
import {
  clearState,
  createInitialState,
  loadState,
  readUrlParams,
  saveState,
  trackEvent,
  type QuizState,
} from "@/lib/quiz/storage";
import type { Answers } from "@/lib/quiz/types";

export function QuizFlow() {
  const [state, setState] = useState<QuizState | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [showTrailUnlock, setShowTrailUnlock] = useState(false);
  const [analyticsReady, setAnalyticsReady] = useState(false);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const pending = useRef<{ stepId: string; signature: string } | null>(null);
  const viewedStep = useRef<string | null>(null);
  const stepStartedAt = useRef(Date.now());

  // Hidratação: restaura progresso salvo e captura parâmetros da URL.
  useEffect(() => {
    const restored = loadState() ?? createInitialState();
    const next: QuizState = { ...restored, lead: readUrlParams(restored.lead) };
    setState(next);
    saveState(next);
    if (!restored.completed && (restored.ultima_pergunta_respondida ?? null) === null) {
      trackEvent("quiz_started", { lead_id: next.lead.lead_id });
    }
  }, []);

  useEffect(() => {
    const onLeave = () => {
      const s = loadState();
      if (s && !s.completed && s.ultima_pergunta_respondida) {
        trackEvent("quiz_abandoned", { ultima_pergunta_respondida: s.ultima_pergunta_respondida });
        void ingestAnalytics(
          s,
          "quiz_abandoned",
          {
            step_id: s.ultima_pergunta_respondida,
            current_step: s.ultima_pergunta_respondida,
            status: "em_andamento",
          },
          true,
        );
      }
    };
    window.addEventListener("pagehide", onLeave);
    return () => window.removeEventListener("pagehide", onLeave);
  }, []);

  const update = useCallback((updater: (s: QuizState) => QuizState) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  const steps = useMemo(() => (state ? visibleQuizSteps(state.answers) : []), [state]);
  const index = Math.min(state?.index ?? 0, Math.max(0, steps.length - 1));
  const step = steps[index];
  const anchorId = step ? stepAnchorId(step) : null;
  const engagement = useMemo(
    () =>
      anchorId ? getQuizEngagement(anchorId, state?.answers ?? {}, index, steps.length) : null,
    [anchorId, index, state?.answers, steps.length],
  );

  useEffect(() => {
    if (!state || !step || analyticsReady) return;
    void startAnalyticsSession(state, step.id, steps.length).then(() => setAnalyticsReady(true));
  }, [analyticsReady, state, step, steps.length]);

  useEffect(() => {
    if (!analyticsReady || !state || !step || viewedStep.current === step.id) return;
    viewedStep.current = step.id;
    stepStartedAt.current = Date.now();
    void ingestAnalytics(state, "step_viewed", {
      step_id: step.id,
      step_index: index,
      current_step: step.id,
      total_steps: steps.length,
      question_keys: step.questions.map((question) => question.key),
      status: state.completed ? "concluido" : "em_andamento",
    });
  }, [analyticsReady, index, state, step, steps.length]);

  const result = useMemo(
    () => (state?.completed ? buildDiagnostic(state.answers, state.lead) : null),
    [state],
  );

  useEffect(() => {
    if (!result || !state || !analyticsReady) return;
    trackEvent("result_preview_viewed", { score: result.scores.score_geral });
    void persistDiagnostic(state, result)
      .then(() => getReportUrl(state))
      .then(setReportUrl);
    void ingestAnalytics(state, "result_preview_viewed", {
      score: result.scores.score_geral,
      status: "concluido",
    });
  }, [analyticsReady, result, state]);

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Activity className="size-6 animate-pulse text-primary" />
      </div>
    );
  }

  if (result) {
    return (
      <ResultPreview
        result={result}
        onRestart={() => {
          void ingestAnalytics(state, "quiz_restarted", { status: "reiniciado" });
          clearState();
          const fresh = createInitialState();
          fresh.lead = readUrlParams(fresh.lead);
          saveState(fresh);
          viewedStep.current = null;
          setAnalyticsReady(false);
          setState(fresh);
        }}
        onCheckout={() => {
          trackEvent("checkout_clicked", { score: result.scores.score_geral });
          void ingestAnalytics(state, "checkout_clicked", {
            score: result.scores.score_geral,
            status: "concluido",
          });
          if (reportUrl) window.location.assign(reportUrl);
          else
            toast("Preparando seu relatório", {
              description: "Aguarde alguns segundos e tente novamente.",
            });
        }}
      />
    );
  }

  if (!step) return null;

  const handleSubmit = (patch: Answers) => {
    const answersWithPatch = { ...state.answers, ...patch };
    const w =
      step.questions
        .map((question) => softWarning(question, patch[question.key], answersWithPatch))
        .find((message) => message !== null) ?? null;
    const signature = JSON.stringify(patch);
    const acknowledged =
      pending.current?.stepId === step.id &&
      pending.current.signature === signature &&
      warning !== null;

    if (w && !acknowledged) {
      pending.current = { stepId: step.id, signature };
      setWarning(w);
      return;
    }

    pending.current = null;
    setWarning(null);

    if (step.id === "Q02") setShowTrailUnlock(true);

    const answers = { ...state.answers, ...patch };
    const nextSteps = visibleQuizSteps(answers);
    const currentPos = nextSteps.findIndex((item) => item.id === step.id);
    const nextIndex = (currentPos === -1 ? state.index : currentPos) + 1;
    const completed = nextIndex >= nextSteps.length;
    const lead = {
      ...state.lead,
      cidade: (answers["cidade"] as string) ?? state.lead.cidade,
      estado: (answers["estado"] as string) ?? state.lead.estado,
      nome: (answers["nome"] as string) ?? state.lead.nome,
      telefone: (answers["telefone"] as string) ?? state.lead.telefone,
      email: (answers["email"] as string) ?? state.lead.email,
      status_quiz: completed ? ("concluido" as const) : ("em_andamento" as const),
      data_finalizacao_quiz: completed
        ? new Date().toISOString()
        : state.lead.data_finalizacao_quiz,
    };
    const nextState: QuizState = {
      ...state,
      answers,
      lead,
      index: Math.min(nextIndex, nextSteps.length - 1),
      ultima_pergunta_respondida: step.id,
      completed,
    };
    saveState(nextState);
    setState(nextState);
    viewedStep.current = null;

    if (step.id === "Q02" && typeof patch["municipio_ibge"] === "number") {
      void fetchMunicipalPopulation(patch["municipio_ibge"]).then((market) => {
        if (!market) return;
        update((current) => ({
          ...current,
          answers: {
            ...current.answers,
            populacao_municipal_estimada: market.population,
            populacao_ano_referencia: market.referenceYear,
            mercado_fonte_populacao: market.source,
          },
        }));
        void ingestAnalytics(nextState, "market_data_enriched", {
          municipio_ibge: patch["municipio_ibge"],
          population: market.population,
          reference_year: market.referenceYear,
          source: market.source,
        });
      });
    }

    void ingestAnalytics(nextState, "step_completed", {
      step_id: step.id,
      step_index: index,
      current_step: completed ? step.id : nextSteps[nextIndex]?.id,
      last_answered_step: step.id,
      total_steps: nextSteps.length,
      duration_ms: Date.now() - stepStartedAt.current,
      answers: patch,
      all_answers: answers,
      lead,
      status: completed ? "concluido" : "em_andamento",
    });

    trackEvent("question_answered", {
      question_id: step.id,
      keys: step.questions.map((question) => question.key),
    });
    if (completed) {
      trackEvent("quiz_completed", {});
      void ingestAnalytics(nextState, "quiz_completed", {
        step_id: step.id,
        last_answered_step: step.id,
        total_steps: nextSteps.length,
        all_answers: answers,
        lead,
        status: "concluido",
      });
    }
  };

  const progress = ((index + 1) / steps.length) * 100;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 pb-12">
      <header className="sticky top-0 z-10 -mx-5 bg-background/90 px-5 pb-4 pt-5 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-9 px-2 text-muted-foreground"
            disabled={index === 0 || showTrailUnlock}
            onClick={() => {
              setWarning(null);
              pending.current = null;
              viewedStep.current = null;
              void ingestAnalytics(state, "step_back_clicked", {
                step_id: step.id,
                step_index: index,
              });
              update((s) => ({ ...s, index: Math.max(0, s.index - 1), completed: false }));
            }}
          >
            <ArrowLeft className="mr-1 size-4" /> Voltar
          </Button>
          <div className="text-right">
            <p className="text-xs font-semibold text-foreground">{engagement?.phase}</p>
            <p className="text-[11px] text-muted-foreground">
              Etapa {anchorId ? getQuizStage(anchorId, state.answers).number : 1} de{" "}
              {getStageCount(state.answers)} · {Math.round(progress)}%
            </p>
          </div>
        </div>
        <Progress value={progress} className="progress-alive h-2" />
      </header>

      <main className="flex-1 pt-8">
        {showTrailUnlock ? (
          <TrailUnlock answers={state.answers} onContinue={() => setShowTrailUnlock(false)} />
        ) : (
          <div key={step.id} className="question-enter">
            {engagement && <EngagementCard engagement={engagement} />}
            <div className="mt-7 border-t border-border/60 pt-7">
              {!step.sliderConfigs ? (
                <QuestionCard
                  key={step.id}
                  question={step.questions[0]!}
                  answers={state.answers}
                  warning={warning}
                  onSubmit={handleSubmit}
                />
              ) : (
                <QuestionGroupCard
                  key={step.id}
                  step={step}
                  answers={state.answers}
                  warning={warning}
                  onSubmit={handleSubmit}
                />
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="pt-8 text-center text-xs text-muted-foreground">
        Suas respostas ficam salvas automaticamente para você continuar depois.
      </footer>
    </div>
  );
}
