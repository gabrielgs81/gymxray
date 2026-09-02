import { describe, expect, it } from "vitest";
import { diagnosticConfig } from "./config";
import {
  calculateDiagnosticConfidence,
  calculateExploratoryViability,
  calculateExpansionReadiness,
  calculateNewGymScores,
  computeMetrics,
  interpolateScore,
} from "./calculations";
import { detectAlerts } from "./diagnosis";

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

  it("cruza investimento, meta de alunos, área e população no novo projeto", () => {
    const answers = {
      objetivo_principal: "abrir_primeira",
      modelo_negocio: "bairro",
      investimento_total_planejado: 300_000,
      investimento_equipamentos: 150_000,
      investimento_adequacao: 100_000,
      capital_giro: 50_000,
      meta_alunos_faixa: "500_800",
      area_m2: 250,
      populacao_municipal_estimada: 500_000,
    };
    const metrics = computeMetrics(answers, "novo_negocio");

    expect(metrics.investimento_total_estimado).toBe(300_000);
    expect(metrics.total_alocado_investimento).toBe(300_000);
    expect(metrics.saldo_alocacao_investimento).toBe(0);
    expect(metrics.meta_alunos_referencia).toBe(650);
    expect(metrics.densidade_alunos_planejada).toBe(2.6);
    expect(metrics.participacao_populacao_necessaria).toBeCloseTo(0.0013);
    expect(detectAlerts(metrics, answers, "novo_negocio")).toContain(
      "A meta de alunos tende a pressionar a área disponível e exigirá uma seleção muito eficiente de equipamentos.",
    );
  });

  it("sinaliza quando a distribuição não fecha com o investimento total", () => {
    const answers = {
      investimento_total_planejado: 300_000,
      investimento_equipamentos: 150_000,
      investimento_adequacao: 80_000,
      capital_giro: 40_000,
    };
    const metrics = computeMetrics(answers, "novo_negocio");

    expect(metrics.saldo_alocacao_investimento).toBe(30_000);
    expect(detectAlerts(metrics, answers, "novo_negocio")).toContain(
      "A distribuição do investimento não corresponde ao capital total planejado.",
    );
  });

  it("estima custos, break-even e payback para a trilha de viabilidade", () => {
    const metrics = computeMetrics(
      {
        objetivo_principal: "estudando",
        modelo_negocio: "bairro",
        meta_alunos_faixa: "300_500",
        area_m2: 400,
        investimento_total_planejado: 300_000,
        capital_disponivel: 300_000,
        populacao_municipal_estimada: 500_000,
      },
      "novo_negocio",
    );

    expect(metrics.custo_operacional_fonte).toBe("estimado");
    expect(metrics.aluguel_mensal_referencia).toBe(12_000);
    expect(metrics.folha_mensal_referencia).toBe(17_000);
    expect(metrics.outros_custos_mensais_referencia).toBe(5_000);
    expect(metrics.custo_operacional_mensal).toBe(34_000);
    expect(metrics.ticket_referencia).toBe(129);
    expect(metrics.ponto_equilibrio_alunos).toBeCloseTo(263.57, 1);
    expect(metrics.prazo_break_even_meses).toBe(8);
    expect(metrics.payback_meses_estimado).not.toBeNull();
    expect(
      calculateExploratoryViability(metrics, {
        objetivo_principal: "estudando",
        modelo_negocio: "bairro",
        meta_alunos_faixa: "300_500",
        area_m2: 400,
        investimento_total_planejado: 300_000,
        capital_disponivel: 300_000,
      }),
    ).toBeGreaterThan(40);
    expect(metrics.premissas_estimadas).toEqual([
      "aluguel",
      "equipe e encargos",
      "demais custos operacionais",
      "ticket médio",
    ]);
  });

  it("preserva custos informados e estima somente os campos ausentes", () => {
    const metrics = computeMetrics(
      {
        modelo_negocio: "studio_personalizado",
        area_m2: 150,
        aluguel_mensal: 7_500,
        ticket_planejado: 450,
      },
      "novo_negocio",
    );

    expect(metrics.custo_operacional_fonte).toBe("hibrido");
    expect(metrics.aluguel_mensal_referencia).toBe(7_500);
    expect(metrics.ticket_referencia).toBe(450);
    expect(metrics.ticket_fonte).toBe("informado");
    expect(metrics.premissas_estimadas).not.toContain("aluguel");
  });
});
