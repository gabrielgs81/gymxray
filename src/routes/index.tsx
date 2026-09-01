import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, BarChart3, Gauge, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { QuizFlow } from "@/components/quiz/QuizFlow";
import { trackPageView } from "@/lib/quiz/analytics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Raio-X da Academia | Diagnóstico financeiro em 3 minutos" },
      {
        name: "description",
        content:
          "Responda perguntas simples sobre sua academia e descubra ticket médio, margem, ponto de equilíbrio, churn e viabilidade do seu projeto.",
      },
      { property: "og:title", content: "Raio-X da Academia" },
      {
        property: "og:description",
        content:
          "Diagnóstico automático da sua academia: margem, ponto de equilíbrio, churn, CAC e capacidade de expansão.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    void trackPageView();
  }, []);

  if (started) return <QuizFlow />;

  return (
    <div className="surface-hero min-h-screen">
      <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center gap-8 px-6 py-16">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            <Gauge className="size-3.5" /> Índice Raio-X
          </span>
          <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
            Descubra os números que sua academia nunca calculou
          </h1>
          <p className="text-pretty text-base text-muted-foreground">
            Perguntas simples sobre quanto entra, quanto sai e quantos alunos você tem. A partir
            disso calculamos ticket médio, margem, ponto de equilíbrio, cancelamento e capacidade de
            crescimento.
          </p>
        </div>

        <ul className="grid gap-3">
          {[
            { icon: BarChart3, text: "Diagnóstico automático em menos de 3 minutos" },
            { icon: ShieldCheck, text: "Serve para quem vai abrir e para quem já opera" },
            { icon: Gauge, text: "Seu progresso fica salvo se você sair e voltar" },
          ].map(({ icon: Icon, text }) => (
            <li
              key={text}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card/70 px-4 py-3 text-sm"
            >
              <Icon className="size-4 shrink-0 text-primary" />
              {text}
            </li>
          ))}
        </ul>

        <Button
          size="lg"
          className="h-16 w-full rounded-2xl text-base font-semibold shadow-glow"
          onClick={() => setStarted(true)}
        >
          Começar meu Raio-X <ArrowRight className="ml-1 size-5" />
        </Button>
      </main>
    </div>
  );
}
