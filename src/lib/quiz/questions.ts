import type { Answers } from "./types";
import { isExpansionPath, resolvePath } from "./diagnosis";

export type QuestionType =
  "single" | "currency" | "integer" | "number" | "text" | "location" | "contact";

export interface Option {
  label: string;
  value: string;
}

export interface Question {
  id: string;
  key: string;
  type: QuestionType;
  title: string;
  help?: string;
  suffix?: string;
  options?: Option[];
  allowUnknown?: boolean;
  unknownLabel?: string;
  essential?: boolean;
  showIf?: (a: Answers) => boolean;
}

const MODELOS: Option[] = [
  { label: "Academia de bairro", value: "bairro" },
  { label: "Academia boutique / premium", value: "boutique_premium" },
  { label: "Estúdio com atendimento personalizado", value: "studio_personalizado" },
  { label: "Academia de condomínio", value: "condominio" },
];

export const QUESTIONS: Question[] = [
  {
    id: "Q01",
    key: "objetivo_principal",
    type: "single",
    title: "Qual dessas situações melhor representa seu momento hoje?",
    essential: true,
    options: [
      { label: "Quero montar minha primeira academia", value: "abrir_primeira" },
      { label: "Já tenho uma academia e quero melhorar os resultados", value: "melhorar_atual" },
      { label: "Já tenho uma academia e quero abrir uma nova unidade", value: "segunda_unidade" },
      {
        label: "Estou estudando o mercado e quero entender se meu projeto é viável",
        value: "estudando",
      },
    ],
  },
  {
    id: "Q02",
    key: "cidade",
    type: "location",
    title: "Em qual cidade e estado você está?",
    help: "A cidade será usada para contextualizar o mercado local com dados oficiais.",
  },
  {
    id: "Q03",
    key: "bairro_endereco",
    type: "text",
    title: "Em qual bairro ou região você imagina instalar a academia?",
    help: "Se já souber o endereço, pode informá-lo. Isso prepara uma análise futura do entorno de 5 km.",
    allowUnknown: true,
    unknownLabel: "Ainda não defini a região",
    showIf: (a) =>
      resolvePath(a) === "novo_negocio" || a["objetivo_principal"] === "segunda_unidade",
  },

  /* ---------------- Caminho A — novo negócio ---------------- */
  {
    id: "A01",
    key: "modelo_negocio",
    type: "single",
    title: "Que tipo de academia você pretende montar?",
    showIf: (a) => resolvePath(a) === "novo_negocio",
    options: [...MODELOS, { label: "Ainda não defini", value: "nao_defini" }],
  },
  {
    id: "A20",
    key: "meta_alunos_faixa",
    type: "single",
    essential: true,
    title: "Quantos alunos você pretende atender nessa academia?",
    help: "Essa meta orienta capacidade, quantidade de equipamentos e repetição de estações.",
    showIf: (a) => resolvePath(a) === "novo_negocio",
    options: [
      { label: "Até 150 alunos", value: "ate_150" },
      { label: "150 a 300 alunos", value: "150_300" },
      { label: "300 a 500 alunos", value: "300_500" },
      { label: "500 a 800 alunos", value: "500_800" },
      { label: "800 a 1.200 alunos", value: "800_1200" },
      { label: "Acima de 1.200 alunos", value: "acima_1200" },
      { label: "Ainda não sei", value: "nao_sei" },
    ],
  },
  {
    id: "A02",
    key: "area_m2",
    type: "number",
    suffix: "m²",
    title: "Qual será aproximadamente a área útil da academia?",
    help: "Vamos cruzar a metragem com o modelo e a quantidade de alunos pretendida.",
    showIf: (a) => resolvePath(a) === "novo_negocio",
  },
  {
    id: "A03",
    key: "investimento_total_planejado",
    type: "currency",
    essential: true,
    title: "Qual é o valor total que você pretende investir no projeto?",
    help: "Considere equipamentos, adequação do espaço e capital de giro.",
    showIf: (a) => resolvePath(a) === "novo_negocio",
  },
  {
    id: "A04",
    key: "investimento_equipamentos",
    type: "currency",
    title: "Quanto pretende direcionar para equipamentos?",
    help: "Inclua musculação, cardio e acessórios, mesmo quando parte for parcelada.",
    showIf: (a) => resolvePath(a) === "novo_negocio",
  },
  {
    id: "A05",
    key: "investimento_adequacao",
    type: "currency",
    title: "Quanto pretende direcionar para adequação do espaço?",
    help: "Obra, elétrica, iluminação, piso, pintura, fachada, vestiários e recepção.",
    showIf: (a) => resolvePath(a) === "novo_negocio",
  },
  {
    id: "A06",
    key: "capital_disponivel",
    type: "currency",
    essential: true,
    title: "Quanto de capital próprio e de sócios está disponível agora?",
    help: "Considere apenas dinheiro efetivamente disponível. Crédito será analisado separadamente.",
    showIf: (a) => resolvePath(a) === "novo_negocio",
  },
  {
    id: "A07",
    key: "capital_giro",
    type: "currency",
    essential: true,
    title: "Do capital total, quanto ficará reservado para sustentar os primeiros meses?",
    help: "É o dinheiro que segura os primeiros meses até a operação se pagar.",
    showIf: (a) => resolvePath(a) === "novo_negocio",
  },
  {
    id: "A08",
    key: "aluguel_mensal",
    type: "currency",
    title: "Qual será aproximadamente o aluguel mensal do espaço?",
    allowUnknown: true,
    unknownLabel: "Não sei",
    showIf: (a) => resolvePath(a) === "novo_negocio",
  },
  {
    id: "A09",
    key: "folha_mensal",
    type: "currency",
    title: "Quanto estima gastar por mês com funcionários, professores e encargos?",
    allowUnknown: true,
    unknownLabel: "Não sei",
    showIf: (a) => resolvePath(a) === "novo_negocio",
  },
  {
    id: "A10",
    key: "outros_custos_mensais",
    type: "currency",
    title: "Além de aluguel e equipe, quanto estima gastar mensalmente com o restante da operação?",
    help: "Energia, água, internet, sistema, manutenção, contador, limpeza, marketing, taxas e outros custos.",
    allowUnknown: true,
    unknownLabel: "Não sei",
    showIf: (a) => resolvePath(a) === "novo_negocio",
  },
  {
    id: "A11",
    key: "ticket_planejado",
    type: "currency",
    essential: true,
    title: "Quanto pretende cobrar, em média, por aluno por mês?",
    showIf: (a) => resolvePath(a) === "novo_negocio",
  },
  {
    id: "A12",
    key: "alunos_projetados_6m",
    type: "integer",
    essential: true,
    title: "Qual seria uma meta realista de alunos ativos nos primeiros 6 meses?",
    showIf: (a) => resolvePath(a) === "novo_negocio",
  },
  {
    id: "A13",
    key: "alunos_projetados_12m",
    type: "integer",
    essential: true,
    title: "E quantos alunos ativos espera ter ao completar 12 meses?",
    showIf: (a) => resolvePath(a) === "novo_negocio",
  },
  {
    id: "A14",
    key: "prazo_abertura",
    type: "single",
    title: "Quando pretende inaugurar?",
    showIf: (a) => resolvePath(a) === "novo_negocio",
    options: [
      { label: "Até 3 meses", value: "ate_3m" },
      { label: "3 a 6 meses", value: "3_6m" },
      { label: "6 a 12 meses", value: "6_12m" },
      { label: "Mais de 12 meses", value: "mais_12m" },
      { label: "Ainda não defini", value: "nao_defini" },
    ],
  },
  {
    id: "A15",
    key: "base_projecao",
    type: "single",
    title: "Em que você está baseando sua previsão de alunos?",
    showIf: (a) => resolvePath(a) === "novo_negocio" && a["objetivo_principal"] !== "estudando",
    options: [
      {
        label: "Já possuo clientes ou público que pretende migrar comigo",
        value: "clientes_existentes",
      },
      { label: "Já comecei uma pré-venda ou captação", value: "pre_venda" },
      { label: "Analisei concorrência e demanda da região", value: "pesquisa_regional" },
      { label: "Tenho experiência anterior operando academia", value: "experiencia_anterior" },
      { label: "É uma estimativa pessoal", value: "estimativa_pessoal" },
      { label: "Ainda não sei quantos alunos consigo atingir", value: "nao_sei" },
    ],
  },
  {
    id: "A16",
    key: "interessados_validados",
    type: "integer",
    title: "Quantas pessoas já demonstraram interesse real em treinar na futura academia?",
    showIf: (a) => resolvePath(a) === "novo_negocio" && a["objetivo_principal"] !== "estudando",
  },
  {
    id: "A17",
    key: "pretende_financiar",
    type: "single",
    title: "Você pretende financiar parte do projeto?",
    showIf: (a) => resolvePath(a) === "novo_negocio" && a["objetivo_principal"] !== "estudando",
    options: [
      { label: "Sim", value: "sim" },
      { label: "Não", value: "nao" },
      { label: "Ainda estou avaliando", value: "avaliando" },
    ],
  },
  {
    id: "A18",
    key: "financiamento_planejado",
    type: "currency",
    title: "Quanto pretende financiar?",
    showIf: (a) => a["pretende_financiar"] === "sim",
  },
  {
    id: "A19",
    key: "status_financiamento",
    type: "single",
    title: "Em qual estágio está esse financiamento?",
    showIf: (a) => a["pretende_financiar"] === "sim",
    options: [
      { label: "Crédito aprovado", value: "aprovado" },
      { label: "Em análise", value: "analise" },
      { label: "Em negociação", value: "negociacao" },
      { label: "Ainda não solicitei", value: "nao_solicitado" },
    ],
  },

  /* ---------------- Caminho B — operação existente ---------------- */
  {
    id: "B01",
    key: "modelo_negocio",
    type: "single",
    title: "Qual é o modelo da sua operação?",
    showIf: (a) => resolvePath(a) === "operacao_existente",
    options: [...MODELOS, { label: "Outro", value: "outro" }],
  },
  {
    id: "B03",
    key: "area_m2",
    type: "number",
    suffix: "m²",
    title: "Qual é aproximadamente a área útil da sua academia?",
    showIf: (a) => resolvePath(a) === "operacao_existente",
  },
  {
    id: "B04",
    key: "alunos_ativos",
    type: "integer",
    essential: true,
    title: "Quantos alunos pagantes ativos sua academia possui atualmente?",
    showIf: (a) => resolvePath(a) === "operacao_existente",
  },
  {
    id: "B05",
    key: "faturamento_mensal",
    type: "currency",
    essential: true,
    title: "Quanto sua academia fatura, em média, por mês?",
    help: "Considere o valor que efetivamente entra na operação em um mês típico.",
    showIf: (a) => resolvePath(a) === "operacao_existente",
  },
  {
    id: "B06",
    key: "custos_mensais",
    type: "currency",
    essential: true,
    title: "Em um mês normal, quanto sai do caixa para manter a academia funcionando?",
    help: "Inclua folha, aluguel, impostos, marketing, sistemas, manutenção, contador e pró-labore.",
    showIf: (a) => resolvePath(a) === "operacao_existente",
  },
  {
    id: "B07",
    key: "investimento_marketing",
    type: "currency",
    title: "Quanto sua academia investe, aproximadamente, em marketing por mês?",
    allowUnknown: true,
    unknownLabel: "Não sei informar",
    showIf: (a) => resolvePath(a) === "operacao_existente",
    options: [{ label: "Não invisto atualmente", value: "0" }],
  },
  {
    id: "B08",
    key: "leads_mensais",
    type: "integer",
    title: "Nos últimos 30 dias, quantas pessoas novas pediram informações?",
    help: "Considere WhatsApp, Instagram, visitas, formulários e ligações.",
    allowUnknown: true,
    unknownLabel: "Não sei",
    showIf: (a) => resolvePath(a) === "operacao_existente",
  },
  {
    id: "B09",
    key: "novas_matriculas",
    type: "integer",
    title: "Nos últimos 30 dias, quantas novas matrículas foram realizadas?",
    showIf: (a) => resolvePath(a) === "operacao_existente",
  },
  {
    id: "B10",
    key: "cancelamentos_mensais",
    type: "integer",
    title: "Nos últimos 30 dias, quantos alunos cancelaram ou deixaram de pagar?",
    showIf: (a) => resolvePath(a) === "operacao_existente",
  },
  {
    id: "B11",
    key: "reserva_caixa",
    type: "currency",
    title: "Quanto sua academia possui aproximadamente disponível em caixa ou reserva?",
    allowUnknown: true,
    unknownLabel: "Prefiro não informar",
    showIf: (a) => resolvePath(a) === "operacao_existente",
  },
  {
    id: "B12",
    key: "pressao_horario_pico",
    type: "single",
    title: "Nos horários de maior movimento, qual situação mais representa sua academia?",
    showIf: (a) => resolvePath(a) === "operacao_existente",
    options: [
      { label: "Ainda sobra bastante capacidade", value: "1" },
      { label: "Existe movimento, mas sem problemas", value: "2" },
      { label: "Alguns equipamentos ficam disputados", value: "3" },
      { label: "Existem filas frequentes", value: "4" },
      { label: "O espaço já limita claramente o crescimento", value: "5" },
    ],
  },
  {
    id: "B14",
    key: "frequencia_manutencao",
    type: "single",
    title: "Com que frequência equipamentos importantes ficam indisponíveis por manutenção?",
    showIf: (a) => resolvePath(a) === "operacao_existente",
    options: [
      { label: "Quase nunca", value: "1" },
      { label: "Algumas vezes no ano", value: "2" },
      { label: "Algumas vezes no mês", value: "3" },
      { label: "Frequentemente", value: "4" },
    ],
  },
  {
    id: "B15",
    key: "capacidade_extra_20",
    type: "single",
    title: "Sua academia conseguiria receber 20% mais alunos sem ampliar a estrutura?",
    showIf: (a) => resolvePath(a) === "operacao_existente",
    options: [
      { label: "Sim, tranquilamente", value: "1" },
      { label: "Sim, com alguns ajustes", value: "2" },
      { label: "Dificilmente", value: "3" },
      { label: "Não", value: "4" },
    ],
  },
  {
    id: "B13",
    key: "objetivo_12_meses",
    type: "single",
    title: "Qual é seu principal objetivo para os próximos 12 meses?",
    showIf: (a) => resolvePath(a) === "operacao_existente",
    options: [
      { label: "Aumentar número de alunos", value: "mais_alunos" },
      { label: "Aumentar faturamento", value: "mais_faturamento" },
      { label: "Melhorar margem", value: "melhorar_margem" },
      { label: "Reduzir cancelamentos", value: "reduzir_cancelamentos" },
      { label: "Melhorar vendas", value: "melhorar_vendas" },
      { label: "Ampliar estrutura", value: "ampliar_estrutura" },
      { label: "Trocar equipamentos", value: "trocar_equipamentos" },
      { label: "Abrir outra unidade", value: "abrir_outra_unidade" },
      { label: "Organizar gestão", value: "organizar_gestao" },
      { label: "Ainda não sei", value: "nao_sei" },
    ],
  },
  {
    id: "S01",
    key: "possui_local",
    type: "single",
    title: "Em relação ao local da futura academia, em que ponto você está?",
    showIf: (a) => resolvePath(a) === "novo_negocio",
    options: [
      { label: "Já tenho um local pronto e definido", value: "pronto_definido" },
      { label: "Já tenho o local, mas está em construção ou reforma", value: "em_obra" },
      { label: "Estou avaliando alguns imóveis", value: "avaliando" },
      { label: "Ainda não comecei a procurar um local", value: "nao_iniciado" },
    ],
  },
  {
    id: "S02",
    key: "forma_investimento",
    type: "single",
    title: "Como você imagina financiar o projeto?",
    showIf: (a) => a["objetivo_principal"] === "estudando",
    options: [
      { label: "Recursos próprios", value: "proprio" },
      { label: "Recursos próprios e financiamento", value: "misto" },
      { label: "Com sócios ou investidores", value: "socios" },
      { label: "Ainda não defini", value: "nao_defini" },
    ],
  },
  {
    id: "E01",
    key: "investimento_expansao_estimado",
    type: "currency",
    title: "Quanto estima precisar investir nesse próximo movimento?",
    allowUnknown: true,
    unknownLabel: "Não sei",
    showIf: (a) => resolvePath(a) === "operacao_existente" && isExpansionPath(a),
  },
  {
    id: "E02",
    key: "capital_expansao_disponivel",
    type: "currency",
    title: "Quanto possui disponível hoje para realizar esse investimento?",
    allowUnknown: true,
    unknownLabel: "Não sei",
    showIf: (a) => resolvePath(a) === "operacao_existente" && isExpansionPath(a),
  },
  {
    id: "E03",
    key: "fonte_capital_expansao",
    type: "single",
    title: "A fonte do capital necessário para a expansão já está definida?",
    showIf: (a) => resolvePath(a) === "operacao_existente" && isExpansionPath(a),
    options: [
      { label: "Sim, o capital está garantido", value: "definida" },
      { label: "Parcialmente", value: "parcial" },
      { label: "Ainda não", value: "nao_definida" },
    ],
  },
  {
    id: "E04",
    key: "modelo_nova_unidade",
    type: "single",
    title: "Que tipo de academia você pretende montar na nova unidade?",
    showIf: (a) => a["objetivo_principal"] === "segunda_unidade",
    options: [...MODELOS, { label: "Ainda não defini", value: "nao_defini" }],
  },
  {
    id: "E05",
    key: "estagio_local_nova_unidade",
    type: "single",
    title: "Em relação ao local da nova unidade, em que etapa você está?",
    showIf: (a) => a["objetivo_principal"] === "segunda_unidade",
    options: [
      { label: "Já tenho um local pronto e definido", value: "pronto_definido" },
      { label: "Já tenho o local, mas está em construção ou reforma", value: "em_obra" },
      { label: "Estou avaliando alguns imóveis", value: "avaliando" },
      { label: "Ainda não comecei a procurar um local", value: "nao_iniciado" },
    ],
  },
  {
    id: "E06",
    key: "area_nova_unidade_m2",
    type: "number",
    suffix: "m²",
    title: "Qual será aproximadamente a área útil da nova unidade?",
    showIf: (a) => a["objetivo_principal"] === "segunda_unidade",
  },
  {
    id: "E07",
    key: "meta_alunos_nova_faixa",
    type: "single",
    title: "Quantos alunos a nova unidade deverá atender?",
    showIf: (a) => a["objetivo_principal"] === "segunda_unidade",
    options: [
      { label: "Até 150 alunos", value: "ate_150" },
      { label: "150 a 300 alunos", value: "150_300" },
      { label: "300 a 500 alunos", value: "300_500" },
      { label: "500 a 800 alunos", value: "500_800" },
      { label: "800 a 1.200 alunos", value: "800_1200" },
      { label: "Acima de 1.200 alunos", value: "acima_1200" },
      { label: "Ainda não sei", value: "nao_sei" },
    ],
  },
  {
    id: "E08",
    key: "investimento_equipamentos_expansao",
    type: "currency",
    title: "Quanto será destinado aos equipamentos da nova unidade?",
    showIf: (a) => a["objetivo_principal"] === "segunda_unidade",
  },
  {
    id: "E09",
    key: "investimento_adequacao_expansao",
    type: "currency",
    title: "Quanto será destinado à adequação do novo espaço?",
    showIf: (a) => a["objetivo_principal"] === "segunda_unidade",
  },
  {
    id: "E10",
    key: "capital_giro_expansao",
    type: "currency",
    title: "Quanto ficará reservado como capital de giro da nova unidade?",
    showIf: (a) => a["objetivo_principal"] === "segunda_unidade",
  },

  /* ---------------- Contato ---------------- */
  {
    id: "C01",
    key: "contato",
    type: "contact",
    title: "Para onde enviamos seu Raio-X?",
    help: "Seu e-mail será usado para identificar e liberar o acesso ao relatório completo.",
    essential: true,
  },
];

export function visibleQuestions(answers: Answers): Question[] {
  return QUESTIONS.filter((q) => !q.showIf || q.showIf(answers));
}

/** Validações suaves (nunca bloqueiam) */
export function softWarning(q: Question, value: unknown, answers: Answers): string | null {
  const n = typeof value === "number" ? value : null;
  if (n === null) return null;

  if ((q.key === "area_m2" || q.key === "ticket_planejado") && n === 0)
    return "Você informou zero. Tem certeza que este valor está correto?";
  if (q.key === "capital_disponivel" && n < 0) return "O capital disponível não pode ser negativo.";
  if (n > 50_000_000) return "Esse valor parece muito alto. Tem certeza que está correto?";

  const alunos = typeof answers["alunos_ativos"] === "number" ? answers["alunos_ativos"] : null;
  const faturamento =
    typeof answers["faturamento_mensal"] === "number" ? answers["faturamento_mensal"] : null;
  const leads = typeof answers["leads_mensais"] === "number" ? answers["leads_mensais"] : null;

  if (q.key === "faturamento_mensal" && alunos && alunos > 0 && n / alunos < 30)
    return `Esse valor parece baixo para ${alunos} alunos. Deseja confirmar?`;
  if (q.key === "custos_mensais" && faturamento && n > faturamento * 3)
    return "Os custos informados são muito superiores ao faturamento. Deseja confirmar?";
  if (q.key === "cancelamentos_mensais" && alunos !== null && n > alunos)
    return "Os cancelamentos superam o total de alunos ativos. Deseja confirmar?";
  if (q.key === "novas_matriculas" && leads !== null && leads > 0 && n > leads)
    return "As matrículas superam o número de contatos recebidos. Deseja confirmar?";
  if (q.key === "aluguel_mensal" && faturamento && n > faturamento)
    return "O aluguel informado é maior que o faturamento. Deseja confirmar?";

  return null;
}
