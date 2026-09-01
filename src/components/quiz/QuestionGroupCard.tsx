import { useEffect, useMemo, useState } from "react";
import { ArrowRight, HelpCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { brl, int } from "@/lib/quiz/format";
import type { QuizStep, SliderConfig } from "@/lib/quiz/steps";
import type { Answers } from "@/lib/quiz/types";

function formatValue(value: number, type: string) {
  return type === "currency" ? brl(value) : int(value);
}

function SliderField({
  config,
  type,
  value,
  resolved,
  allowUnknown,
  unknownLabel,
  onChange,
  onUnknown,
}: {
  config: SliderConfig;
  type: string;
  value: number | null;
  resolved: boolean;
  allowUnknown?: boolean | undefined;
  unknownLabel?: string | undefined;
  onChange: (value: number) => void;
  onUnknown: () => void;
}) {
  const visualValue = value ?? config.min;

  return (
    <div className="slider-field rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <p className="max-w-[65%] text-sm font-medium leading-snug">{config.label}</p>
        <p
          className={resolved ? "text-lg font-bold text-primary" : "text-sm text-muted-foreground"}
        >
          {resolved && value !== null ? formatValue(value, type) : "Não informado"}
        </p>
      </div>
      <Slider
        min={config.min}
        max={config.max}
        step={config.step}
        value={[visualValue]}
        onValueChange={([next]) => next !== undefined && onChange(next)}
        className="py-2"
        aria-label={config.label}
      />
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{formatValue(config.min, type)}</span>
        <span>{formatValue(config.max, type)}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        <button
          type="button"
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => onChange(0)}
        >
          Definir como zero
        </button>
        {allowUnknown && (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            onClick={onUnknown}
          >
            <HelpCircle className="size-3.5" /> {unknownLabel ?? "Não sei informar"}
          </button>
        )}
      </div>
    </div>
  );
}

export function QuestionGroupCard({
  step,
  answers,
  warning,
  onSubmit,
}: {
  step: QuizStep;
  answers: Answers;
  warning: string | null;
  onSubmit: (patch: Answers) => void;
}) {
  const [draft, setDraft] = useState<Answers>({});
  const [resolved, setResolved] = useState<Set<string>>(new Set());

  useEffect(() => {
    const initial: Answers = {};
    const initialResolved = new Set<string>();
    for (const question of step.questions) {
      if (Object.prototype.hasOwnProperty.call(answers, question.key)) {
        initial[question.key] = answers[question.key] ?? null;
        initialResolved.add(question.key);
      } else {
        initial[question.key] = null;
      }
    }
    setDraft(initial);
    setResolved(initialResolved);
  }, [answers, step]);

  const canSubmit = useMemo(
    () => step.questions.every((question) => resolved.has(question.key)),
    [resolved, step.questions],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Responda em conjunto
        </p>
        <h1 className="text-balance text-2xl font-semibold leading-tight sm:text-3xl">
          {step.title}
        </h1>
        {step.help && <p className="text-sm text-muted-foreground">{step.help}</p>}
      </div>

      <div className="grid gap-3">
        {step.questions.map((question, index) => {
          const config = step.sliderConfigs?.[question.key];
          if (!config) return null;
          return (
            <div
              key={question.key}
              className="answer-option-enter"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <SliderField
                config={config}
                type={question.type}
                value={
                  typeof draft[question.key] === "number" ? (draft[question.key] as number) : null
                }
                resolved={resolved.has(question.key)}
                allowUnknown={question.allowUnknown}
                unknownLabel={question.unknownLabel}
                onChange={(value) => {
                  setDraft((current) => ({ ...current, [question.key]: value }));
                  setResolved((current) => new Set(current).add(question.key));
                }}
                onUnknown={() => {
                  setDraft((current) => ({ ...current, [question.key]: null }));
                  setResolved((current) => new Set(current).add(question.key));
                }}
              />
            </div>
          );
        })}
      </div>

      {warning && (
        <p className="rounded-2xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
          {warning}
        </p>
      )}

      <Button
        size="lg"
        className="group h-14 w-full rounded-2xl text-base font-semibold"
        disabled={!canSubmit}
        onClick={() => onSubmit(draft)}
      >
        {warning ? "Sim, os valores estão corretos" : "Analisar estes valores"}
        <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
      </Button>
      {!canSubmit && (
        <p className="-mt-3 text-center text-xs text-muted-foreground">
          Ajuste cada controle ou marque que ainda não sabe o valor.
        </p>
      )}
    </div>
  );
}
