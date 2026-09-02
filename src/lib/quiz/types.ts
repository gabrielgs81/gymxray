export type Path = "novo_negocio" | "operacao_existente";

export type ObjetivoPrincipal =
  "abrir_primeira" | "melhorar_atual" | "expandir_atual" | "segunda_unidade" | "estudando";

export interface Lead {
  lead_id: string;
  nome: string | null;
  telefone: string | null;
  email: string | null;
  cidade: string | null;
  estado: string | null;
  data_inicio_quiz: string | null;
  data_finalizacao_quiz: string | null;
  origem: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  status_quiz: "iniciado" | "em_andamento" | "concluido";
}

/** null = não informado. 0 = efetivamente zero. */
export type Answers = Record<string, string | number | null>;

export interface Metrics {
  // novo negócio
  investimento_estrutura: number | null;
  investimento_equipamentos: number | null;
  investimento_adequacao: number | null;
  investimento_total_planejado: number | null;
  total_alocado_investimento: number | null;
  saldo_alocacao_investimento: number | null;
  investimento_total_estimado: number | null;
  custo_operacional_mensal: number | null;
  aluguel_mensal_referencia: number | null;
  folha_mensal_referencia: number | null;
  outros_custos_mensais_referencia: number | null;
  custo_operacional_minimo: number | null;
  custo_operacional_maximo: number | null;
  custo_operacional_fonte: "informado" | "hibrido" | "estimado" | null;
  ticket_referencia: number | null;
  ticket_fonte: "informado" | "estimado" | null;
  ponto_equilibrio_alunos: number | null;
  prazo_break_even_meses: number | null;
  payback_meses_estimado: number | null;
  resultado_mensal_estabilizado: number | null;
  margem_estabilizada: number | null;
  premissas_estimadas: string[];
  receita_6m: number | null;
  receita_12m: number | null;
  resultado_6m: number | null;
  resultado_12m: number | null;
  margem_6m: number | null;
  margem_12m: number | null;
  cobertura_break_even_6m: number | null;
  cobertura_break_even_12m: number | null;
  meses_reserva: number | null;
  gap_investimento: number | null;
  cobertura_capital: number | null;
  meta_alunos_referencia: number | null;
  densidade_alunos_planejada: number | null;
  score_compatibilidade_espaco: number | null;
  populacao_municipal_estimada: number | null;
  participacao_populacao_necessaria: number | null;
  // existente
  ticket_medio: number | null;
  lucro_operacional_estimado: number | null;
  margem_operacional: number | null;
  custo_por_aluno: number | null;
  folga_alunos: number | null;
  indice_cobertura_break_even: number | null;
  taxa_conversao: number | null;
  cac_pago: number | null;
  churn_aproximado: number | null;
  crescimento_liquido: number | null;
  taxa_crescimento_liquido: number | null;
  ltv_simplificado: number | null;
  runway_meses: number | null;
  alunos_por_m2: number | null;
  receita_por_m2: number | null;
  gap_expansao: number | null;
  cobertura_capital_expansao: number | null;
  capital_efetivo_disponivel: number | null;
  financiamento_aprovado: number | null;
}

export interface Scores {
  score_geral: number;
  score_financeiro: number | null;
  score_comercial: number | null;
  score_retencao: number | null;
  score_operacional: number | null;
  score_crescimento: number | null;
  score_estrutura_capital?: number | null;
  score_seguranca_caixa?: number | null;
  score_economia_operacional?: number | null;
  score_evidencia_demanda?: number | null;
  score_maturidade_projeto?: number | null;
  prontidao_expansao?: number | null;
  confianca_diagnostico?: number;
  visibilidade_gestao?: number;
  score_viabilidade?: number | null;
}

export interface Diagnosis {
  classificacao: string;
  principal_gargalo: string;
  alertas: string[];
  oportunidades: string[];
  classificacao_expansao?: string | null;
  classificacao_confianca?: string;
  parcial?: boolean;
}

export interface DiagnosticResult {
  lead: Lead;
  profile: {
    objetivo_principal: string | null;
    modelo_negocio: string | null;
    cidade: string | null;
    estado: string | null;
    area_m2: number | null;
  };
  answers: Answers;
  metrics: Metrics;
  scores: Scores;
  diagnosis: Diagnosis;
  path: Path;
}
