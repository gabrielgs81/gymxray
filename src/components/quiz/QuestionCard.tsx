import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CityAutocomplete } from "./CityAutocomplete";
import { cn } from "@/lib/utils";
import { formatCurrencyInput, parseCurrencyInput } from "@/lib/quiz/format";
import type { Question } from "@/lib/quiz/questions";
import type { Answers } from "@/lib/quiz/types";

interface Props {
  question: Question;
  answers: Answers;
  warning: string | null;
  onSubmit: (patch: Answers) => void;
}

export function QuestionCard({ question, answers, warning, onSubmit }: Props) {
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    const seed: Record<string, string> = {};
    if (question.type === "currency") {
      const v = answers[question.key];
      seed[question.key] = typeof v === "number" ? formatCurrencyInput(v) : "";
    } else if (question.type === "location") {
      seed["cidade"] = (answers["cidade"] as string) ?? "";
      seed["estado"] = (answers["estado"] as string) ?? "";
      seed["municipio_ibge"] = String(answers["municipio_ibge"] ?? "");
    } else if (question.type === "contact") {
      seed["nome"] = (answers["nome"] as string) ?? "";
      seed["telefone"] = (answers["telefone"] as string) ?? "";
      seed["email"] = (answers["email"] as string) ?? "";
    } else {
      const v = answers[question.key];
      seed[question.key] = v === null || v === undefined ? "" : String(v);
    }
    setDraft(seed);
  }, [question, answers]);

  const canSubmit = useMemo(() => {
    if (question.type === "location") return !!draft["cidade"]?.trim() && !!draft["estado"];
    if (question.type === "contact")
      return !!draft["nome"]?.trim() && !!draft["telefone"]?.replace(/\D/g, "");
    if (question.type === "single") return true;
    return (draft[question.key] ?? "").trim() !== "";
  }, [draft, question]);

  function submitValue() {
    if (question.type === "location") {
      onSubmit({
        cidade: draft["cidade"]!.trim(),
        estado: draft["estado"]!,
        municipio_ibge: Number(draft["municipio_ibge"]) || null,
      });
      return;
    }
    if (question.type === "contact") {
      onSubmit({
        nome: draft["nome"]!.trim(),
        telefone: draft["telefone"]!.trim(),
        email: draft["email"]?.trim() || null,
      });
      return;
    }
    const raw = draft[question.key] ?? "";
    if (question.type === "currency") {
      onSubmit({ [question.key]: parseCurrencyInput(raw) });
      return;
    }
    if (question.type === "text") {
      onSubmit({ [question.key]: raw.trim() });
      return;
    }
    const n = Number(raw.replace(",", "."));
    onSubmit({
      [question.key]: Number.isFinite(n) ? (question.type === "integer" ? Math.round(n) : n) : null,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        {question.essential && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            <Star className="size-3" /> Pergunta essencial
          </span>
        )}
        <h1 className="text-balance text-2xl font-semibold leading-tight sm:text-3xl">
          {question.title}
        </h1>
        {question.help && <p className="text-sm text-muted-foreground">{question.help}</p>}
      </div>

      {question.type === "single" && (
        <div className="grid gap-3">
          {question.options?.map((opt, optionIndex) => {
            const selected = answers[question.key] === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSubmit({ [question.key]: opt.value })}
                className={cn(
                  "answer-option-enter group flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl border bg-card px-5 py-4 text-left text-base font-medium transition-all active:scale-[0.99]",
                  selected
                    ? "border-primary shadow-glow"
                    : "border-border hover:border-primary/60 hover:bg-secondary",
                )}
                style={{ animationDelay: `${optionIndex * 45}ms` }}
              >
                <span>{opt.label}</span>
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border",
                  )}
                >
                  {selected ? (
                    <Check className="size-4" />
                  ) : (
                    <ArrowRight className="size-3 opacity-40" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {(question.type === "currency" ||
        question.type === "integer" ||
        question.type === "number") && (
        <div className="space-y-3">
          <div className="relative">
            {question.type === "currency" && (
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
                R$
              </span>
            )}
            <Input
              autoFocus
              inputMode={question.type === "currency" ? "numeric" : "decimal"}
              value={draft[question.key] ?? ""}
              onChange={(e) => {
                const v =
                  question.type === "currency"
                    ? formatCurrencyInput(parseCurrencyInput(e.target.value))
                    : e.target.value.replace(/[^\d.,]/g, "");
                setDraft((d) => ({ ...d, [question.key]: v }));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSubmit) submitValue();
              }}
              placeholder={question.type === "currency" ? "0,00" : "0"}
              className={cn(
                "h-16 rounded-2xl bg-card text-xl font-semibold",
                question.type === "currency" ? "pl-12" : "pl-4",
                question.suffix && "pr-14",
              )}
            />
            {question.suffix && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base font-medium text-muted-foreground">
                {question.suffix}
              </span>
            )}
          </div>

          {question.options?.map((opt) => (
            <Button
              key={opt.value}
              type="button"
              variant="secondary"
              className="h-12 w-full rounded-2xl"
              onClick={() => onSubmit({ [question.key]: Number(opt.value) })}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      )}

      {question.type === "text" && (
        <Input
          autoFocus
          value={draft[question.key] ?? ""}
          onChange={(e) => setDraft((current) => ({ ...current, [question.key]: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canSubmit) submitValue();
          }}
          placeholder="Bairro, região ou endereço aproximado"
          className="h-16 rounded-2xl bg-card px-4 text-lg"
        />
      )}

      {question.type === "location" && (
        <CityAutocomplete
          city={draft["cidade"] ?? ""}
          uf={draft["estado"] ?? ""}
          onInput={(value) =>
            setDraft((current) => ({
              ...current,
              cidade: value,
              estado: "",
              municipio_ibge: "",
            }))
          }
          onSelect={(cidade, estado, municipioIbge) =>
            setDraft((current) => ({
              ...current,
              cidade,
              estado,
              municipio_ibge: String(municipioIbge),
            }))
          }
        />
      )}

      {question.type === "contact" && (
        <div className="grid gap-3">
          <Input
            autoFocus
            value={draft["nome"] ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, nome: e.target.value }))}
            placeholder="Seu nome"
            className="h-14 rounded-2xl bg-card text-lg"
          />
          <Input
            inputMode="tel"
            value={draft["telefone"] ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, telefone: e.target.value }))}
            placeholder="WhatsApp com DDD"
            className="h-14 rounded-2xl bg-card text-lg"
          />
          <Input
            inputMode="email"
            value={draft["email"] ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
            placeholder="E-mail (opcional)"
            className="h-14 rounded-2xl bg-card text-lg"
          />
        </div>
      )}

      {warning && (
        <p className="rounded-2xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
          {warning}
        </p>
      )}

      {question.type !== "single" && (
        <div className="grid gap-2">
          <Button
            size="lg"
            className="h-14 w-full rounded-2xl text-base font-semibold"
            disabled={!canSubmit}
            onClick={submitValue}
          >
            {warning ? "Sim, está correto" : "Continuar"}
            <ArrowRight className="ml-1 size-4" />
          </Button>
          {question.allowUnknown && (
            <Button
              variant="ghost"
              className="h-12 w-full rounded-2xl text-muted-foreground"
              onClick={() => onSubmit({ [question.key]: null })}
            >
              {question.unknownLabel ?? "Não sei informar"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
