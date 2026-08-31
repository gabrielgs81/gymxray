import { bottleneckLabels, classify, diagnosticConfig } from "./config";
import {
  calculateCommercialScore,
  calculateFinancialScore,
  calculateGrowthScore,
  calculateOperationalScore,
  calculateOverallScore,
  calculateRetentionScore,
  calculateViabilityScore,
  computeMetrics,
  num,
} from "./calculations";
import type { Answers, Diagnosis, DiagnosticResult, Lead, Metrics, Path, Scores } from "./types";

export function resolvePath(answers: Answers): Path {
  const obj = answers["objetivo_principal"];
  return obj === "abrir_primeira" || obj === "estudando" || obj == null
    ? "novo_negocio"
    : "operacao_existente";
}

export function isExpansionPath(answers: Answers): boolean {
  const obj = answers["objetivo_principal"];
  const obj12 = answers["objetivo_12_meses"];
  return (
    obj === "expandir_atual" ||
    obj === "segunda_unidade" ||
    obj12 === "ampliar_estrutura" ||
    obj12 === "abrir_outra_unidade"
  );
}

export function detectMainBottleneck(scores: Scores, m: Metrics, answers: Answers): string {
  const entries: [string, number | null][] = [
    ["financeiro", scores.score_financeiro],
    ["comercial", scores.score_comercial],
    ["retencao", scores.score_retencao],
    ["operacao", scores.score_operacional],
    ["crescimento", scores.score_crescimento],
  ];
  const known = entries.filter((e): e is [string, number] => e[1] !== null);
  let key = known.length ? known.sort((a, b) => a[1] - b[1])[0]![0] : "financeiro";

  // Regras críticas que sobrescrevem
  const leads = num(answers["leads_mensais"]);
  if (
    m.crescimento_liquido !== null &&
    m.crescimento_liquido < 0 &&
    m.churn_aproximado !== null &&
    m.churn_aproximado > diagnosticConfig.churn.atencao
  ) {
    key = "retencao";
  }
  if (
    leads !== null &&
    leads >= diagnosticConfig.leadsAltos &&
    m.taxa_conversao !== null &&
    m.taxa_conversao < diagnosticConfig.conversion.baixa
  ) {
    key = "comercial";
  }
  if (m.margem_operacional !== null && m.margem_operacional < 0) {
    key = "financeiro";
  }
  return bottleneckLabels[key] ?? "Financeiro";
}

export function detectAlerts(m: Metrics, answers: Answers, path: Path): string[] {
  const out: string[] = [];
  const cfg = diagnosticConfig;

  if (path === "operacao_existente") {
    if (m.lucro_operacional_estimado !== null && m.lucro_operacional_estimado < 0)
      out.push("Operação mensal deficitária.");
    if (m.folga_alunos !== null && m.folga_alunos < 0)
      out.push("Quantidade atual de alunos abaixo do ponto de equilíbrio simplificado.");
    if (m.crescimento_liquido !== null && m.crescimento_liquido < 0)
      out.push("A academia está perdendo alunos mais rápido do que consegue repor.");
    if (m.runway_meses !== null && m.runway_meses < cfg.runway.critico)
      out.push("Baixa reserva financeira em relação ao custo mensal.");
    if (m.churn_aproximado !== null && m.churn_aproximado > cfg.churn.alto)
      out.push("Taxa estimada de cancelamento mensal acima do patamar considerado saudável.");
    if (m.taxa_conversao !== null && m.taxa_conversao < cfg.conversion.critica)
      out.push("Conversão comercial baixa em relação ao volume de contatos recebidos.");
    if (isExpansionPath(answers) && m.margem_operacional !== null && m.margem_operacional < 0)
      out.push(
        "Expansão pode ampliar gargalos existentes antes que a operação atual seja corrigida.",
      );
    if (m.gap_expansao !== null && m.gap_expansao > 0)
      out.push("O capital disponível hoje não cobre o investimento estimado para a expansão.");
  } else {
    if (m.gap_investimento !== null && m.gap_investimento > 0)
      out.push("O capital disponível não cobre o investimento total estimado do projeto.");
    if (m.meses_reserva !== null && m.meses_reserva < cfg.runway.critico)
      out.push("Capital de giro reservado abaixo de um mês de operação.");
    if (m.cobertura_break_even_6m !== null && m.cobertura_break_even_6m < 1)
      out.push("A projeção de alunos em 6 meses fica abaixo do ponto de equilíbrio simplificado.");
    if (m.cobertura_break_even_12m !== null && m.cobertura_break_even_12m < 1)
      out.push("A projeção de alunos em 12 meses ainda não cobre o custo mensal estimado.");
    if (m.margem_12m !== null && m.margem_12m < cfg.margin.muito_baixo)
      out.push("Margem projetada em 12 meses muito baixa para sustentar imprevistos.");
  }
  return out;
}

export function detectOpportunities(m: Metrics, answers: Answers, path: Path): string[] {
  const out: string[] = [];
  const cfg = diagnosticConfig;
  const sat = num(answers["nivel_saturacao"]);
  const leads = num(answers["leads_mensais"]);

  if (path === "operacao_existente") {
    if (sat !== null && sat >= 4 && m.margem_operacional !== null && m.margem_operacional > 0)
      out.push("Possível oportunidade de expansão física ou aumento de capacidade.");
    if (
      leads !== null &&
      leads >= cfg.leadsAltos &&
      m.taxa_conversao !== null &&
      m.taxa_conversao < cfg.conversion.baixa
    )
      out.push(
        "Existe oportunidade de aumentar matrículas melhorando o processo comercial sem necessariamente aumentar o investimento em marketing.",
      );
    if (
      m.ticket_medio !== null &&
      m.ticket_medio < 120 &&
      m.churn_aproximado !== null &&
      m.churn_aproximado < cfg.churn.atencao
    )
      out.push("Existe oportunidade de revisar precificação e estrutura de planos.");
    if (
      m.margem_operacional !== null &&
      m.margem_operacional > cfg.margin.atencao &&
      m.crescimento_liquido !== null &&
      m.crescimento_liquido > 0 &&
      m.runway_meses !== null &&
      m.runway_meses > cfg.runway.atencao
    )
      out.push("A operação apresenta indicadores favoráveis para avaliar expansão.");
    if (m.cac_pago === null && num(answers["investimento_marketing"]) === 0)
      out.push(
        "Aquisição predominantemente orgânica ou não mensurada: há espaço para estruturar canais pagos com meta de custo por matrícula.",
      );
    if (sat !== null && sat <= 2)
      out.push("Há capacidade ociosa disponível para crescer sem novo investimento em estrutura.");
  } else {
    if (m.cobertura_capital !== null && m.cobertura_capital < 1)
      out.push(
        "Ajustar o escopo inicial do projeto pode reduzir o investimento necessário e aumentar a segurança financeira da abertura.",
      );
    if (m.meses_reserva !== null && m.meses_reserva < cfg.runway.atencao)
      out.push(
        "Aumentar o capital de giro reservado tende a elevar bastante a chance de atravessar os primeiros meses.",
      );
    if (m.margem_12m !== null && m.margem_12m > cfg.margin.atencao)
      out.push("A projeção de 12 meses indica potencial de margem saudável se as metas se confirmarem.");
    out.push("Revisar ticket e mix de planos antes da abertura pode antecipar o ponto de equilíbrio.");
  }
  return out;
}

export function buildDiagnostic(answers: Answers, lead: Lead): DiagnosticResult {
  const path = resolvePath(answers);
  const metrics = computeMetrics(answers, path);

  let scores: Scores;
  if (path === "novo_negocio") {
    const viab = calculateViabilityScore(metrics, answers);
    scores = {
      score_geral: viab,
      score_viabilidade: viab,
      score_financeiro: null,
      score_comercial: null,
      score_retencao: null,
      score_operacional: null,
      score_crescimento: null,
    };
  } else {
    const partial = {
      score_financeiro: calculateFinancialScore(metrics),
      score_comercial: calculateCommercialScore(metrics, answers),
      score_retencao: calculateRetentionScore(metrics, answers),
      score_operacional: calculateOperationalScore(metrics, answers),
      score_crescimento: calculateGrowthScore(metrics, answers),
    };
    scores = { ...partial, score_geral: calculateOverallScore(partial) };
  }

  const diagnosis: Diagnosis = {
    classificacao: classify(scores.score_geral, path === "novo_negocio"),
    principal_gargalo:
      path === "novo_negocio"
        ? "Estruturação financeira do projeto"
        : detectMainBottleneck(scores, metrics, answers),
    alertas: detectAlerts(metrics, answers, path),
    oportunidades: detectOpportunities(metrics, answers, path),
  };

  return {
    lead,
    profile: {
      objetivo_principal: (answers["objetivo_principal"] as string) ?? null,
      modelo_negocio: (answers["modelo_negocio"] as string) ?? null,
      cidade: (answers["cidade"] as string) ?? null,
      estado: (answers["estado"] as string) ?? null,
      area_m2: num(answers["area_m2"]),
    },
    answers,
    metrics,
    scores,
    diagnosis,
    path,
  };
}
