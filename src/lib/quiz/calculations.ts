import { diagnosticConfig, scoreConfig } from "./config";
import type { Answers, Metrics, Path, Scores } from "./types";

/** Helpers ------------------------------------------------------------ */
export const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

const div = (a: number | null, b: number | null): number | null =>
  a === null || b === null || b === 0 ? null : a / b;

const sumOrNull = (...values: (number | null)[]): number | null => {
  const known = values.filter((v): v is number => v !== null);
  return known.length === 0 ? null : known.reduce((a, b) => a + b, 0);
};

/** Escala linear entre dois pontos, retornando 0..1 */
const scale = (value: number, worst: number, best: number): number => {
  if (best === worst) return 0;
  const t = (value - worst) / (best - worst);
  return Math.max(0, Math.min(1, t));
};

/** Funções de indicadores --------------------------------------------- */
export function calculateAverageTicket(faturamento: number | null, alunos: number | null) {
  return div(faturamento, alunos);
}

export function calculateOperatingMargin(faturamento: number | null, custos: number | null) {
  if (faturamento === null || custos === null || faturamento === 0) return null;
  return (faturamento - custos) / faturamento;
}

export function calculateBreakEven(custos: number | null, ticket: number | null) {
  const r = div(custos, ticket);
  return r === null ? null : Math.ceil(r);
}

export function calculateCAC(marketing: number | null, matriculas: number | null) {
  if (marketing === null || marketing <= 0) return null;
  if (matriculas === null || matriculas <= 0) return null;
  return marketing / matriculas;
}

export function calculateConversion(matriculas: number | null, leads: number | null) {
  if (leads === null || leads <= 0 || matriculas === null) return null;
  return matriculas / leads;
}

export function calculateChurn(cancelamentos: number | null, alunos: number | null) {
  return div(cancelamentos, alunos);
}

export function calculateLTV(ticket: number | null, churn: number | null) {
  if (ticket === null || churn === null || churn <= 0) return null;
  return ticket / churn;
}

export function calculateRunway(reserva: number | null, custos: number | null) {
  return div(reserva, custos);
}

export function calculateInvestmentGap(total: number | null, capital: number | null) {
  if (total === null || capital === null) return null;
  return Math.max(0, total - capital);
}

/** Motor de métricas --------------------------------------------------- */
export function computeMetrics(answers: Answers, path: Path): Metrics {
  const a = (k: string) => num(answers[k]);

  const m: Metrics = {
    investimento_estrutura: null,
    investimento_total_estimado: null,
    custo_operacional_mensal: null,
    ponto_equilibrio_alunos: null,
    receita_6m: null,
    receita_12m: null,
    resultado_6m: null,
    resultado_12m: null,
    margem_6m: null,
    margem_12m: null,
    cobertura_break_even_6m: null,
    cobertura_break_even_12m: null,
    meses_reserva: null,
    gap_investimento: null,
    cobertura_capital: null,
    ticket_medio: null,
    lucro_operacional_estimado: null,
    margem_operacional: null,
    custo_por_aluno: null,
    folga_alunos: null,
    indice_cobertura_break_even: null,
    taxa_conversao: null,
    cac_pago: null,
    churn_aproximado: null,
    crescimento_liquido: null,
    ltv_simplificado: null,
    runway_meses: null,
    alunos_por_m2: null,
    receita_por_m2: null,
    gap_expansao: null,
  };

  if (path === "novo_negocio") {
    m.investimento_estrutura = sumOrNull(
      a("investimento_equipamentos"),
      a("investimento_reforma"),
      a("custos_pre_operacionais"),
    );
    m.investimento_total_estimado = sumOrNull(m.investimento_estrutura, a("capital_giro"));
    m.custo_operacional_mensal = sumOrNull(
      a("aluguel_mensal"),
      a("folha_mensal"),
      a("outros_custos_mensais"),
    );
    m.ponto_equilibrio_alunos = calculateBreakEven(
      m.custo_operacional_mensal,
      a("ticket_planejado"),
    );
    const ticket = a("ticket_planejado");
    m.receita_6m =
      ticket !== null && a("alunos_projetados_6m") !== null
        ? ticket * a("alunos_projetados_6m")!
        : null;
    m.receita_12m =
      ticket !== null && a("alunos_projetados_12m") !== null
        ? ticket * a("alunos_projetados_12m")!
        : null;
    if (m.receita_6m !== null && m.custo_operacional_mensal !== null)
      m.resultado_6m = m.receita_6m - m.custo_operacional_mensal;
    if (m.receita_12m !== null && m.custo_operacional_mensal !== null)
      m.resultado_12m = m.receita_12m - m.custo_operacional_mensal;
    m.margem_6m = div(m.resultado_6m, m.receita_6m);
    m.margem_12m = div(m.resultado_12m, m.receita_12m);
    m.cobertura_break_even_6m = div(a("alunos_projetados_6m"), m.ponto_equilibrio_alunos);
    m.cobertura_break_even_12m = div(a("alunos_projetados_12m"), m.ponto_equilibrio_alunos);
    m.meses_reserva = calculateRunway(a("capital_giro"), m.custo_operacional_mensal);
    m.gap_investimento = calculateInvestmentGap(
      m.investimento_total_estimado,
      a("capital_disponivel"),
    );
    m.cobertura_capital = div(a("capital_disponivel"), m.investimento_total_estimado);
    m.receita_por_m2 = div(m.receita_12m, a("area_m2"));
    m.alunos_por_m2 = div(a("alunos_projetados_12m"), a("area_m2"));
    return m;
  }

  // Operação existente
  const faturamento = a("faturamento_mensal");
  const custos = a("custos_mensais");
  const alunos = a("alunos_ativos");

  m.ticket_medio = calculateAverageTicket(faturamento, alunos);
  if (faturamento !== null && custos !== null) m.lucro_operacional_estimado = faturamento - custos;
  m.margem_operacional = calculateOperatingMargin(faturamento, custos);
  m.custo_por_aluno = div(custos, alunos);
  m.ponto_equilibrio_alunos = calculateBreakEven(custos, m.ticket_medio);
  if (alunos !== null && m.ponto_equilibrio_alunos !== null)
    m.folga_alunos = alunos - m.ponto_equilibrio_alunos;
  m.indice_cobertura_break_even = div(alunos, m.ponto_equilibrio_alunos);
  m.taxa_conversao = calculateConversion(a("novas_matriculas"), a("leads_mensais"));
  m.cac_pago = calculateCAC(a("investimento_marketing"), a("novas_matriculas"));
  m.churn_aproximado = calculateChurn(a("cancelamentos_mensais"), alunos);
  if (a("novas_matriculas") !== null && a("cancelamentos_mensais") !== null)
    m.crescimento_liquido = a("novas_matriculas")! - a("cancelamentos_mensais")!;
  m.ltv_simplificado = calculateLTV(m.ticket_medio, m.churn_aproximado);
  m.runway_meses = calculateRunway(a("reserva_caixa"), custos);
  m.alunos_por_m2 = div(alunos, a("area_m2"));
  m.receita_por_m2 = div(faturamento, a("area_m2"));
  if (a("investimento_expansao_estimado") !== null && a("capital_expansao_disponivel") !== null)
    m.gap_expansao = a("investimento_expansao_estimado")! - a("capital_expansao_disponivel")!;

  return m;
}

/** Sub-scores ---------------------------------------------------------- */
type Part = { value: number; weight: number };

const weighted = (parts: (Part | null)[]): number | null => {
  const valid = parts.filter((p): p is Part => p !== null);
  if (valid.length === 0) return null;
  const totalWeight = valid.reduce((s, p) => s + p.weight, 0);
  return Math.round((valid.reduce((s, p) => s + p.value * p.weight, 0) / totalWeight) * 100);
};

export function calculateFinancialScore(m: Metrics): number | null {
  const cfg = diagnosticConfig;
  return weighted([
    m.margem_operacional === null
      ? null
      : { value: scale(m.margem_operacional, -0.15, cfg.margin.razoavel + 0.1), weight: 0.5 },
    m.indice_cobertura_break_even === null
      ? null
      : { value: scale(m.indice_cobertura_break_even, 0.6, cfg.breakEvenCoverage.saudavel), weight: 0.3 },
    m.runway_meses === null
      ? null
      : { value: scale(m.runway_meses, 0, cfg.runway.razoavel), weight: 0.2 },
  ]);
}

export function calculateCommercialScore(m: Metrics, answers: Answers): number | null {
  const cfg = diagnosticConfig.conversion;
  const matriculas = num(answers["novas_matriculas"]);
  const alunos = num(answers["alunos_ativos"]);
  const ritmo = matriculas !== null && alunos !== null && alunos > 0 ? matriculas / alunos : null;
  const cacRatio = m.cac_pago !== null && m.ticket_medio ? m.cac_pago / m.ticket_medio : null;
  return weighted([
    m.taxa_conversao === null
      ? null
      : { value: scale(m.taxa_conversao, 0, cfg.razoavel + 0.1), weight: 0.45 },
    cacRatio === null ? null : { value: scale(cacRatio, 4, 0.5), weight: 0.25 },
    ritmo === null ? null : { value: scale(ritmo, 0, 0.08), weight: 0.3 },
  ]);
}

export function calculateRetentionScore(m: Metrics, answers: Answers): number | null {
  const cfg = diagnosticConfig.churn;
  const alunos = num(answers["alunos_ativos"]);
  const growthRate =
    m.crescimento_liquido !== null && alunos !== null && alunos > 0
      ? m.crescimento_liquido / alunos
      : null;
  return weighted([
    m.churn_aproximado === null
      ? null
      : { value: scale(m.churn_aproximado, cfg.alto + 0.04, cfg.saudavel - 0.02), weight: 0.6 },
    growthRate === null ? null : { value: scale(growthRate, -0.05, 0.05), weight: 0.4 },
  ]);
}

export function calculateOperationalScore(m: Metrics, answers: Answers): number | null {
  const sat = num(answers["nivel_saturacao"]);
  // saturação ideal em torno de 3: nem ociosa, nem travando o crescimento
  const satScore = sat === null ? null : 1 - Math.abs(sat - 3) / 2.5;
  return weighted([
    satScore === null ? null : { value: Math.max(0, satScore), weight: 0.5 },
    m.receita_por_m2 === null ? null : { value: scale(m.receita_por_m2, 20, 160), weight: 0.25 },
    m.alunos_por_m2 === null ? null : { value: scale(m.alunos_por_m2, 0.1, 1.2), weight: 0.25 },
  ]);
}

export function calculateGrowthScore(m: Metrics, answers: Answers): number | null {
  const cfg = diagnosticConfig;
  const sat = num(answers["nivel_saturacao"]);
  const capital = num(answers["capital_expansao_disponivel"]);
  const investimento = num(answers["investimento_expansao_estimado"]);
  const cobertura =
    capital !== null && investimento !== null && investimento > 0 ? capital / investimento : null;
  return weighted([
    m.margem_operacional === null
      ? null
      : { value: scale(m.margem_operacional, 0, cfg.margin.razoavel), weight: 0.3 },
    m.crescimento_liquido === null
      ? null
      : { value: scale(m.crescimento_liquido, -10, 20), weight: 0.2 },
    m.runway_meses === null
      ? null
      : { value: scale(m.runway_meses, 0, cfg.runway.razoavel), weight: 0.2 },
    sat === null ? null : { value: scale(sat, 1, 5), weight: 0.15 },
    cobertura === null ? null : { value: scale(cobertura, 0, 1), weight: 0.15 },
  ]);
}

export function calculateOverallScore(scores: Omit<Scores, "score_geral">): number {
  const w = scoreConfig.weights;
  const parts: (Part | null)[] = [
    scores.score_financeiro === null
      ? null
      : { value: scores.score_financeiro / 100, weight: w.financeiro },
    scores.score_comercial === null
      ? null
      : { value: scores.score_comercial / 100, weight: w.comercial },
    scores.score_retencao === null
      ? null
      : { value: scores.score_retencao / 100, weight: w.retencao },
    scores.score_operacional === null
      ? null
      : { value: scores.score_operacional / 100, weight: w.operacional },
    scores.score_crescimento === null
      ? null
      : { value: scores.score_crescimento / 100, weight: w.crescimento },
  ];
  return weighted(parts) ?? 0;
}

/** Score de viabilidade — novo negócio --------------------------------- */
export function calculateViabilityScore(m: Metrics, answers: Answers): number {
  const p = scoreConfig.novoNegocioPoints;
  const cfg = diagnosticConfig;
  let total = 0;

  total += p.capacidade_financeira * (m.cobertura_capital === null ? 0.3 : scale(m.cobertura_capital, 0.2, 1.1));
  total += p.capital_giro * (m.meses_reserva === null ? 0.3 : scale(m.meses_reserva, 0, cfg.runway.razoavel));

  const sustent =
    (m.cobertura_break_even_6m === null ? 0.3 : scale(m.cobertura_break_even_6m, 0.4, 1.3)) * 0.5 +
    (m.cobertura_break_even_12m === null ? 0.3 : scale(m.cobertura_break_even_12m, 0.6, 1.6)) * 0.5;
  total += p.sustentabilidade_operacional * sustent;

  const proj =
    (m.margem_6m === null ? 0.3 : scale(m.margem_6m, -0.3, cfg.margin.razoavel)) * 0.4 +
    (m.margem_12m === null ? 0.3 : scale(m.margem_12m, -0.1, cfg.margin.razoavel + 0.1)) * 0.6;
  total += p.projecao_financeira * proj;

  const maturidadeChecks = [
    answers["prazo_abertura"] && answers["prazo_abertura"] !== "nao_defini",
    answers["modelo_negocio"] && answers["modelo_negocio"] !== "nao_defini",
    m.investimento_total_estimado !== null,
    m.custo_operacional_mensal !== null,
    num(answers["ticket_planejado"]) !== null,
  ];
  total += p.maturidade * (maturidadeChecks.filter(Boolean).length / maturidadeChecks.length);

  return Math.max(0, Math.min(100, Math.round(total)));
}
