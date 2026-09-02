import { QUESTIONS, visibleQuestions, type Question } from "./questions";
import { isExpansionPath, resolvePath } from "./diagnosis";
import type { Answers } from "./types";

export type SliderConfig = {
  min: number;
  max: number;
  step: number;
  label: string;
};

export type QuizStep = {
  id: string;
  title?: string | undefined;
  help?: string | undefined;
  questions: Question[];
  sliderConfigs?: Record<string, SliderConfig>;
  allocationTotalKey?: string;
};

const question = (id: string) => QUESTIONS.find((item) => item.id === id)!;

const slider = (label: string, min: number, max: number, step: number): SliderConfig => ({
  label,
  min,
  max,
  step,
});

const configs: Record<string, SliderConfig> = {
  area_m2: slider("Área útil", 0, 5_000, 10),
  investimento_total_planejado: slider("Investimento total planejado", 0, 5_000_000, 10_000),
  capital_disponivel: slider("Capital próprio disponível agora", 0, 5_000_000, 10_000),
  investimento_equipamentos: slider("Equipamentos", 0, 5_000_000, 5_000),
  investimento_adequacao: slider("Adequação do espaço", 0, 2_000_000, 5_000),
  capital_giro: slider("Reserva para capital de giro", 0, 500_000, 5_000),
  financiamento_planejado: slider("Valor que pretende financiar", 0, 2_000_000, 10_000),
  aluguel_mensal: slider("Aluguel mensal", 0, 100_000, 500),
  folha_mensal: slider("Equipe e encargos", 0, 300_000, 1_000),
  outros_custos_mensais: slider("Outros custos mensais", 0, 200_000, 1_000),
  ticket_planejado: slider("Mensalidade média planejada", 0, 1_000, 10),
  alunos_projetados_6m: slider("Alunos projetados em 6 meses", 0, 3_000, 10),
  alunos_projetados_12m: slider("Alunos projetados em 12 meses", 0, 5_000, 10),
  interessados_validados: slider("Pessoas com interesse real", 0, 1_000, 5),
  faturamento_mensal: slider("Faturamento mensal", 0, 1_000_000, 5_000),
  custos_mensais: slider("Custos mensais", 0, 1_000_000, 5_000),
  reserva_caixa: slider("Caixa ou reserva", 0, 2_000_000, 10_000),
  investimento_marketing: slider("Investimento mensal em marketing", 0, 100_000, 500),
  leads_mensais: slider("Contatos interessados por mês", 0, 2_000, 10),
  alunos_ativos: slider("Alunos ativos", 0, 5_000, 10),
  novas_matriculas: slider("Novas matrículas por mês", 0, 1_000, 5),
  cancelamentos_mensais: slider("Cancelamentos por mês", 0, 1_000, 5),
  investimento_expansao_estimado: slider("Investimento estimado", 0, 5_000_000, 25_000),
  capital_expansao_disponivel: slider("Capital disponível", 0, 5_000_000, 25_000),
  area_nova_unidade_m2: slider("Área útil da nova unidade", 0, 5_000, 10),
  investimento_equipamentos_expansao: slider("Equipamentos", 0, 5_000_000, 5_000),
  investimento_adequacao_expansao: slider("Adequação do espaço", 0, 2_000_000, 5_000),
  capital_giro_expansao: slider("Capital de giro", 0, 2_000_000, 5_000),
};

const single = (id: string): QuizStep => ({ id, questions: [question(id)] });

const group = (id: string, title: string, help: string, ids: string[]): QuizStep => ({
  id,
  title,
  help,
  questions: ids.map(question),
  sliderConfigs: Object.fromEntries(
    ids.map((questionId) => {
      const item = question(questionId);
      return [item.key, configs[item.key]!];
    }),
  ),
});

const allocationGroup = (
  ids: string[],
  totalKey = "investimento_total_planejado",
  id = "CAPITAL_ALLOCATION",
): QuizStep => ({
  ...group(
    id,
    "Como esse investimento será distribuído?",
    "A soma entre equipamentos, adequação do espaço e capital de giro precisa fechar o investimento total informado.",
    ids,
  ),
  allocationTotalKey: totalKey,
});

const sliderSingle = (id: string): QuizStep => {
  const item = question(id);
  return {
    id,
    title: item.title,
    help: item.help,
    questions: [item],
    sliderConfigs: { [item.key]: configs[item.key]! },
  };
};

export function visibleQuizSteps(answers: Answers): QuizStep[] {
  const visibleIds = new Set(visibleQuestions(answers).map((item) => item.id));
  const path = resolvePath(answers);
  const steps: QuizStep[] = [single("Q01"), single("Q02")];
  if (visibleIds.has("Q03")) steps.push(single("Q03"));

  if (path === "novo_negocio") {
    if (answers["objetivo_principal"] === "estudando") {
      steps.push(
        single("A01"),
        single("A20"),
        sliderSingle("A02"),
        sliderSingle("A03"),
        sliderSingle("A06"),
        single("S01"),
        single("S02"),
        single("A14"),
      );
    } else {
      steps.push(
        single("A01"),
        single("S01"),
        single("A20"),
        sliderSingle("A02"),
        sliderSingle("A03"),
        sliderSingle("A06"),
        single("A17"),
        ...(answers["pretende_financiar"] === "sim" ? [single("A19")] : []),
        ...(answers["pretende_financiar"] === "sim" ? [sliderSingle("A18")] : []),
        allocationGroup(["A04", "A05", "A07"]),
        single("A15"),
        group(
          "NEW_COSTS",
          "Quanto custará manter a academia por mês?",
          "Separe os principais grupos para calcular o custo operacional.",
          ["A08", "A09", "A10"],
        ),
        group(
          "NEW_PROJECTION",
          "Qual é a sua projeção de alunos e receita?",
          "Use metas realistas. Vamos cruzar mensalidade, crescimento e ponto de equilíbrio.",
          ["A11", "A12", "A13", "A16"],
        ),
        single("A14"),
      );
    }
  } else {
    steps.push(
      single("B01"),
      sliderSingle("B03"),
      group(
        "CURRENT_FINANCE",
        "Como está a saúde financeira hoje?",
        "Informe uma média mensal e a reserva disponível.",
        ["B05", "B06", "B11"],
      ),
      group(
        "CURRENT_COMMERCIAL",
        "Como funciona sua aquisição de novos alunos?",
        "Vamos estimar o custo de aquisição e a conversão comercial.",
        ["B07", "B08"],
      ),
      group(
        "CURRENT_STUDENTS",
        "Como sua base de alunos se movimenta por mês?",
        "Compare o tamanho da base com quem entra e quem sai.",
        ["B04", "B09", "B10"],
      ),
      single("B12"),
      single("B14"),
      single("B15"),
    );
    if (answers["objetivo_principal"] === "melhorar_atual") steps.push(single("B13"));
    if (isExpansionPath(answers)) {
      if (answers["objetivo_principal"] === "segunda_unidade") {
        steps.push(
          single("E04"),
          single("E05"),
          single("E07"),
          sliderSingle("E06"),
          group(
            "EXPANSION_INVESTMENT",
            "Quanto pretende investir e quanto já está disponível?",
            "Primeiro compare o tamanho do projeto com o capital efetivamente disponível.",
            ["E01", "E02"],
          ),
          single("E03"),
          allocationGroup(
            ["E08", "E09", "E10"],
            "investimento_expansao_estimado",
            "EXPANSION_ALLOCATION",
          ),
        );
      } else {
        steps.push(
          single("E03"),
          group(
            "EXPANSION_INVESTMENT",
            "Como pretende financiar esse próximo movimento?",
            "Compare o investimento necessário com o capital disponível.",
            ["E01", "E02"],
          ),
        );
      }
    }
  }

  steps.push(single("C01"));
  return steps.filter((step) => step.questions.every((item) => visibleIds.has(item.id)));
}

export function stepAnchorId(step: QuizStep): string {
  const anchors: Record<string, string> = {
    NEW_INVESTMENT: "A03",
    CAPITAL_ALLOCATION: "A04",
    NEW_COSTS: "A08",
    NEW_PROJECTION: "A11",
    CURRENT_FINANCE: "B05",
    CURRENT_COMMERCIAL: "B07",
    CURRENT_STUDENTS: "B12",
    EXPANSION_INVESTMENT: "E01",
    EXPANSION_ALLOCATION: "E08",
  };
  return anchors[step.id] ?? step.questions[0]!.id;
}
