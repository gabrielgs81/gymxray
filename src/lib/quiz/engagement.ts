import { computeMetrics } from "./calculations";
import { resolvePath } from "./diagnosis";
import { brl, int, pct } from "./format";
import type { Answers } from "./types";

export type QuizEngagement = {
  phase: string;
  eyebrow: string;
  encouragement: string;
  insight?: { label: string; value: string; detail: string };
};

export type QuizStage = {
  id: string;
  number: number;
  title: string;
  description: string;
};

const hasNumber = (answers: Answers, key: string) => typeof answers[key] === "number";

export function getQuizStage(questionId: string, answers: Answers): QuizStage {
  const path = resolvePath(answers);

  if (questionId.startsWith("Q")) {
    return {
      id: "profile",
      number: 1,
      title: "Seu momento",
      description: "Entender seu contexto para montar uma análise realmente relevante.",
    };
  }

  if (questionId === "C01") {
    return {
      id: "result",
      number: path === "novo_negocio" ? 4 : 5,
      title: "Seu resultado",
      description: "Consolidar os indicadores e preparar a leitura do seu Raio-X.",
    };
  }

  if (path === "novo_negocio") {
    if (
      ["A01", "A02", "A03", "A04", "A05", "A06", "A07", "A20", "S01", "S02"].includes(questionId)
    ) {
      return {
        id: "investment",
        number: 2,
        title: "Estrutura do projeto",
        description: "Dimensionar investimento, espaço e reserva para a abertura.",
      };
    }
    return {
      id: "viability",
      number: 3,
      title: "Viabilidade",
      description: "Cruzar custos, ticket e projeção de alunos para testar a sustentabilidade.",
    };
  }

  if (["B01", "B03", "B04", "B05", "B06"].includes(questionId)) {
    return {
      id: "operation",
      number: 2,
      title: "Operação atual",
      description: "Ler a base financeira e a capacidade atual da academia.",
    };
  }
  if (["B07", "B08", "B09", "B10", "B11"].includes(questionId)) {
    return {
      id: "growth-engine",
      number: 3,
      title: "Motor de crescimento",
      description: "Entender aquisição, conversão, retenção e segurança de caixa.",
    };
  }
  return {
    id: "next-move",
    number: 4,
    title: "Próximo movimento",
    description: "Avaliar capacidade, prioridades e prontidão para crescer.",
  };
}

export function getStageCount(answers: Answers): number {
  return resolvePath(answers) === "novo_negocio" ? 4 : 5;
}

export function getQuizEngagement(
  questionId: string,
  answers: Answers,
  index: number,
  total: number,
): QuizEngagement {
  const path = resolvePath(answers);
  const metrics = computeMetrics(answers, path);
  const progress = total > 0 ? (index + 1) / total : 0;

  const stage = getQuizStage(questionId, answers);
  const base: QuizEngagement =
    questionId === "Q01" || questionId === "Q02"
      ? {
          phase: stage.title,
          eyebrow: "Começando o diagnóstico",
          encouragement: "Primeiro, vamos entender onde você está hoje.",
        }
      : questionId === "C01"
        ? {
            phase: "Resultado",
            eyebrow: "Análise concluída",
            encouragement: "Seu Raio-X está pronto. Falta apenas definir onde você quer recebê-lo.",
          }
        : path === "novo_negocio"
          ? progress < 0.5
            ? {
                phase: stage.title,
                eyebrow: "Montando o cenário",
                encouragement:
                  "Agora estamos dimensionando o investimento para tirar a ideia do papel.",
              }
            : {
                phase: stage.title,
                eyebrow: "Cruzando os números",
                encouragement: "Vamos descobrir se a operação projetada consegue se sustentar.",
              }
          : progress < 0.48
            ? {
                phase: stage.title,
                eyebrow: "Lendo sua operação",
                encouragement:
                  "Estamos transformando os números do dia a dia em indicadores de gestão.",
              }
            : progress < 0.78
              ? {
                  phase: stage.title,
                  eyebrow: "Mapeando o crescimento",
                  encouragement:
                    "Agora vamos entender como alunos entram, permanecem e saem da academia.",
                }
              : {
                  phase: stage.title,
                  eyebrow: "Fechando o diagnóstico",
                  encouragement:
                    "Estamos identificando onde existe espaço para crescer com mais segurança.",
                };

  if (path === "novo_negocio") {
    if (questionId === "A04" && hasNumber(answers, "investimento_total_planejado")) {
      base.insight = {
        label: "Investimento total mapeado",
        value: brl(answers["investimento_total_planejado"] as number),
        detail:
          "Agora vamos distribuir esse valor entre equipamentos, adequação e capital de giro.",
      };
    } else if (questionId === "A08" && metrics.investimento_total_estimado !== null) {
      base.insight = {
        label: "Investimento inicial estimado",
        value: brl(metrics.investimento_total_estimado),
        detail: "Agora vamos calcular quanto essa estrutura custa para operar todos os meses.",
      };
    } else if (questionId === "A11" && metrics.custo_operacional_mensal !== null) {
      base.insight = {
        label: "Custo mensal projetado",
        value: brl(metrics.custo_operacional_mensal),
        detail: "O ticket informado agora revelará quantos alunos pagam essa conta.",
      };
    } else if (questionId === "A14" && metrics.ponto_equilibrio_alunos !== null) {
      base.insight = {
        label: "Ponto de equilíbrio estimado",
        value: `${int(metrics.ponto_equilibrio_alunos)} alunos`,
        detail: "Esse é o primeiro marco financeiro calculado para o projeto.",
      };
    }
  } else {
    if (questionId === "B05" && hasNumber(answers, "alunos_ativos")) {
      base.insight = {
        label: "Base ativa mapeada",
        value: `${int(answers["alunos_ativos"] as number)} alunos`,
        detail: "Com o faturamento, vamos descobrir quanto cada aluno gera em média.",
      };
    } else if (questionId === "B06" && metrics.ticket_medio !== null) {
      base.insight = {
        label: "Ticket médio estimado",
        value: brl(metrics.ticket_medio),
        detail: "Um indicador que muita academia nunca acompanha de forma clara.",
      };
    } else if (questionId === "B07" && metrics.margem_operacional !== null) {
      base.insight = {
        label: "Margem operacional estimada",
        value: pct(metrics.margem_operacional),
        detail:
          metrics.margem_operacional >= 0.1
            ? "Sua operação gera margem; agora vamos investigar a qualidade do crescimento."
            : "Encontramos um ponto que merece atenção no diagnóstico final.",
      };
    } else if (questionId === "B12" && metrics.churn_aproximado !== null) {
      base.insight = {
        label: "Movimento da base analisado",
        value: pct(metrics.churn_aproximado),
        detail: `Churn estimado · ${int(metrics.crescimento_liquido)} alunos de saldo mensal.`,
      };
    }
  }

  return base;
}
