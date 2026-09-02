import { classify, classifyConfidence, classifyExpansion, diagnosticConfig } from "./config";
import {
  calculateCommercialScore,
  calculateDiagnosticConfidence,
  calculateExpansionReadiness,
  calculateFinancialScore,
  calculateManagementVisibility,
  calculateNewGymScores,
  calculateOperationalScore,
  calculateOverallScore,
  calculatePreparationScore,
  calculateRetentionScore,
  computeMetrics,
  num,
} from "./calculations";
import type { Answers, Diagnosis, DiagnosticResult, Lead, Metrics, Path, Scores } from "./types";

export function resolvePath(answers: Answers): Path {
  const objective = answers["objetivo_principal"];
  return objective === "abrir_primeira" || objective === "estudando" || objective == null
    ? "novo_negocio"
    : "operacao_existente";
}
export function isExpansionPath(answers: Answers): boolean {
  return (
    ["expandir_atual", "segunda_unidade"].includes(String(answers["objetivo_principal"])) ||
    ["ampliar_estrutura", "abrir_outra_unidade"].includes(String(answers["objetivo_12_meses"]))
  );
}
const choice = (answers: Answers, key: string) => {
  const value = Number(answers[key]);
  return Number.isFinite(value) ? value : null;
};

export function detectMainBottleneck(scores: Scores, m: Metrics, answers: Answers): string {
  if ((m.margem_operacional ?? 0) < 0) return "Financeiro";
  if (
    (m.churn_aproximado ?? 0) >= diagnosticConfig.thresholds.highChurn &&
    (m.taxa_crescimento_liquido ?? 0) <= 0
  )
    return "Retenção";
  if (
    (num(answers["leads_mensais"]) ?? 0) >= diagnosticConfig.thresholds.minimumRelevantLeads &&
    (m.taxa_conversao ?? 1) < diagnosticConfig.thresholds.lowConversion
  )
    return "Comercial";
  if (
    (choice(answers, "pressao_horario_pico") ?? 0) >= 4 &&
    choice(answers, "capacidade_extra_20") === 4
  )
    return "Capacidade operacional";
  const candidates: [string, number | null][] = [
    ["Financeiro", scores.score_financeiro],
    ["Comercial", scores.score_comercial],
    ["Retenção", scores.score_retencao],
    ["Capacidade operacional", scores.score_operacional],
  ];
  return (
    candidates
      .filter((entry): entry is [string, number] => entry[1] !== null)
      .sort((a, b) => a[1] - b[1])[0]?.[0] ?? "Visibilidade de gestão"
  );
}

export function detectAlerts(m: Metrics, answers: Answers, path: Path): string[] {
  const alerts: string[] = [];
  if (path === "operacao_existente") {
    if ((m.lucro_operacional_estimado ?? 0) < 0) alerts.push("Operação mensal deficitária.");
    if (m.indice_cobertura_break_even !== null && m.indice_cobertura_break_even <= 1.1)
      alerts.push("Quantidade de alunos próxima ou abaixo do ponto de equilíbrio.");
    if ((m.taxa_crescimento_liquido ?? 0) < 0)
      alerts.push("Cancelamentos superiores às novas matrículas.");
    if (m.runway_meses !== null && m.runway_meses < 1)
      alerts.push("Reserva financeira inferior a um mês de operação.");
    if ((choice(answers, "pressao_horario_pico") ?? 0) >= 4)
      alerts.push("Alta pressão da estrutura nos horários de pico.");
    if (
      isExpansionPath(answers) &&
      m.cobertura_capital_expansao !== null &&
      m.cobertura_capital_expansao < 1
    )
      alerts.push("Expansão planejada sem cobertura integral do capital estimado.");
  } else {
    if (m.saldo_alocacao_investimento !== null && Math.abs(m.saldo_alocacao_investimento) > 0)
      alerts.push("A distribuição do investimento não corresponde ao capital total planejado.");
    if (m.cobertura_capital !== null && m.cobertura_capital < 1)
      alerts.push("O capital efetivamente disponível não cobre o investimento estimado.");
    if (m.meses_reserva !== null && m.meses_reserva < 1)
      alerts.push("Capital de giro inferior a um mês de operação.");
    if (m.cobertura_break_even_12m !== null && m.cobertura_break_even_12m < 1)
      alerts.push("A projeção ainda não atinge o ponto de equilíbrio em 12 meses.");
    if (answers["base_projecao"] === "estimativa_pessoal")
      alerts.push("A projeção de alunos está baseada apenas em estimativa pessoal.");
    if (
      m.densidade_alunos_planejada !== null &&
      m.score_compatibilidade_espaco !== null &&
      (m.densidade_alunos_planejada > 2 || m.score_compatibilidade_espaco < 55)
    )
      alerts.push(
        "A meta de alunos tende a pressionar a área disponível e exigirá uma seleção muito eficiente de equipamentos.",
      );
  }
  return alerts;
}

export function detectOpportunities(m: Metrics, answers: Answers, path: Path): string[] {
  const opportunities: string[] = [];
  if (path === "operacao_existente") {
    if (
      (num(answers["leads_mensais"]) ?? 0) >= diagnosticConfig.thresholds.minimumRelevantLeads &&
      (m.taxa_conversao ?? 1) < diagnosticConfig.thresholds.lowConversion
    )
      opportunities.push(
        "Existe oportunidade de aumentar matrículas melhorando o processo comercial antes de investir mais em aquisição.",
      );
    if ((m.churn_aproximado ?? 1) <= 0.03 && (m.ticket_medio ?? 999) < 120)
      opportunities.push("A boa retenção indica espaço para avaliar preços e estrutura de planos.");
    if (
      (m.margem_operacional ?? 0) >= 0.15 &&
      (m.taxa_crescimento_liquido ?? 0) > 0 &&
      (choice(answers, "pressao_horario_pico") ?? 0) >= 4
    )
      opportunities.push(
        "Os indicadores mostram sinais favoráveis para estudar ampliação da capacidade.",
      );
  } else {
    if ((m.cobertura_capital ?? 0) < 1)
      opportunities.push(
        "Revisar o escopo inicial pode reduzir o gap de capital sem comprometer a proposta do projeto.",
      );
    if ((num(answers["interessados_validados"]) ?? 0) > 0)
      opportunities.push(
        "A demanda já identificada pode ser convertida em uma estratégia de pré-venda antes da inauguração.",
      );
    if (
      m.densidade_alunos_planejada !== null &&
      m.densidade_alunos_planejada <= 0.5 &&
      num(answers["area_m2"]) !== null
    )
      opportunities.push(
        "A área parece ampla para a meta inicial; uma implantação em fases pode preservar capital sem preencher o espaço com máquinas desnecessárias.",
      );
  }
  return opportunities;
}

export function buildDiagnostic(answers: Answers, lead: Lead): DiagnosticResult {
  const path = resolvePath(answers);
  const metrics = computeMetrics(answers, path);
  const exploratory = answers["objetivo_principal"] === "estudando";
  const confidence = exploratory
    ? calculatePreparationScore(answers)
    : calculateDiagnosticConfidence(answers, path);
  const managementVisibility =
    path === "operacao_existente" ? calculateManagementVisibility(answers) : 100;
  let scores: Scores;
  if (exploratory) {
    scores = {
      score_geral: confidence,
      score_viabilidade: confidence,
      score_financeiro: null,
      score_comercial: null,
      score_retencao: null,
      score_operacional: null,
      score_crescimento: null,
      confianca_diagnostico: confidence,
      visibilidade_gestao: confidence,
    };
  } else if (path === "novo_negocio") {
    const fresh = calculateNewGymScores(metrics, answers);
    scores = {
      score_geral: fresh.viability,
      score_viabilidade: fresh.viability,
      score_financeiro: null,
      score_comercial: null,
      score_retencao: null,
      score_operacional: null,
      score_crescimento: null,
      score_estrutura_capital: fresh.capital,
      score_seguranca_caixa: fresh.cash,
      score_economia_operacional: fresh.economics,
      score_evidencia_demanda: fresh.demand,
      score_maturidade_projeto: fresh.maturity,
      confianca_diagnostico: confidence,
      visibilidade_gestao: 100,
    };
  } else {
    const partial = {
      score_financeiro: calculateFinancialScore(metrics),
      score_comercial: calculateCommercialScore(metrics, answers),
      score_retencao: calculateRetentionScore(metrics),
      score_operacional: calculateOperationalScore(metrics, answers),
      score_crescimento: null,
    };
    const overall = calculateOverallScore({
      ...partial,
      confianca_diagnostico: confidence,
      visibilidade_gestao: managementVisibility,
    });
    const expansion = calculateExpansionReadiness(overall, metrics, answers, managementVisibility);
    scores = {
      ...partial,
      score_geral: overall,
      prontidao_expansao: expansion,
      confianca_diagnostico: confidence,
      visibilidade_gestao: managementVisibility,
    };
  }
  const diagnosis: Diagnosis = {
    classificacao: exploratory
      ? "planejamento em construção"
      : classify(scores.score_geral, path === "novo_negocio"),
    principal_gargalo: exploratory
      ? "Definição financeira e operacional do projeto"
      : path === "novo_negocio"
        ? "Estruturação do projeto"
        : detectMainBottleneck(scores, metrics, answers),
    alertas: exploratory
      ? ["Ainda faltam dados para calcular a viabilidade financeira."]
      : detectAlerts(metrics, answers, path),
    oportunidades: exploratory
      ? ["Transformar o capital disponível em um orçamento detalhado é o próximo passo."]
      : detectOpportunities(metrics, answers, path),
    classificacao_expansao:
      scores.prontidao_expansao === null || scores.prontidao_expansao === undefined
        ? null
        : classifyExpansion(scores.prontidao_expansao),
    classificacao_confianca: classifyConfidence(confidence),
    parcial: confidence < 80,
  };
  if (managementVisibility < 70 && path === "operacao_existente")
    diagnosis.alertas.push("Baixa visibilidade sobre indicadores essenciais de gestão.");
  return {
    lead,
    profile: {
      objetivo_principal: String(answers["objetivo_principal"] ?? "") || null,
      modelo_negocio: String(answers["modelo_negocio"] ?? "") || null,
      cidade: String(answers["cidade"] ?? "") || null,
      estado: String(answers["estado"] ?? "") || null,
      area_m2: num(answers["area_m2"]),
    },
    answers,
    metrics,
    scores,
    diagnosis,
    path,
  };
}
