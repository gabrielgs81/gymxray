export type ScorePoint = { value: number; score: number };

export const diagnosticConfig = {
  existingGym: {
    weights: { financial: 0.35, commercial: 0.25, retention: 0.25, operational: 0.15 },
    financial: { margin: 0.4, breakEven: 0.35, runway: 0.25 },
    commercial: { conversion: 0.5, acquisitionEfficiency: 0.3, acquisitionVolume: 0.2 },
    retention: { churn: 0.7, netGrowth: 0.3 },
    operational: { capacity: 0.4, peakPressure: 0.3, maintenance: 0.2, density: 0.1 },
  },
  expansion: {
    weights: {
      currentHealth: 0.3,
      financialCapacity: 0.25,
      demandEvidence: 0.25,
      managementCapacity: 0.2,
    },
  },
  newGym: {
    weights: {
      capitalStructure: 0.3,
      cashSafety: 0.2,
      operatingEconomics: 0.25,
      demandEvidence: 0.15,
      projectMaturity: 0.1,
    },
    economics: { breakEven6M: 0.35, breakEven12M: 0.4, projectedMargin: 0.25 },
  },
  curves: {
    operatingMargin: [
      { value: 0, score: 0 },
      { value: 0.05, score: 25 },
      { value: 0.1, score: 50 },
      { value: 0.15, score: 70 },
      { value: 0.2, score: 85 },
      { value: 0.3, score: 100 },
    ],
    breakEvenCoverage: [
      { value: 0.9, score: 0 },
      { value: 1, score: 25 },
      { value: 1.1, score: 50 },
      { value: 1.2, score: 70 },
      { value: 1.3, score: 85 },
      { value: 1.5, score: 100 },
    ],
    runway: [
      { value: 0, score: 0 },
      { value: 1, score: 20 },
      { value: 2, score: 40 },
      { value: 3, score: 60 },
      { value: 6, score: 90 },
      { value: 9, score: 100 },
    ],
    conversion: [
      { value: 0.05, score: 0 },
      { value: 0.1, score: 25 },
      { value: 0.2, score: 55 },
      { value: 0.3, score: 80 },
      { value: 0.4, score: 100 },
    ],
    churn: [
      { value: 0.02, score: 100 },
      { value: 0.03, score: 80 },
      { value: 0.05, score: 50 },
      { value: 0.08, score: 20 },
      { value: 0.1, score: 0 },
    ],
    netGrowth: [
      { value: -0.05, score: 0 },
      { value: -0.02, score: 20 },
      { value: 0, score: 45 },
      { value: 0.01, score: 60 },
      { value: 0.02, score: 75 },
      { value: 0.04, score: 90 },
      { value: 0.06, score: 100 },
    ],
    capitalCoverage: [
      { value: 0, score: 0 },
      { value: 0.5, score: 25 },
      { value: 0.8, score: 60 },
      { value: 1, score: 90 },
      { value: 1.1, score: 100 },
    ],
    cacLtvRatio: [
      { value: 0.1, score: 100 },
      { value: 0.2, score: 85 },
      { value: 0.33, score: 60 },
      { value: 0.5, score: 30 },
      { value: 0.75, score: 0 },
    ],
    cacTicketRatio: [
      { value: 0.5, score: 100 },
      { value: 1, score: 80 },
      { value: 2, score: 50 },
      { value: 4, score: 20 },
      { value: 6, score: 0 },
    ],
    acquisitionVolume: [
      { value: 0, score: 0 },
      { value: 0.02, score: 35 },
      { value: 0.05, score: 70 },
      { value: 0.1, score: 100 },
    ],
  } satisfies Record<string, ScorePoint[]>,
  hardRules: {
    expansion: {
      negativeMargin: { threshold: 0, maxScore: 40 },
      lowRunway: { threshold: 1, maxScore: 45 },
      lowCapitalCoverage: { threshold: 0.5, maxScore: 50 },
      negativeGrowthPenalty: 15,
    },
    newGym: {
      lowCapitalCoverage: { threshold: 0.5, maxScore: 50 },
      lowRunway: { threshold: 1, maxScore: 50 },
      noBreakEven12MPenalty: 20,
    },
  },
  thresholds: { highChurn: 0.08, lowConversion: 0.2, minimumRelevantLeads: 30 },
  confidence: {
    weights: { critical: 3, important: 2, optional: 1 },
    inconsistencyPenalty: 5,
    multipleInconsistencyPenalty: 10,
    subjectiveProjectionPenalty: 10,
  },
  classifications: {
    existing: [
      [0, 39, "situação crítica"],
      [40, 59, "atenção"],
      [60, 74, "estrutura razoável com gargalos"],
      [75, 89, "operação saudável"],
      [90, 100, "operação muito bem estruturada"],
    ],
    newGym: [
      [0, 39, "projeto com alto risco"],
      [40, 59, "projeto precisa de ajustes importantes"],
      [60, 74, "viabilidade parcial"],
      [75, 89, "projeto bem estruturado"],
      [90, 100, "forte estrutura para execução"],
    ],
    expansion: [
      [0, 39, "expansão não recomendada neste momento"],
      [40, 59, "existem gargalos importantes antes de expandir"],
      [60, 74, "expansão possível, mas exige ajustes"],
      [75, 89, "bons sinais para avaliar expansão"],
      [90, 100, "forte prontidão para expansão"],
    ],
    confidence: [
      [0, 39, "baixa confiança"],
      [40, 59, "confiança limitada"],
      [60, 79, "boa confiança"],
      [80, 100, "alta confiança"],
    ],
  } as const,
};

export const bottleneckLabels: Record<string, string> = {
  financeiro: "Financeiro",
  comercial: "Comercial",
  retencao: "Retenção",
  operacao: "Capacidade operacional",
};

export function classify(score: number, novo = false): string {
  const ranges = novo
    ? diagnosticConfig.classifications.newGym
    : diagnosticConfig.classifications.existing;
  return ranges.find(([min, max]) => score >= min && score <= max)?.[2] ?? ranges.at(-1)![2];
}

export function classifyExpansion(score: number): string {
  return (
    diagnosticConfig.classifications.expansion.find(
      ([min, max]) => score >= min && score <= max,
    )?.[2] ?? ""
  );
}

export function classifyConfidence(score: number): string {
  return (
    diagnosticConfig.classifications.confidence.find(
      ([min, max]) => score >= min && score <= max,
    )?.[2] ?? ""
  );
}
