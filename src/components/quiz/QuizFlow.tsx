import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Activity } from "lucide-react";
import { toast } from "sonner";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "./QuestionCard";
import { ResultPreview } from "./ResultPreview";
import { softWarning, visibleQuestions } from "@/lib/quiz/questions";
import { buildDiagnostic } from "@/lib/quiz/diagnosis";
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
  const pending = useRef<{ key: string; value: unknown } | null>(null);

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

  const questions = useMemo(() => (state ? visibleQuestions(state.answers) : []), [state]);
  const index = Math.min(state?.index ?? 0, Math.max(0, questions.length - 1));
  const question = questions[index];

  const result = useMemo(
    () => (state?.completed ? buildDiagnostic(state.answers, state.lead) : null),
    [state],
  );

  useEffect(() => {
    if (result) trackEvent("result_preview_viewed", { score: result.scores.score_geral });
  }, [result]);

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
          clearState();
          const fresh = createInitialState();
          fresh.lead = readUrlParams(fresh.lead);
          saveState(fresh);
          setState(fresh);
        }}
        onCheckout={() => {
          trackEvent("checkout_clicked", { score: result.scores.score_geral });
          toast("Em breve", {
            description: "A oferta do relatório completo será liberada aqui.",
          });
        }}
      />
    );
  }

  if (!question) return null;

  const handleSubmit = (patch: Answers) => {
    const value = patch[question.key];
    const w = question.type === "single" ? null : softWarning(question, value, state.answers);
    const acknowledged =
      pending.current?.key === question.key && pending.current?.value === value && warning !== null;

    if (w && !acknowledged) {
      pending.current = { key: question.key, value };
      setWarning(w);
      return;
    }

    pending.current = null;
    setWarning(null);

    update((s) => {
      const answers = { ...s.answers, ...patch };
      const nextQuestions = visibleQuestions(answers);
      const currentPos = nextQuestions.findIndex((q) => q.id === question.id);
      const nextIndex = (currentPos === -1 ? s.index : currentPos) + 1;
      const completed = nextIndex >= nextQuestions.length;
      const lead = {
        ...s.lead,
        cidade: (answers["cidade"] as string) ?? s.lead.cidade,
        estado: (answers["estado"] as string) ?? s.lead.estado,
        nome: (answers["nome"] as string) ?? s.lead.nome,
        telefone: (answers["telefone"] as string) ?? s.lead.telefone,
        email: (answers["email"] as string) ?? s.lead.email,
        status_quiz: completed ? ("concluido" as const) : ("em_andamento" as const),
        data_finalizacao_quiz: completed ? new Date().toISOString() : s.lead.data_finalizacao_quiz,
      };
      return {
        ...s,
        answers,
        lead,
        index: Math.min(nextIndex, nextQuestions.length - 1),
        ultima_pergunta_respondida: question.id,
        completed,
      };
    });

    trackEvent("question_answered", { question_id: question.id, key: question.key });
    if (index + 1 >= questions.length) trackEvent("quiz_completed", {});
  };

  const progress = ((index + 1) / questions.length) * 100;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 pb-12">
      <header className="sticky top-0 z-10 -mx-5 bg-background/90 px-5 pb-4 pt-5 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-9 px-2 text-muted-foreground"
            disabled={index === 0}
            onClick={() => {
              setWarning(null);
              pending.current = null;
              update((s) => ({ ...s, index: Math.max(0, s.index - 1), completed: false }));
            }}
          >
            <ArrowLeft className="mr-1 size-4" /> Voltar
          </Button>
          <span className="text-xs font-medium text-muted-foreground">
            Etapa {index + 1} de {questions.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </header>

      <main className="flex-1 pt-8">
        <QuestionCard
          key={question.id}
          question={question}
          answers={state.answers}
          warning={warning}
          onSubmit={handleSubmit}
        />
      </main>

      <footer className="pt-8 text-center text-xs text-muted-foreground">
        Suas respostas ficam salvas automaticamente neste dispositivo.
      </footer>
    </div>
  );
}
