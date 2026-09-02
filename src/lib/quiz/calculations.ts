import { diagnosticConfig, type ScorePoint } from "./config";
import type { Answers, Metrics, Path, Scores } from "./types";

export const num = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
const div = (a: number | null, b: number | null) =>
  a === null || b === null || b === 0 ? null : a / b;
const sum = (...values: (number | null)[]) =>
  values.every((v) => v === null)
    ? null
    : values.reduce<number>((total, value) => total + (value ?? 0), 0);
const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const studentRangeReference: Record<string, number | null> = {
  ate_150: 150,
  "150_300": 225,
  "300_500": 400,
  "500_800": 650,
  "800_1200": 1_000,
  acima_1200: 1_400,
  nao_sei: null,
};

const modelDensityReference: Record<string, number> = {
  bairro: 2,
  boutique_premium: 1.2,
  studio_personalizado: 0.8,
  condominio: 1,
  nao_defini: 1.2,
};

export const resolveStudentTarget = (answers: Answers) =>
  num(answers["alunos_projetados_12m"]) ??
  studentRangeReference[String(answers["meta_alunos_faixa"])] ??
  null;

export function interpolateScore(value: number, points: readonly ScorePoint[]): number {
  const ordered = [...points].sort((a, b) => a.value - b.value);
  if (value <= ordered[0]!.value) return ordered[0]!.score;
  if (value >= ordered.at(-1)!.value) return ordered.at(-1)!.score;
  const upperIndex = ordered.findIndex((point) => value <= point.value);
  const lower = ordered[upperIndex - 1]!;
  const upper = ordered[upperIndex]!;
  return (
    lower.score +
    ((value - lower.value) / (upper.value - lower.value)) * (upper.score - lower.score)
  );
}

export const calculateAverageTicket = (revenue: number | null, students: number | null) =>
  div(revenue, students);
export const calculateOperatingMargin = (revenue: number | null, costs: number | null) =>
  revenue === null || costs === null || revenue === 0 ? null : (revenue - costs) / revenue;
export const calculateBreakEven = (costs: number | null, ticket: number | null) =>
  div(costs, ticket);
export const calculateCAC = (marketing: number | null, enrollments: number | null) =>
  marketing !== null && marketing > 0 && enrollments !== null && enrollments > 0
    ? marketing / enrollments
    : null;
const choiceNum = (value: unknown): number | null => {
  const parsed = Number(value);
  return value !== null && value !== "" && Number.isFinite(parsed) ? parsed : null;
};
export const calculateConversion = (enrollments: number | null, leads: number | null) =>
  leads !== null && leads > 0 && enrollments !== null ? enrollments / leads : null;
export const calculateChurn = (cancellations: number | null, students: number | null) =>
  div(cancellations, students);
export const calculateLTV = (ticket: number | null, churn: number | null) =>
  ticket !== null && churn !== null && churn > 0 ? ticket / churn : null;
export const calculateRunway = (reserve: number | null, costs: number | null) =>
  div(reserve, costs);

export function computeMetrics(answers: Answers, path: Path): Metrics {
  const a = (key: string) => num(answers[key]);
  const base: Metrics = {
    investimento_estrutura: null,
    investimento_equipamentos: null,
    investimento_adequacao: null,
    investimento_total_planejado: null,
    total_alocado_investimento: null,
    saldo_alocacao_investimento: null,
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
    meta_alunos_referencia: null,
    densidade_alunos_planejada: null,
    score_compatibilidade_espaco: null,
    populacao_municipal_estimada: a("populacao_municipal_estimada"),
    participacao_populacao_necessaria: null,
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
    taxa_crescimento_liquido: null,
    ltv_simplificado: null,
    runway_meses: null,
    alunos_por_m2: null,
    receita_por_m2: null,
    gap_expansao: null,
    cobertura_capital_expansao: null,
    capital_efetivo_disponivel: null,
    financiamento_aprovado: null,
  };
  if (path === "novo_negocio") {
    base.investimento_equipamentos = a("investimento_equipamentos");
    base.investimento_adequacao = a("investimento_adequacao");
    base.investimento_estrutura =
      sum(base.investimento_equipamentos, base.investimento_adequacao) ??
      a("investimento_implantacao");
    base.investimento_total_planejado = a("investimento_total_planejado");
    base.total_alocado_investimento = sum(
      base.investimento_equipamentos,
      base.investimento_adequacao,
      a("capital_giro"),
    );
    base.investimento_total_estimado =
      base.investimento_total_planejado ??
      (a("investimento_implantacao") !== null
        ? sum(a("investimento_implantacao"), a("capital_giro"))
        : base.total_alocado_investimento);
    base.saldo_alocacao_investimento =
      base.investimento_total_planejado !== null && base.total_alocado_investimento !== null
        ? base.investimento_total_planejado - base.total_alocado_investimento
        : null;
    base.custo_operacional_mensal = sum(
      a("aluguel_mensal"),
      a("folha_mensal"),
      a("outros_custos_mensais"),
    );
    base.ponto_equilibrio_alunos = calculateBreakEven(
      base.custo_operacional_mensal,
      a("ticket_planejado"),
    );
    base.receita_6m =
      a("ticket_planejado") !== null && a("alunos_projetados_6m") !== null
        ? a("ticket_planejado")! * a("alunos_projetados_6m")!
        : null;
    base.meta_alunos_referencia = resolveStudentTarget(answers);
    base.participacao_populacao_necessaria = div(
      base.meta_alunos_referencia,
      base.populacao_municipal_estimada,
    );
    base.receita_12m =
      a("ticket_planejado") !== null && base.meta_alunos_referencia !== null
        ? a("ticket_planejado")! * base.meta_alunos_referencia
        : null;
    base.resultado_6m =
      base.receita_6m !== null && base.custo_operacional_mensal !== null
        ? base.receita_6m - base.custo_operacional_mensal
        : null;
    base.resultado_12m =
      base.receita_12m !== null && base.custo_operacional_mensal !== null
        ? base.receita_12m - base.custo_operacional_mensal
        : null;
    base.margem_6m = div(base.resultado_6m, base.receita_6m);
    base.margem_12m = div(base.resultado_12m, base.receita_12m);
    base.cobertura_break_even_6m = div(a("alunos_projetados_6m"), base.ponto_equilibrio_alunos);
    base.cobertura_break_even_12m = div(base.meta_alunos_referencia, base.ponto_equilibrio_alunos);
    base.meses_reserva = calculateRunway(a("capital_giro"), base.custo_operacional_mensal);
    base.financiamento_aprovado =
      answers["status_financiamento"] === "aprovado" ? a("financiamento_planejado") : 0;
    base.capital_efetivo_disponivel = sum(a("capital_disponivel"), base.financiamento_aprovado);
    base.gap_investimento =
      base.investimento_total_estimado !== null && base.capital_efetivo_disponivel !== null
        ? Math.max(0, base.investimento_total_estimado - base.capital_efetivo_disponivel)
        : null;
    base.cobertura_capital = div(base.capital_efetivo_disponivel, base.investimento_total_estimado);
    base.receita_por_m2 = div(base.receita_12m, a("area_m2"));
    base.alunos_por_m2 = div(base.meta_alunos_referencia, a("area_m2"));
    base.densidade_alunos_planejada = base.alunos_por_m2;
    if (base.densidade_alunos_planejada !== null) {
      const reference = modelDensityReference[String(answers["modelo_negocio"])] ?? 1.2;
      const ratio = base.densidade_alunos_planejada / reference;
      base.score_compatibilidade_espaco = clamp(
        ratio <= 1 ? 100 - Math.abs(0.7 - ratio) * 25 : 100 - (ratio - 1) * 70,
      );
    }
    return base;
  }
  const revenue = a("faturamento_mensal"),
    costs = a("custos_mensais"),
    students = a("alunos_ativos");
  base.ticket_medio = calculateAverageTicket(revenue, students);
  base.lucro_operacional_estimado = revenue !== null && costs !== null ? revenue - costs : null;
  base.margem_operacional = calculateOperatingMargin(revenue, costs);
  base.custo_por_aluno = div(costs, students);
  base.ponto_equilibrio_alunos = calculateBreakEven(costs, base.ticket_medio);
  base.folga_alunos =
    students !== null && base.ponto_equilibrio_alunos !== null
      ? students - base.ponto_equilibrio_alunos
      : null;
  base.indice_cobertura_break_even = div(students, base.ponto_equilibrio_alunos);
  base.taxa_conversao = calculateConversion(a("novas_matriculas"), a("leads_mensais"));
  base.cac_pago = calculateCAC(a("investimento_marketing"), a("novas_matriculas"));
  base.churn_aproximado = calculateChurn(a("cancelamentos_mensais"), students);
  base.crescimento_liquido =
    a("novas_matriculas") !== null && a("cancelamentos_mensais") !== null
      ? a("novas_matriculas")! - a("cancelamentos_mensais")!
      : null;
  base.taxa_crescimento_liquido = div(base.crescimento_liquido, students);
  base.ltv_simplificado = calculateLTV(base.ticket_medio, base.churn_aproximado);
  base.runway_meses = calculateRunway(a("reserva_caixa"), costs);
  base.alunos_por_m2 = div(students, a("area_m2"));
  base.receita_por_m2 = div(revenue, a("area_m2"));
  base.gap_expansao =
    a("investimento_expansao_estimado") !== null && a("capital_expansao_disponivel") !== null
      ? Math.max(0, a("investimento_expansao_estimado")! - a("capital_expansao_disponivel")!)
      : null;
  base.cobertura_capital_expansao = div(
    a("capital_expansao_disponivel"),
    a("investimento_expansao_estimado"),
  );
  return base;
}

const component = (value: number | null, curve: readonly ScorePoint[], weight: number) =>
  value === null ? 0 : interpolateScore(value, curve) * weight;
export function calculateFinancialScore(m: Metrics): number | null {
  if (m.margem_operacional === null || m.indice_cobertura_break_even === null) return null;
  const w = diagnosticConfig.existingGym.financial;
  return clamp(
    component(m.margem_operacional, diagnosticConfig.curves.operatingMargin, w.margin) +
      component(
        m.indice_cobertura_break_even,
        diagnosticConfig.curves.breakEvenCoverage,
        w.breakEven,
      ) +
      component(m.runway_meses, diagnosticConfig.curves.runway, w.runway),
  );
}
export function calculateCommercialScore(m: Metrics, answers: Answers): number | null {
  if (m.taxa_conversao === null) return null;
  const w = diagnosticConfig.existingGym.commercial;
  const efficiencyRatio =
    m.cac_pago !== null && m.ltv_simplificado !== null
      ? m.cac_pago / m.ltv_simplificado
      : m.cac_pago !== null && m.ticket_medio
        ? m.cac_pago / m.ticket_medio
        : null;
  const efficiencyCurve =
    m.ltv_simplificado !== null
      ? diagnosticConfig.curves.cacLtvRatio
      : diagnosticConfig.curves.cacTicketRatio;
  const acquisitionRate = div(num(answers["novas_matriculas"]), num(answers["alunos_ativos"]));
  return clamp(
    component(m.taxa_conversao, diagnosticConfig.curves.conversion, w.conversion) +
      component(efficiencyRatio, efficiencyCurve, w.acquisitionEfficiency) +
      component(acquisitionRate, diagnosticConfig.curves.acquisitionVolume, w.acquisitionVolume),
  );
}
export function calculateRetentionScore(m: Metrics): number | null {
  if (m.churn_aproximado === null || m.taxa_crescimento_liquido === null) return null;
  const w = diagnosticConfig.existingGym.retention;
  return clamp(
    component(m.churn_aproximado, diagnosticConfig.curves.churn, w.churn) +
      component(m.taxa_crescimento_liquido, diagnosticConfig.curves.netGrowth, w.netGrowth),
  );
}
export function calculateOperationalScore(m: Metrics, answers: Answers): number | null {
  const capacity = choiceNum(answers["capacidade_extra_20"]),
    peak = choiceNum(answers["pressao_horario_pico"]),
    maintenance = choiceNum(answers["frequencia_manutencao"]);
  if (capacity === null || peak === null || maintenance === null) return null;
  const w = diagnosticConfig.existingGym.operational;
  const density =
    m.alunos_por_m2 === null
      ? 50
      : Math.max(0, Math.min(100, 100 - Math.abs(m.alunos_por_m2 - 0.8) * 35));
  return clamp(
    ((4 - capacity) / 3) * 100 * w.capacity +
      ((5 - peak) / 4) * 100 * w.peakPressure +
      ((4 - maintenance) / 3) * 100 * w.maintenance +
      density * w.density,
  );
}
export function calculateOverallScore(scores: Omit<Scores, "score_geral">): number {
  const w = diagnosticConfig.existingGym.weights;
  return clamp(
    (scores.score_financeiro ?? 0) * w.financial +
      (scores.score_comercial ?? 0) * w.commercial +
      (scores.score_retencao ?? 0) * w.retention +
      (scores.score_operacional ?? 0) * w.operational,
  );
}

export function calculateExpansionReadiness(
  overall: number,
  m: Metrics,
  answers: Answers,
  managementVisibility: number,
): number | null {
  if (
    answers["objetivo_principal"] !== "expandir_atual" &&
    answers["objetivo_principal"] !== "segunda_unidade" &&
    answers["objetivo_12_meses"] !== "ampliar_estrutura" &&
    answers["objetivo_12_meses"] !== "abrir_outra_unidade"
  )
    return null;
  const coverageScore =
    m.cobertura_capital_expansao === null
      ? 0
      : interpolateScore(m.cobertura_capital_expansao, diagnosticConfig.curves.capitalCoverage);
  const financial =
    ((m.margem_operacional === null
      ? 0
      : interpolateScore(m.margem_operacional, diagnosticConfig.curves.operatingMargin)) +
      (m.runway_meses === null
        ? 0
        : interpolateScore(m.runway_meses, diagnosticConfig.curves.runway)) +
      coverageScore) /
    3;
  const demand =
    ((m.taxa_crescimento_liquido === null
      ? 0
      : interpolateScore(m.taxa_crescimento_liquido, diagnosticConfig.curves.netGrowth)) +
      (m.churn_aproximado === null
        ? 0
        : interpolateScore(m.churn_aproximado, diagnosticConfig.curves.churn)) +
      ((num(answers["pressao_horario_pico"]) ?? 1) / 5) * 100) /
    3;
  const w = diagnosticConfig.expansion.weights;
  let result =
    overall * w.currentHealth +
    financial * w.financialCapacity +
    demand * w.demandEvidence +
    managementVisibility * w.managementCapacity;
  const rules = diagnosticConfig.hardRules.expansion;
  if (m.margem_operacional !== null && m.margem_operacional <= rules.negativeMargin.threshold)
    result = Math.min(result, rules.negativeMargin.maxScore);
  if (m.runway_meses !== null && m.runway_meses < rules.lowRunway.threshold)
    result = Math.min(result, rules.lowRunway.maxScore);
  if (
    m.taxa_crescimento_liquido !== null &&
    m.taxa_crescimento_liquido < 0 &&
    (m.churn_aproximado ?? 0) >= diagnosticConfig.thresholds.highChurn
  )
    result -= rules.negativeGrowthPenalty;
  if (
    m.cobertura_capital_expansao !== null &&
    m.cobertura_capital_expansao < rules.lowCapitalCoverage.threshold &&
    answers["fonte_capital_expansao"] !== "definida"
  )
    result = Math.min(result, rules.lowCapitalCoverage.maxScore);
  return clamp(result);
}

const demandBasisScores: Record<string, number> = {
  clientes_existentes: 95,
  pre_venda: 85,
  pesquisa_regional: 65,
  experiencia_anterior: 75,
  estimativa_pessoal: 20,
  nao_sei: 0,
};
export function calculateNewGymScores(m: Metrics, answers: Answers) {
  const capital =
    m.cobertura_capital === null
      ? 0
      : interpolateScore(m.cobertura_capital, diagnosticConfig.curves.capitalCoverage);
  const cash =
    m.meses_reserva === null
      ? 0
      : interpolateScore(m.meses_reserva, diagnosticConfig.curves.runway);
  const e = diagnosticConfig.newGym.economics;
  const economics =
    component(m.cobertura_break_even_6m, diagnosticConfig.curves.breakEvenCoverage, e.breakEven6M) +
    component(
      m.cobertura_break_even_12m,
      diagnosticConfig.curves.breakEvenCoverage,
      e.breakEven12M,
    ) +
    component(m.margem_12m, diagnosticConfig.curves.operatingMargin, e.projectedMargin);
  const interested = num(answers["interessados_validados"]);
  const interestScore = interested === null ? 0 : Math.min(100, interested / 2);
  const demand = Math.round(
    (demandBasisScores[String(answers["base_projecao"])] ?? 0) * 0.65 + interestScore * 0.35,
  );
  const maturityChecks = [
    answers["modelo_negocio"] !== "nao_defini",
    ["pronto_definido", "em_obra"].includes(String(answers["possui_local"])),
    num(answers["area_m2"])! > 0,
    m.investimento_total_estimado !== null,
    m.saldo_alocacao_investimento === null || m.saldo_alocacao_investimento === 0,
    m.custo_operacional_mensal !== null,
    answers["prazo_abertura"] !== "nao_defini",
    answers["pretende_financiar"] !== "avaliando",
    num(answers["capital_giro"]) !== null,
  ];
  const maturity = Math.round(
    (maturityChecks.filter(Boolean).length / maturityChecks.length) * 100,
  );
  const w = diagnosticConfig.newGym.weights;
  let viability =
    capital * w.capitalStructure +
    cash * w.cashSafety +
    economics * w.operatingEconomics +
    demand * w.demandEvidence +
    maturity * w.projectMaturity;
  if (m.score_compatibilidade_espaco !== null)
    viability = viability * 0.9 + m.score_compatibilidade_espaco * 0.1;
  const rules = diagnosticConfig.hardRules.newGym;
  if (
    m.cobertura_capital !== null &&
    m.cobertura_capital < rules.lowCapitalCoverage.threshold &&
    answers["status_financiamento"] !== "aprovado"
  )
    viability = Math.min(viability, rules.lowCapitalCoverage.maxScore);
  if (m.meses_reserva !== null && m.meses_reserva < rules.lowRunway.threshold)
    viability = Math.min(viability, rules.lowRunway.maxScore);
  if (m.cobertura_break_even_12m !== null && m.cobertura_break_even_12m < 1)
    viability -= rules.noBreakEven12MPenalty;
  if (answers["base_projecao"] === "estimativa_pessoal") viability = Math.min(viability, 70);
  return {
    capital: clamp(capital),
    cash: clamp(cash),
    economics: clamp(economics),
    demand: clamp(demand),
    maturity: clamp(maturity),
    viability: clamp(viability),
  };
}

export function calculateManagementVisibility(answers: Answers): number {
  const keys = [
    "faturamento_mensal",
    "custos_mensais",
    "alunos_ativos",
    "cancelamentos_mensais",
    "novas_matriculas",
    "leads_mensais",
    "reserva_caixa",
  ];
  return Math.round(
    (keys.filter((key) => answers[key] !== null && answers[key] !== undefined).length /
      keys.length) *
      100,
  );
}
export function calculateDiagnosticConfidence(answers: Answers, path: Path): number {
  const existing = {
    faturamento_mensal: 3,
    custos_mensais: 3,
    alunos_ativos: 3,
    cancelamentos_mensais: 2,
    novas_matriculas: 2,
    leads_mensais: 2,
    investimento_marketing: 2,
    reserva_caixa: 2,
    area_m2: 1,
    frequencia_manutencao: 2,
    pressao_horario_pico: 2,
    capacidade_extra_20: 2,
  };
  const fresh = {
    capital_disponivel: 3,
    investimento_total_planejado: 3,
    investimento_equipamentos: 2,
    investimento_adequacao: 2,
    capital_giro: 3,
    aluguel_mensal: 3,
    folha_mensal: 3,
    outros_custos_mensais: 3,
    ticket_planejado: 3,
    alunos_projetados_6m: 2,
    alunos_projetados_12m: 3,
    base_projecao: 2,
    interessados_validados: 2,
    meta_alunos_faixa: 2,
    area_m2: 1,
    possui_local: 2,
    prazo_abertura: 1,
  };
  const fields = path === "novo_negocio" ? fresh : existing;
  const total = Object.values(fields).reduce((a, b) => a + b, 0);
  const answered = Object.entries(fields).reduce(
    (sum, [key, weight]) =>
      sum + (answers[key] !== null && answers[key] !== undefined ? weight : 0),
    0,
  );
  let confidence = (answered / total) * 100;
  const inconsistencies = [
    num(answers["cancelamentos_mensais"])! > num(answers["alunos_ativos"])!,
    num(answers["novas_matriculas"])! > num(answers["leads_mensais"])!,
    num(answers["area_m2"]) === 0,
    num(answers["ticket_planejado"]) === 0,
  ].filter(Boolean).length;
  confidence -=
    inconsistencies > 1
      ? diagnosticConfig.confidence.multipleInconsistencyPenalty
      : inconsistencies * diagnosticConfig.confidence.inconsistencyPenalty;
  if (answers["base_projecao"] === "estimativa_pessoal")
    confidence -= diagnosticConfig.confidence.subjectiveProjectionPenalty;
  return clamp(confidence);
}

export function calculateViabilityScore(m: Metrics, answers: Answers) {
  return calculateNewGymScores(m, answers).viability;
}
export function calculateGrowthScore() {
  return null;
}
export function calculatePreparationScore(answers: Answers) {
  let score = 0;
  if (answers["modelo_negocio"] && answers["modelo_negocio"] !== "nao_defini") score += 15;
  if ((num(answers["area_m2"]) ?? 0) > 0) score += 15;
  if (answers["meta_alunos_faixa"] && answers["meta_alunos_faixa"] !== "nao_sei") score += 15;
  if ((num(answers["investimento_total_planejado"]) ?? 0) > 0) score += 20;
  if ((num(answers["capital_disponivel"]) ?? 0) > 0) score += 15;
  if (answers["possui_local"] === "pronto_definido") score += 10;
  else if (answers["possui_local"] === "em_obra") score += 8;
  else if (answers["possui_local"] === "avaliando") score += 5;
  if (answers["forma_investimento"] && answers["forma_investimento"] !== "nao_defini") score += 5;
  if (answers["prazo_abertura"] && answers["prazo_abertura"] !== "nao_defini") score += 5;
  return clamp(score);
}
