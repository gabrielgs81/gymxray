import { describe, expect, it } from "vitest";
import { diagnosticConfig } from "./config";
import {
  calculateDiagnosticConfidence,
  calculateExpansionReadiness,
  calculateNewGymScores,
  computeMetrics,
  interpolateScore,
} from "./calculations";

describe("motor do Índice Raio-X", () => {
  it("interpola progressivamente entre os pontos da curva", () => {
    expect(interpolateScore(0.125, diagnosticConfig.curves.operatingMargin)).toBe(60);
    expect(interpolateScore(1.25, diagnosticConfig.curves.breakEvenCoverage)).toBe(77.5);
  });

  it("diferencia zero informado de dado ausente", () => {
    const zero = computeMetrics(
      {
        faturamento_mensal: 100_000,
        custos_mensais: 80_000,
        alunos_ativos: 500,
        investimento_marketing: 0,
      },
      "operacao_existente",
    );
    const absent = computeMetrics(
      { faturamento_mensal: 100_000, custos_mensais: 80_000, alunos_ativos: 500 },
      "operacao_existente",
    );
    expect(zero.cac_pago).toBeNull();
    expect(absent.cac_pago).toBeNull();
  });

  it("limita expansão com margem negativa", () => {
    const answers = {
      objetivo_principal: "expandir_atual",
      faturamento_mensal: 80_000,
      custos_mensais: 100_000,
      alunos_ativos: 400,
      novas_matriculas: 20,
      cancelamentos_mensais: 10,
      investimento_expansao_estimado: 500_000,
      capital_expansao_disponivel: 500_000,
      fonte_capital_expansao: "definida",
    };
    const metrics = computeMetrics(answers, "operacao_existente");
    expect(calculateExpansionReadiness(90, metrics, answers, 90)).toBeLessThanOrEqual(40);
  });

  it("aplica cap quando o novo projeto tem baixa cobertura de capital", () => {
    const answers = {
      objetivo_principal: "abrir_primeira",
      capital_disponivel: 100_000,
      investimento_implantacao: 500_000,
      capital_giro: 50_000,
      aluguel_mensal: 10_000,
      folha_mensal: 20_000,
      outros_custos_mensais: 10_000,
      ticket_planejado: 150,
      alunos_projetados_6m: 300,
      alunos_projetados_12m: 500,
      base_projecao: "pre_venda",
      interessados_validados: 100,
      status_financiamento: "nao_solicitado",
    };
    const metrics = computeMetrics(answers, "novo_negocio");
    expect(calculateNewGymScores(metrics, answers).viability).toBeLessThanOrEqual(50);
  });

  it("reduz a confiança quando faltam dados essenciais", () => {
    expect(
      calculateDiagnosticConfidence({ faturamento_mensal: 100_000 }, "operacao_existente"),
    ).toBeLessThan(40);
  });
});
