import { ArrowRight, Check, MapPin, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { resolvePath } from "@/lib/quiz/diagnosis";
import type { Answers } from "@/lib/quiz/types";

export function TrailUnlock({ answers, onContinue }: { answers: Answers; onContinue: () => void }) {
  const novo = resolvePath(answers) === "novo_negocio";
  const exploratory = answers["objetivo_principal"] === "estudando";
  const cidade = [answers["cidade"], answers["estado"]].filter(Boolean).join(" · ");
  const trail = exploratory
    ? "Planejamento de Abertura"
    : novo
      ? "Viabilidade de Abertura"
      : "Performance e Crescimento";
  const topics = exploratory
    ? ["Definição do projeto", "Capacidade de investimento", "Próximos passos"]
    : novo
      ? ["Investimento", "Ponto de equilíbrio", "Projeção financeira"]
      : ["Saúde financeira", "Aquisição e retenção", "Potencial de crescimento"];

  return (
    <section className="unlock-screen flex min-h-[70vh] flex-col items-center justify-center py-8 text-center">
      <div className="lock-stage" aria-hidden="true">
        <span className="lock-ring lock-ring-one" />
        <span className="lock-ring lock-ring-two" />
        <div className="lock-icon">
          <span className="lock-shackle" />
          <span className="lock-body">
            <span className="lock-keyhole" />
          </span>
        </div>
        <span className="unlock-spark unlock-spark-one" />
        <span className="unlock-spark unlock-spark-two" />
        <span className="unlock-spark unlock-spark-three" />
      </div>

      <div className="unlock-copy mt-7">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          <Sparkles className="size-3.5" /> Trilha exclusiva liberada
        </div>
        <h1 className="mt-4 text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          Sua trilha de {trail} está pronta
        </h1>
        <p className="mx-auto mt-3 max-w-md text-pretty leading-relaxed text-muted-foreground">
          Criamos uma sequência de análise baseada no seu momento. A partir de agora, cada resposta
          libera uma parte do seu Raio-X.
        </p>
        {cidade && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80">
            <MapPin className="size-4 text-primary" /> {cidade}
          </p>
        )}
      </div>

      <div className="unlock-topics mt-7 grid w-full max-w-md gap-2 text-left">
        {topics.map((topic, index) => (
          <div
            key={topic}
            className="unlock-topic flex items-center gap-3 rounded-2xl border border-border bg-card/80 px-4 py-3 text-sm"
            style={{ animationDelay: `${1.15 + index * 0.12}s` }}
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Check className="size-3.5" />
            </span>
            {topic}
          </div>
        ))}
      </div>

      <Button
        size="lg"
        className="unlock-action group mt-7 h-14 w-full max-w-md rounded-2xl text-base font-semibold shadow-glow"
        onClick={onContinue}
      >
        Iniciar minha trilha
        <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
      </Button>
    </section>
  );
}
