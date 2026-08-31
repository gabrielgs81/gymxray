import type { Answers } from "./types";
import { isExpansionPath, resolvePath } from "./diagnosis";

export type QuestionType =
  | "single"
  | "currency"
  | "integer"
  | "number"
  | "location"
  | "contact";

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
  { label: "Academia tradicional", value: "tradicional" },
  { label: "Academia premium", value: "premium" },
  { label: "Studio de musculação", value: "studio_musculacao" },
  { label: "Studio funcional", value: "studio_funcional" },
  { label: "Cross training", value: "cross_training" },
  { label: "Academia boutique", value: "boutique" },
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
      { label: "Já tenho uma academia e quero ampliar meu espaço", value: "expandir_atual" },
      { label: "Quero abrir uma segunda unidade", value: "segunda_unidade" },
      { label: "Estou estudando o mercado e ainda não decidi", value: "estudando" },
    ],
  },
  {
    id: "Q02",
    key: "cidade",
    type: "location",
    title: "Em qual cidade e estado você está?",
    help: "Usamos essa informação apenas para personalizar seu relatório.",
  },

  /* ---------------- Caminho A — novo negócio ---------------- */
  {
    id: "A01",
    key: "modelo_negocio",
    type: "single",
    title: "Que tipo de academia você pretende montar?",
    showIf: (a) => resolvePath(a) === "novo_negocio",
    options: [
      ...MODELOS.filter((m) => m.value !== "boutique"),
      { label: "Academia de condomínio", value: "condominio" },
      { label: "Academia boutique", value: "boutique" },
      { label: "Ainda não defini", value: "nao_defini" },
      { label: "Outro", value: "outro" },
    ],
  },
  {
    id: "A02",
    key: "area_m2",
    type: "number",
    suffix: "m²",
    title: "Qual será aproximadamente o tamanho do espaço?",
    help: "Uma estimativa já é suficiente.",
    showIf: (a) => resolvePath(a) === "novo_negocio",
  },
  {
    id: "A03",
    key: "capital_disponivel",
    type: "currency",
    essential: true,
    title: "Quanto você tem disponível hoje para investir no projeto?",
    help: "Considere tudo que pode ser efetivamente aplicado na abertura.",
    showIf: (a) => resolvePath(a) === "novo_negocio",
  },
  {
    id: "A04",
    key: "investimento_equipamentos",
    type: "currency",
    title: "Quanto você pretende investir em equipamentos?",
    allowUnknown: true,
    unknownLabel: "Ainda não sei",
    showIf: (a) => resolvePath(a) === "novo_negocio",
  },
  {
    id: "A05",
    key: "investimento_reforma",
    type: "currency",
    title: "Quanto estima gastar com reforma, estrutura e adequação do espaço?",
    help: "Piso, elétrica, iluminação, pintura, climatização, fachada, vestiários etc.",
    allowUnknown: true,
    unknownLabel: "Ainda não sei",
    showIf: (a) => resolvePath(a) === "novo_negocio",
  },
  {
    id: "A06",
    key: "custos_pre_operacionais",
    type: "currency",
    title: "Quanto estima gastar antes da inauguração, além de equipamentos e reforma?",
    help: "Documentação, sistema, comunicação visual, marketing inicial, mobiliário, computadores, catraca e outros.",
    allowUnknown: true,
    unknownLabel: "Não sei",
    showIf: (a) => resolvePath(a) === "novo_negocio",
  },
  {
    id: "A07",
    key: "capital_giro",
    type: "currency",
    essential: true,
    title: "Depois de montar a academia, quanto pretende deixar reservado para sustentar a operação?",
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
    title: "Quantos alunos você acredita conseguir atingir após 6 meses?",
    showIf: (a) => resolvePath(a) === "novo_negocio",
  },
  {
    id: "A13",
    key: "alunos_projetados_12m",
    type: "integer",
    essential: true,
    title: "E após 12 meses?",
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
    id: "B02",
    key: "tempo_operacao",
    type: "single",
    title: "Há quanto tempo sua academia funciona?",
    showIf: (a) => resolvePath(a) === "operacao_existente",
    options: [
      { label: "Menos de 6 meses", value: "menos_6m" },
      { label: "6 a 12 meses", value: "6_12m" },
      { label: "1 a 2 anos", value: "1_2a" },
      { label: "2 a 5 anos", value: "2_5a" },
      { label: "Mais de 5 anos", value: "mais_5a" },
    ],
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
    title: "Quanto custa aproximadamente sua operação por mês?",
    help: "Considere folha, aluguel, energia, sistemas, impostos, manutenção, marketing, contador e demais despesas.",
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
    title: "Quantos novos contatos interessados sua academia recebe aproximadamente por mês?",
    help: "Considere WhatsApp, Instagram, formulário, telefone etc.",
    allowUnknown: true,
    unknownLabel: "Não sei",
    showIf: (a) => resolvePath(a) === "operacao_existente",
  },
  {
    id: "B09",
    key: "novas_matriculas",
    type: "integer",
    title: "Quantas novas matrículas sua academia faz aproximadamente por mês?",
    showIf: (a) => resolvePath(a) === "operacao_existente",
  },
  {
    id: "B10",
    key: "cancelamentos_mensais",
    type: "integer",
    title: "Quantos alunos cancelam ou deixam a academia em um mês típico?",
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
    key: "nivel_saturacao",
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

  /* ---------------- Contato ---------------- */
  {
    id: "C01",
    key: "contato",
    type: "contact",
    title: "Para onde enviamos seu Raio-X?",
    help: "Usamos seus dados apenas para entregar o diagnóstico.",
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
