import { AlertTriangle, Lock, Sparkles, Target, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { brl, int, pct } from "@/lib/quiz/format";
import type { DiagnosticResult } from "@/lib/quiz/types";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function LockedRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-secondary/40 px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Lock className="size-4 shrink-0 text-muted-foreground" />
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
  const { scores, metrics, diagnosis, path } = result;
  const novo = path === "novo_negocio";

  return (
    <div className="mx-auto w-full max-w-xl space-y-6 px-5 pb-16 pt-10">
      <div className="space-y-2 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          {novo ? "Analisamos seu projeto" : "Seu Raio-X foi concluído"}
        </p>
        <div className="surface-hero rounded-3xl border border-border p-8 shadow-soft">
          <p className="text-sm text-muted-foreground">Índice Raio-X</p>
          <p className="text-6xl font-bold tracking-tight text-primary">
            {scores.score_geral}
            <span className="text-2xl text-muted-foreground">/100</span>
          </p>
          <p className="mt-2 text-sm text-foreground/80 first-letter:uppercase">{diagnosis.classificacao}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Índice Raio-X é uma metodologia própria de leitura do seu negócio, não um benchmark
          oficial de mercado.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {novo ? (
          <>
            <Metric label="Investimento total informado" value={brl(metrics.investimento_total_estimado)} />
            <Metric
              label="Ponto de equilíbrio simplificado"
              value={metrics.ponto_equilibrio_alunos === null ? "—" : `${int(metrics.ponto_equilibrio_alunos)} alunos`}
            />
          </>
        ) : (
          <>
            <Metric label="Ticket médio estimado" value={brl(metrics.ticket_medio)} />
            <Metric label="Margem operacional estimada" value={pct(metrics.margem_operacional)} />
          </>
        )}
      </div>

      {!novo && (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <Target className="size-5 shrink-0 text-accent" />
          <p className="text-sm">
            Principal ponto de atenção: <strong>{diagnosis.principal_gargalo}</strong>
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <AlertTriangle className="size-5 shrink-0 text-warning" />
          <p className="text-sm">
            <strong>{diagnosis.alertas.length}</strong>{" "}
            {novo
              ? `ponto${diagnosis.alertas.length === 1 ? "" : "s"} de atenção pode${diagnosis.alertas.length === 1 ? "" : "m"} impactar a viabilidade`
              : `indicador${diagnosis.alertas.length === 1 ? "" : "es"} merece${diagnosis.alertas.length === 1 ? "" : "m"} atenção`}
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <Sparkles className="size-5 shrink-0 text-primary" />
          <p className="text-sm">
            Identificamos <strong>{diagnosis.oportunidades.length}</strong> oportunidade
            {diagnosis.oportunidades.length === 1 ? "" : "s"} de melhoria
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">Disponível no relatório completo</p>
        <LockedRow label="Análise detalhada de cada indicador" />
        {!novo && <LockedRow label="Todos os sub-scores (financeiro, comercial, retenção...)" />}
        {!novo && <LockedRow label="Churn, CAC, LTV e conversão comercial" />}
        {novo && <LockedRow label="Projeções de receita e margem em 6 e 12 meses" />}
        <LockedRow label="Alertas completos e plano de ação priorizado" />
        <LockedRow label="Leitura de expansão e capacidade de crescimento" />
      </div>

      <div className="grid gap-2">
        <Button size="lg" className="h-14 rounded-2xl text-base font-semibold" onClick={onCheckout}>
          Desbloquear relatório completo
        </Button>
        <Button variant="ghost" className="h-12 rounded-2xl text-muted-foreground" onClick={onRestart}>
          <RotateCcw className="mr-2 size-4" /> Refazer o Raio-X
        </Button>
      </div>
    </div>
  );
}
