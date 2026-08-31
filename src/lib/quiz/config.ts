/**
 * Configuração central da metodologia "Índice Raio-X".
 * Todos os thresholds são parâmetros iniciais e podem ser editados aqui,
 * sem tocar em nenhum componente.
 */

export const scoreConfig = {
  ranges: [
    { min: 0, max: 39, label: "situação crítica", labelNovo: "projeto em alto risco" },
    { min: 40, max: 59, label: "atenção", labelNovo: "projeto precisa de ajustes importantes" },
    {
      min: 60,
      max: 74,
      label: "estrutura razoável com gargalos",
      labelNovo: "projeto com viabilidade parcial",
    },
    { min: 75, max: 89, label: "operação saudável", labelNovo: "projeto bem estruturado" },
    {
      min: 90,
      max: 100,
      label: "operação muito bem estruturada",
      labelNovo: "projeto com forte estrutura financeira",
    },
  ],
  weights: {
    financeiro: 0.3,
    comercial: 0.2,
    retencao: 0.2,
    operacional: 0.15,
    crescimento: 0.15,
  },
  novoNegocioPoints: {
    capacidade_financeira: 30,
    capital_giro: 20,
    sustentabilidade_operacional: 25,
    projecao_financeira: 15,
    maturidade: 10,
  },
};

export const diagnosticConfig = {
  margin: {
    critico: 0,
    muito_baixo: 0.05,
    atencao: 0.1,
    razoavel: 0.2,
  },
  churn: {
    saudavel: 0.03,
    atencao: 0.05,
    alto: 0.08,
  },
  conversion: {
    critica: 0.1,
    baixa: 0.2,
    razoavel: 0.3,
  },
  runway: {
    critico: 1,
    baixo: 2,
    atencao: 3,
    razoavel: 6,
  },
  coberturaCapital: {
    critico: 0.5,
    baixo: 0.8,
    ok: 1,
  },
  breakEvenCoverage: {
    critico: 1,
    atencao: 1.2,
    saudavel: 1.5,
  },
  saturacao: {
    ociosa: 1,
    ideal: 3,
    saturada: 5,
  },
  leadsAltos: 60,
};

export const bottleneckLabels: Record<string, string> = {
  financeiro: "Financeiro",
  comercial: "Comercial",
  retencao: "Retenção",
  operacao: "Operação",
  crescimento: "Crescimento",
};

export function classify(score: number, novo = false): string {
  const ranges = scoreConfig.ranges;
  const range = ranges.find((r) => score >= r.min && score <= r.max) ?? ranges[ranges.length - 1]!;
  return novo ? range.labelNovo : range.label;
}
