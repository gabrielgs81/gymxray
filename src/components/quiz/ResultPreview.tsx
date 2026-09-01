import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Eye,
  Lock,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { brl, int, pct } from "@/lib/quiz/format";
import type { DiagnosticResult } from "@/lib/quiz/types";

function scoreTheme(score: number) {
  if (score < 40) return { color: "oklch(0.65 0.23 25)", label: "Zona crítica" };
  if (score < 60) return { color: "oklch(0.76 0.18 55)", label: "Zona de atenção" };
  if (score < 75) return { color: "oklch(0.82 0.16 85)", label: "Em desenvolvimento" };
  if (score < 90) return { color: "oklch(0.78 0.18 140)", label: "Estrutura saudável" };
  return { color: "oklch(0.8 0.2 155)", label: "Pronto para avançar" };
}

function AnimatedScore({ score }: { score: number }) {
  const [visible, setVisible] = useState(0);
  const theme = scoreTheme(score);
  const circumference = 2 * Math.PI * 74;
  useEffect(() => {
    let frame = 0;
    const startedAt = performance.now();
    const animate = (time: number) => {
      const progress = Math.min(1, (time - startedAt) / 1200);
      setVisible(Math.round(score * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);
  return (
    <div className="score-reveal relative mx-auto size-48">
      <svg className="size-full -rotate-90" viewBox="0 0 176 176" aria-hidden="true">
        <circle
          cx="88"
          cy="88"
          r="74"
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-border"
        />
        <circle
          cx="88"
          cy="88"
          r="74"
          fill="none"
          stroke={theme.color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
          className="score-ring"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-5xl font-bold tracking-tight" style={{ color: theme.color }}>
          {visible}
        </p>
        <p className="text-xs font-medium text-muted-foreground">de 100 pontos</p>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="result-card-enter rounded-2xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function LockedPreview({ label }: { label: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
          <Lock className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{label}</p>
          <div className="mt-2 flex gap-2 opacity-35 blur-[2px]">
            <span className="h-2 w-24 rounded-full bg-muted-foreground" />
            <span className="h-2 w-12 rounded-full bg-muted-foreground" />
          </div>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
          Bloqueado
        </span>
      </div>
    </div>
  );
}

export function ResultPreview({
  result,
  onRestart,
  onCheckout,
}: {
  result: DiagnosticResult;
  onRestart: () => void;
  onCheckout: () => void;
}) {
  const { scores, metrics, diagnosis, path, lead } = result;
  const novo = path === "novo_negocio";
  const exploratory = result.answers["objetivo_principal"] === "estudando";
  const theme = scoreTheme(scores.score_geral);
  const firstAlert = diagnosis.alertas[0];
  const firstOpportunity = diagnosis.oportunidades[0];
  return (
    <div className="mx-auto w-full max-w-xl space-y-6 px-5 pb-16 pt-8">
      <header className="result-header text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          <Sparkles className="size-3.5" /> Raio-X concluído
        </div>
        <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight">
          {lead.nome ? `${lead.nome}, seu diagnóstico revelou` : "Seu diagnóstico revelou"} pontos
          importantes
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta é uma prévia dos indicadores encontrados a partir das suas respostas.
        </p>
      </header>
      <section className="surface-hero rounded-3xl border border-border p-6 text-center shadow-soft">
        <AnimatedScore score={scores.score_geral} />
        <div
          className="mx-auto mt-2 inline-flex rounded-full px-3 py-1 text-sm font-bold"
          style={{
            color: theme.color,
            backgroundColor: `color-mix(in oklch, ${theme.color} 14%, transparent)`,
          }}
        >
          {theme.label}
        </div>
        <p className="mt-3 text-sm text-foreground/75 first-letter:uppercase">
          {diagnosis.classificacao}
        </p>
      </section>
      <section className="result-card-enter overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/12 via-card to-card p-5 shadow-soft">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck className="size-6" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Metodologia Raio-X
            </p>
            <h2 className="mt-2 text-xl font-semibold leading-snug">
              Uma análise construída a partir dos números reais do seu projeto.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {novo
                ? "Cruzamos capital, segurança de caixa, economia operacional, demanda e maturidade do projeto."
                : "Cruzamos indicadores financeiros, comerciais, de retenção e capacidade operacional."}{" "}
              Regras críticas impedem que uma média simples esconda riscos importantes.
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-primary/15 pt-4 text-center text-[11px] font-semibold text-foreground/75 sm:text-xs">
          <span>Cálculos objetivos</span>
          <span className="border-x border-primary/15 px-1">Indicadores cruzados</span>
          <span>Regras críticas</span>
        </div>
      </section>
      {scores.prontidao_expansao !== null && scores.prontidao_expansao !== undefined && (
        <div className="result-card-enter flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Prontidão para expansão
            </p>
            <p className="mt-1 text-xs text-muted-foreground first-letter:uppercase">
              {diagnosis.classificacao_expansao}
            </p>
          </div>
          <p className="shrink-0 text-2xl font-bold text-accent">{scores.prontidao_expansao}/100</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {exploratory ? (
          <>
            <Metric
              label="Capital disponível"
              value={
                typeof result.answers["capital_disponivel"] === "number"
                  ? brl(result.answers["capital_disponivel"])
                  : "—"
              }
            />
            <Metric
              label="Área considerada"
              value={
                typeof result.answers["area_m2"] === "number"
                  ? `${int(result.answers["area_m2"])} m²`
                  : "—"
              }
            />
          </>
        ) : novo ? (
          <>
            <Metric
              label="Investimento estimado"
              value={brl(metrics.investimento_total_estimado)}
            />
            <Metric
              label="Ponto de equilíbrio"
              value={
                metrics.ponto_equilibrio_alunos === null
                  ? "—"
                  : `${int(Math.ceil(metrics.ponto_equilibrio_alunos))} alunos`
              }
            />
          </>
        ) : (
          <>
            <Metric label="Ticket médio" value={brl(metrics.ticket_medio)} />
            <Metric label="Margem estimada" value={pct(metrics.margem_operacional)} />
          </>
        )}
      </div>
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">O que já podemos revelar</h2>
          <span className="inline-flex items-center gap-1 text-xs text-primary">
            <Eye className="size-3.5" /> Prévia
          </span>
        </div>
        {firstAlert && (
          <div className="result-card-enter rounded-2xl border border-warning/35 bg-warning/10 p-4">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-warning">
                  Ponto de atenção
                </p>
                <p className="mt-1 text-sm leading-relaxed">{firstAlert}</p>
              </div>
            </div>
          </div>
        )}
        {firstOpportunity && (
          <div className="result-card-enter rounded-2xl border border-primary/30 bg-primary/10 p-4">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Oportunidade identificada
                </p>
                <p className="mt-1 text-sm leading-relaxed">{firstOpportunity}</p>
              </div>
            </div>
          </div>
        )}
        {!novo && (
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <Target className="size-5 shrink-0 text-accent" />
            <p className="text-sm">
              Seu principal gargalo parece estar em <strong>{diagnosis.principal_gargalo}</strong>.
            </p>
          </div>
        )}
      </section>
      <section className="space-y-3 rounded-3xl border border-primary/25 bg-primary/5 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Existe mais por trás da sua nota
          </p>
          <h2 className="mt-1 text-xl font-bold">Desbloqueie a leitura completa</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Encontramos {diagnosis.alertas.length} alerta{diagnosis.alertas.length === 1 ? "" : "s"}{" "}
            e {diagnosis.oportunidades.length} oportunidade
            {diagnosis.oportunidades.length === 1 ? "" : "s"}. A prévia mostrou apenas uma parte.
          </p>
        </div>
        <LockedPreview label="Impacto financeiro dos seus gargalos" />
        <LockedPreview
          label={
            exploratory
              ? "Orçamento recomendado para implantação"
              : novo
                ? "Projeções para 6 e 12 meses"
                : "CAC, churn, LTV e conversão"
          }
        />
        <LockedPreview label="Plano de ação em ordem de prioridade" />
        <Button
          size="lg"
          className="group mt-2 h-14 w-full rounded-2xl text-base font-semibold shadow-glow"
          onClick={onCheckout}
        >
          Ver meu diagnóstico completo{" "}
          <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          <Lock className="mr-1 inline size-3" /> Acesso imediato após a liberação
        </p>
      </section>
      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        O Índice Raio-X é uma metodologia própria de leitura do negócio, não um benchmark oficial de
        mercado.
      </p>
      <Button
        variant="ghost"
        className="h-12 w-full rounded-2xl text-muted-foreground"
        onClick={onRestart}
      >
        <RotateCcw className="mr-2 size-4" /> Refazer o Raio-X
      </Button>
    </div>
  );
}
