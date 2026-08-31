# Academia Raio-X

ESPECIFICAÇÃO FUNCIONAL — QUIZ “RAIO-X DA ACADEMIA”

1. OBJETIVO DA FERRAMENTA

Criar um quiz inteligente para diagnosticar dois grandes perfis:

Pessoas que pretendem abrir uma academia.

Pessoas que já possuem uma academia e querem melhorar, expandir ou abrir uma nova unidade.

O quiz deve coletar dados brutos que o usuário normalmente conhece e, a partir deles, calcular automaticamente indicadores que ele provavelmente não conhece.

Exemplo:

Não perguntar:

“Qual é sua margem operacional?”

Perguntar:

Quanto sua academia fatura por mês?

Quanto custa sua operação por mês?

E calcular automaticamente:

Margem operacional = (faturamento - custos) ÷ faturamento

O objetivo é gerar a sensação de que a ferramenta realmente analisou o negócio do usuário, e não apenas repetiu as informações fornecidas.

2. ESTRUTURA GERAL DO FLUXO

Fluxo:

Entrada no Quiz

↓

Identificação do perfil

↓

Caminho A

Quer montar a primeira academia.

Caminho B

Já possui uma academia.

Dentro do Caminho B:

melhorar operação atual;

expandir academia;

mudar para espaço maior;

abrir segunda unidade.

↓

Coleta dos dados

↓

Motor matemático

↓

Motor de diagnóstico

↓

Prévia gratuita do resultado

↓

Posteriormente haverá oferta para desbloquear o relatório completo.

3. PRINCÍPIOS DE UX DO QUIZ

O quiz deve seguir estas regras:

Uma pergunta por tela.

Barra de progresso no topo.

Interface extremamente simples.

Botões grandes para alternativas.

Campos financeiros formatados automaticamente em R$.

Campos percentuais formatados em %.

Campos numéricos abrindo teclado numérico no mobile.

Permitir voltar para perguntas anteriores.

Salvar progresso automaticamente.

Nunca apagar respostas caso o usuário atualize a página.

Mostrar pequenas explicações abaixo de perguntas financeiras.

Evitar linguagem excessivamente técnica.

Quando possível, disponibilizar “Não sei informar”.

Perguntas essenciais devem ser sinalizadas.

O número de etapas da barra de progresso deve mudar conforme o caminho escolhido.

A ferramenta deve ser pensada principalmente para celular, pois a maior parte dos acessos virá do WhatsApp.

4. DADOS DO LEAD

Antes ou durante o quiz, criar um objeto:

lead_id
nome
telefone
email
cidade
estado
data_inicio_quiz
data_finalizacao_quiz
origem
utm_source
utm_campaign
utm_content
status_quiz


Se o telefone vier como parâmetro pela URL do disparo de WhatsApp, armazená-lo automaticamente e não perguntar novamente.

Exemplo:

?phone=5517999999999


5. PRIMEIRA PERGUNTA — DEFINIÇÃO DO CAMINHO

Q01 — Qual dessas situações melhor representa seu momento hoje?

Tipo:

single_choice

Alternativas:

A. Quero montar minha primeira academia.

B. Já tenho uma academia e quero melhorar os resultados.

C. Já tenho uma academia e quero ampliar meu espaço.

D. Quero abrir uma segunda unidade.

E. Estou estudando o mercado e ainda não decidi.

Armazenar:

objetivo_principal


Valores internos:

abrir_primeira
melhorar_atual
expandir_atual
segunda_unidade
estudando


Influência da resposta

abrir_primeira

→ Caminho NOVO NEGÓCIO.

melhorar_atual

→ Caminho OPERAÇÃO EXISTENTE.

expandir_atual

→ Caminho OPERAÇÃO EXISTENTE + módulo EXPANSÃO.

segunda_unidade

→ Caminho OPERAÇÃO EXISTENTE + módulo EXPANSÃO.

estudando

→ Caminho NOVO NEGÓCIO, porém classificar como estágio inicial.

6. PERGUNTAS DE PERFIL

Q02 — Em qual cidade e estado você está?

Campos:

cidade
estado


Tipo:

cidade = text
estado = select

Influência

Não gera pontuação.

Serve para:

personalização do relatório;

segmentação posterior;

identificação regional;

recomendações futuras;

fabricantes;

logística;

oportunidades comerciais.

7. CAMINHO A — QUERO MONTAR UMA ACADEMIA

A01 — Que tipo de academia você pretende montar?

Tipo:

single_choice

Alternativas:

Academia tradicional

Academia premium

Studio de musculação

Studio funcional

Cross training

Academia de condomínio

Academia boutique

Ainda não defini

Outro

Armazenar:

modelo_negocio


Influência

Serve principalmente para personalização.

Não deve alterar diretamente cálculos financeiros inicialmente.

Futuramente poderá alterar benchmarks e recomendações.

8. TAMANHO DO PROJETO

A02 — Qual será aproximadamente o tamanho do espaço?

Campo numérico.

Unidade:

m²

Armazenar:

area_m2


Influência

Usar para:

investimento_por_m2
receita_projetada_por_m2
alunos_por_m2


Não utilizar alunos/m² como julgamento definitivo.

Deve funcionar apenas como indicador complementar.

9. CAPITAL DISPONÍVEL

A03 — Quanto você tem disponível hoje para investir no projeto?

Tipo:

currency

Armazenar:

capital_disponivel


Influência

Indicador extremamente importante.

Será comparado com:

investimento_total_estimado


Calcular:

cobertura_capital =
capital_disponivel / investimento_total_estimado


Calcular também:

gap_investimento =
investimento_total_estimado - capital_disponivel


Se negativo:

gap_investimento = 0


10. EQUIPAMENTOS

A04 — Quanto você pretende investir em equipamentos?

Tipo:

currency

Armazenar:

investimento_equipamentos


Permitir:

Ainda não sei

Influência

Compõe:

investimento_total_estimado


11. REFORMA E ESTRUTURA

A05 — Quanto você estima gastar com reforma, estrutura e adequação do espaço?

Exemplos abaixo da pergunta:

Piso, elétrica, iluminação, pintura, climatização, fachada, vestiários etc.

Tipo:

currency

Armazenar:

investimento_reforma


Influência

Compõe:

investimento_total_estimado


12. OUTROS CUSTOS DE ABERTURA

A06 — Quanto você estima gastar antes da inauguração, além de equipamentos e reforma?

Ajuda:

Considere documentação, sistema, comunicação visual, marketing inicial, mobiliário, computadores, catraca e outros.

Tipo:

currency

Armazenar:

custos_pre_operacionais


Permitir:

Não sei

Influência

Compõe:

investimento_total_estimado


13. CAPITAL DE GIRO

A07 — Depois de montar a academia, quanto dinheiro pretende deixar reservado para sustentar a operação?

Tipo:

currency

Armazenar:

capital_giro


Influência

Calcular posteriormente:

meses_reserva =
capital_giro / custo_operacional_mensal


Esse será um dos indicadores mais importantes do diagnóstico.

14. ALUGUEL

A08 — Qual será aproximadamente o aluguel mensal do espaço?

Tipo:

currency

Armazenar:

aluguel_mensal


Influência

Compõe:

custo_operacional_mensal


E posteriormente:

percentual_aluguel_receita =
aluguel_mensal / faturamento_projetado


15. FOLHA

A09 — Quanto você estima gastar por mês com funcionários, professores e encargos?

Tipo:

currency

Armazenar:

folha_mensal


Permitir:

Não sei

Influência

Compõe:

custo_operacional_mensal


16. OUTROS CUSTOS MENSAIS

A10 — Além de aluguel e equipe, quanto estima gastar mensalmente com o restante da operação?

Texto auxiliar:

Energia, água, internet, sistema, manutenção, contador, limpeza, marketing, taxas e outros custos.

Tipo:

currency

Armazenar:

outros_custos_mensais


Influência

Compõe:

custo_operacional_mensal


17. TICKET PRETENDIDO

A11 — Quanto pretende cobrar, em média, por aluno por mês?

Tipo:

currency

Armazenar:

ticket_planejado


Influência

Variável fundamental.

Usar para:

faturamento_projetado
ponto_equilibrio_alunos
receita_por_m2


18. PROJEÇÃO DE ALUNOS

A12 — Quantos alunos você acredita conseguir atingir após 6 meses?

Tipo:

integer

Armazenar:

alunos_projetados_6m


A13 — E após 12 meses?

Tipo:

integer

Armazenar:

alunos_projetados_12m


Influência

Calcular:

faturamento_6m =
alunos_projetados_6m * ticket_planejado


faturamento_12m =
alunos_projetados_12m * ticket_planejado


Comparar ambos com o ponto de equilíbrio.

19. PRAZO PARA ABERTURA

A14 — Quando pretende inaugurar?

Alternativas:

Até 3 meses

3 a 6 meses

6 a 12 meses

Mais de 12 meses

Ainda não defini

Armazenar:

prazo_abertura


Influência

Não entra diretamente nos cálculos financeiros.

Serve para:

classificação de maturidade;

priorização;

personalização;

criação do plano de ação.

20. CÁLCULOS — NOVA ACADEMIA

Calcular automaticamente:

Investimento inicial

investimento_estrutura =
investimento_equipamentos
+ investimento_reforma
+ custos_pre_operacionais


Investimento total necessário

investimento_total_estimado =
investimento_estrutura
+ capital_giro


Custo operacional mensal

custo_operacional_mensal =
aluguel_mensal
+ folha_mensal
+ outros_custos_mensais


Ponto de equilíbrio simplificado

ponto_equilibrio_alunos =
custo_operacional_mensal / ticket_planejado


Arredondar sempre para cima.

Exemplo:

237,2 → 238 alunos.

Mostrar no relatório como:

“Ponto de equilíbrio simplificado”

Nunca apresentar como cálculo contábil definitivo.

Receita projetada em 6 meses

receita_6m =
ticket_planejado * alunos_projetados_6m


Receita projetada em 12 meses

receita_12m =
ticket_planejado * alunos_projetados_12m


Resultado operacional projetado

resultado_6m =
receita_6m - custo_operacional_mensal


resultado_12m =
receita_12m - custo_operacional_mensal


Margem projetada

margem_6m =
resultado_6m / receita_6m


margem_12m =
resultado_12m / receita_12m


Cobertura do ponto de equilíbrio

cobertura_break_even_6m =
alunos_projetados_6m / ponto_equilibrio_alunos


cobertura_break_even_12m =
alunos_projetados_12m / ponto_equilibrio_alunos


Meses de capital de giro

meses_reserva =
capital_giro / custo_operacional_mensal


Gap de investimento

gap_investimento =
investimento_total_estimado - capital_disponivel


Caso resultado seja negativo:

gap_investimento = 0


Cobertura financeira do projeto

cobertura_capital =
capital_disponivel / investimento_total_estimado


21. SCORE — NOVO NEGÓCIO

Criar:

score_viabilidade


Escala:

0 a 100

Divisão inicial:

Capacidade financeira — 30 pontos

Baseada principalmente em:

cobertura_capital


Capital de giro — 20 pontos

Baseada em:

meses_reserva


Sustentabilidade operacional — 25 pontos

Baseada em:

ponto_equilibrio_alunos
cobertura_break_even_6m
cobertura_break_even_12m


Projeção financeira — 15 pontos

Baseada em:

margem_6m
margem_12m


Maturidade do projeto — 10 pontos

Baseada em:

prazo definido;

modelo definido;

valores preenchidos;

planejamento financeiro disponível.

22. CLASSIFICAÇÃO DO NOVO PROJETO

Inicialmente utilizar:

0–39 = projeto em alto risco
40–59 = projeto precisa de ajustes importantes
60–74 = projeto com viabilidade parcial
75–89 = projeto bem estruturado
90–100 = projeto com forte estrutura financeira


IMPORTANTE:

Os limites devem estar armazenados em um arquivo/configuração e NÃO hardcoded em diversos componentes.

Criar algo como:

scoreConfig


para permitir alteração futura.

O score deve ser apresentado como:

“Índice Raio-X”

e não como benchmark oficial do mercado.

23. CAMINHO B — JÁ TENHO UMA ACADEMIA

Agora iniciar outro conjunto de perguntas.

24. MODELO DA OPERAÇÃO

B01 — Qual é o modelo da sua operação?

Alternativas:

Academia tradicional

Academia premium

Studio de musculação

Studio funcional

Cross training

Academia boutique

Outro

Armazenar:

modelo_negocio


25. TEMPO DE OPERAÇÃO

B02 — Há quanto tempo sua academia funciona?

Alternativas:

Menos de 6 meses

6 a 12 meses

1 a 2 anos

2 a 5 anos

Mais de 5 anos

Armazenar:

tempo_operacao


Influência

Contextual.

Não alterar diretamente indicadores financeiros.

26. METRAGEM

B03 — Qual é aproximadamente a área útil da sua academia?

Tipo:

number

Unidade:

m²

Armazenar:

area_m2


Influência

Calcular:

alunos_por_m2 =
alunos_ativos / area_m2


receita_por_m2 =
faturamento_mensal / area_m2


Usar como indicadores complementares.

27. ALUNOS ATIVOS

B04 — Quantos alunos pagantes ativos sua academia possui atualmente?

Tipo:

integer

Armazenar:

alunos_ativos


Variável essencial.

28. FATURAMENTO

B05 — Quanto sua academia fatura, em média, por mês?

Texto de apoio:

Considere o valor que efetivamente entra na operação em um mês típico.

Tipo:

currency

Armazenar:

faturamento_mensal


Variável essencial.

29. CUSTOS MENSAIS

B06 — Quanto custa aproximadamente sua operação por mês?

Texto:

Considere folha, aluguel, energia, sistemas, impostos, manutenção, marketing, contador e demais despesas.

Tipo:

currency

Armazenar:

custos_mensais


Variável essencial.

30. TICKET MÉDIO

NÃO perguntar o ticket médio diretamente.

Calcular:

ticket_medio =
faturamento_mensal / alunos_ativos


Mostrar no resultado:

Ticket médio estimado

Isso cria valor no diagnóstico.

31. MARGEM OPERACIONAL

NÃO perguntar margem.

Calcular:

lucro_operacional_estimado =
faturamento_mensal - custos_mensais


margem_operacional =
lucro_operacional_estimado / faturamento_mensal


Caso o valor seja negativo:

classificar como operação deficitária.

32. PONTO DE EQUILÍBRIO

Calcular:

ponto_equilibrio_alunos =
custos_mensais / ticket_medio


Arredondar para cima.

Apresentar como:

Ponto de equilíbrio simplificado

33. DISTÂNCIA DO PONTO DE EQUILÍBRIO

Calcular:

folga_alunos =
alunos_ativos - ponto_equilibrio_alunos


E:

indice_cobertura_break_even =
alunos_ativos / ponto_equilibrio_alunos


Isso ajuda a detectar operações extremamente próximas do limite financeiro.

34. MARKETING

B07 — Quanto sua academia investe, aproximadamente, em marketing por mês?

Tipo:

currency

Armazenar:

investimento_marketing


Permitir:

Não invisto atualmente

Valor interno:

0

35. LEADS

B08 — Quantos novos contatos interessados sua academia recebe aproximadamente por mês?

Ajuda:

Considere WhatsApp, Instagram, formulário, telefone etc.

Tipo:

integer

Armazenar:

leads_mensais


Permitir:

Não sei

36. NOVAS MATRÍCULAS

B09 — Quantas novas matrículas sua academia faz aproximadamente por mês?

Tipo:

integer

Armazenar:

novas_matriculas


37. CONVERSÃO COMERCIAL

Se:

leads_mensais > 0


Calcular:

taxa_conversao =
novas_matriculas / leads_mensais


Caso leads não tenha sido informado:

não calcular.

38. CAC

Se:

investimento_marketing > 0
AND novas_matriculas > 0


Calcular:

cac_pago =
investimento_marketing / novas_matriculas


Se investimento = 0:

não exibir CAC como R$0.

Mostrar:

“Aquisição predominantemente orgânica ou não mensurada.”

39. CANCELAMENTOS

B10 — Quantos alunos cancelam ou deixam a academia em um mês típico?

Tipo:

integer

Armazenar:

cancelamentos_mensais


40. CHURN

Calcular:

churn_aproximado =
cancelamentos_mensais / alunos_ativos


Mostrar como:

Taxa estimada de cancelamento mensal

41. CRESCIMENTO LÍQUIDO

Calcular:

crescimento_liquido =
novas_matriculas - cancelamentos_mensais


Se:

> 0


crescimento positivo.

Se:

= 0


operação estagnada.

Se:

< 0


base de alunos em retração.

42. LTV SIMPLIFICADO

Somente calcular se:

churn_aproximado > 0


Fórmula:

ltv_simplificado =
ticket_medio / churn_aproximado


Apresentar obrigatoriamente como:

LTV simplificado estimado

Não calcular se churn = 0.

Não inventar permanência infinita.

43. RESERVA FINANCEIRA

B11 — Quanto sua academia possui aproximadamente disponível em caixa ou reserva?

Tipo:

currency

Armazenar:

reserva_caixa


Permitir:

Prefiro não informar

ou:

Não sei

Influência

Se informado:

runway_meses =
reserva_caixa / custos_mensais


Apresentar:

Reserva equivalente a aproximadamente X meses de operação.

44. SATURAÇÃO DA ESTRUTURA

B12 — Nos horários de maior movimento, qual situação mais representa sua academia?

Alternativas:

A. Ainda sobra bastante capacidade.

B. Existe movimento, mas sem problemas.

C. Alguns equipamentos ficam disputados.

D. Existem filas frequentes.

E. O espaço já limita claramente o crescimento.

Armazenar:

nivel_saturacao


Valores internos:

1
2
3
4
5


Influência

Afeta principalmente:

score_operacional
score_expansao


Importante:

Não tratar saturação automaticamente como algo ruim.

Uma academia com boa margem + alta demanda + saturação pode estar demonstrando oportunidade de expansão.

45. OBJETIVO

B13 — Qual é seu principal objetivo para os próximos 12 meses?

Alternativas:

Aumentar número de alunos

Aumentar faturamento

Melhorar margem

Reduzir cancelamentos

Melhorar vendas

Ampliar estrutura

Trocar equipamentos

Abrir outra unidade

Organizar gestão

Ainda não sei

Armazenar:

objetivo_12_meses


Influência

Essa informação deve alterar principalmente:

as recomendações e o plano de ação, não os números.

46. PERGUNTAS CONDICIONAIS DE EXPANSÃO

Mostrar somente quando:

objetivo_principal == expandir_atual
OR objetivo_principal == segunda_unidade
OR objetivo_12_meses == ampliar_estrutura
OR objetivo_12_meses == abrir_outra_unidade


E01 — Quanto estima precisar investir nesse próximo movimento?

Tipo:

currency

Armazenar:

investimento_expansao_estimado


E02 — Quanto possui disponível hoje para realizar esse investimento?

Tipo:

currency

Armazenar:

capital_expansao_disponivel


Calcular:

gap_expansao =
investimento_expansao_estimado
- capital_expansao_disponivel


47. INDICADORES CALCULADOS — ACADEMIA EXISTENTE

Após as respostas, gerar automaticamente:

ticket_medio
lucro_operacional_estimado
margem_operacional
custo_por_aluno
ponto_equilibrio_alunos
folga_alunos
indice_cobertura_break_even
taxa_conversao
cac_pago
churn_aproximado
crescimento_liquido
ltv_simplificado
runway_meses
alunos_por_m2
receita_por_m2
gap_expansao


Cálculo adicional:

custo_por_aluno =
custos_mensais / alunos_ativos


48. SCORE — ACADEMIA EXISTENTE

Criar cinco sub-scores.

SCORE 1 — SAÚDE FINANCEIRA

Peso:

30%

Considerar:

margem_operacional
indice_cobertura_break_even
runway_meses


SCORE 2 — AQUISIÇÃO E COMERCIAL

Peso:

20%

Considerar:

taxa_conversao
cac_pago
novas_matriculas


Se não houver dados suficientes:

redistribuir o peso entre os indicadores disponíveis.

SCORE 3 — RETENÇÃO

Peso:

20%

Considerar:

churn_aproximado
crescimento_liquido


SCORE 4 — EFICIÊNCIA OPERACIONAL

Peso:

15%

Considerar:

nivel_saturacao
receita_por_m2
alunos_por_m2


Os indicadores por m² não devem ter peso excessivo inicialmente.

SCORE 5 — PRONTIDÃO PARA CRESCIMENTO

Peso:

15%

Considerar:

margem_operacional
crescimento_liquido
runway_meses
nivel_saturacao
capital_expansao_disponivel
gap_expansao


49. SCORE GERAL

Calcular:

score_geral =
score_financeiro * 0.30
+ score_comercial * 0.20
+ score_retencao * 0.20
+ score_operacional * 0.15
+ score_crescimento * 0.15


Escala:

0–100

50. CLASSIFICAÇÃO

Inicialmente:

0–39 = situação crítica
40–59 = atenção
60–74 = estrutura razoável com gargalos
75–89 = operação saudável
90–100 = operação muito bem estruturada


IMPORTANTE:

Esses valores representam o Índice Raio-X, uma metodologia própria.

Não apresentar como média oficial das academias brasileiras.

Todos os thresholds devem ser configuráveis.

51. REGRAS INICIAIS PARA INTERPRETAÇÃO

Criar uma configuração separada.

Exemplo:

diagnosticConfig


Inicialmente utilizar heurísticas como:

Margem operacional

< 0% = crítico
0–5% = muito baixo
5–10% = atenção
10–20% = razoável
> 20% = forte


Churn mensal

> 8% = crítico
5–8% = alto
3–5% = atenção
< 3% = saudável


Conversão comercial

< 10% = crítica
10–20% = baixa
20–30% = razoável
> 30% = forte


Capital de giro / reserva

< 1 mês = crítico
1–2 meses = baixo
2–3 meses = atenção
3–6 meses = razoável
> 6 meses = forte


IMPORTANTE:

Esses valores devem ser tratados como parâmetros iniciais da metodologia, totalmente editáveis posteriormente.

Nunca escrever na interface:

“a média do mercado é X”

sem uma fonte/benchmark validado.

52. DETECÇÃO AUTOMÁTICA DO PRINCIPAL GARGALO

Depois dos cálculos:

comparar os cinco sub-scores.

O menor score deve ser inicialmente considerado:

principal_gargalo


Exemplos:

financeiro
comercial
retencao
operacao
crescimento


Porém algumas regras críticas devem sobrescrever essa lógica.

Exemplo:

Se:

margem_operacional < 0


principal gargalo deve obrigatoriamente conter:

Financeiro

Mesmo que outro score seja inferior.

Se:

crescimento_liquido < 0
AND churn_aproximado elevado


priorizar:

Retenção

Se:

leads_mensais alto
AND taxa_conversao baixa


priorizar:

Comercial

53. DETECÇÃO DE OPORTUNIDADES

A ferramenta também deve identificar oportunidades.

Criar:

oportunidades[]


Exemplos de regras:

Alta demanda + estrutura saturada + margem positiva

Gerar:

"Possível oportunidade de expansão física ou aumento de capacidade."


Muitos leads + baixa conversão

Gerar:

"Existe oportunidade de aumentar matrículas melhorando o processo comercial sem necessariamente aumentar o investimento em marketing."


Ticket baixo + boa retenção

Gerar:

"Existe oportunidade de revisar precificação e estrutura de planos."


Margem positiva + crescimento positivo + boa reserva

Gerar:

"A operação apresenta indicadores favoráveis para avaliar expansão."


54. DETECÇÃO DE ALERTAS

Criar:

alertas[]


Exemplos:

Faturamento menor que custos

"Operação mensal deficitária."


Alunos abaixo do break-even

"Quantidade atual de alunos abaixo do ponto de equilíbrio simplificado."


Churn superior às novas matrículas

"A academia está perdendo alunos mais rápido do que consegue repor."


Reserva menor que um mês

"Baixa reserva financeira em relação ao custo mensal."


Pretende expandir com margem negativa

"Expansão pode ampliar gargalos existentes antes que a operação atual seja corrigida."


55. TRATAMENTO DE DADOS AUSENTES

A ferramenta nunca deve inventar valores.

Se uma informação opcional não estiver disponível:

value = null


Não utilizar zero.

Zero significa efetivamente zero.

Null significa:

“não informado”.

Exemplo:

investimento_marketing = 0


significa que a empresa não investe.

investimento_marketing = null


significa que o usuário não sabe informar.

56. MÉTRICAS NÃO CALCULÁVEIS

Exemplo:

Se:

churn = 0


não calcular LTV infinito.

Retornar:

ltv_simplificado = null


Mensagem:

“Ainda não há dados suficientes para estimar este indicador.”

Se:

leads = null


não calcular conversão.

Se:

novas_matriculas = 0


não dividir CAC por zero.

57. VALIDAÇÕES IMPORTANTES

A ferramenta deve detectar valores provavelmente incorretos.

Exemplo:

Usuário informa:

alunos_ativos = 300
faturamento = R$ 3.000


Ticket = R$10.

Mostrar discretamente:

“Esse valor parece baixo para 300 alunos. Deseja confirmar?”

Outros exemplos:

aluguel maior que faturamento;

folha extremamente superior ao faturamento;

cancelamentos maiores que alunos ativos;

novas matrículas absurdamente maiores que leads;

área = 0;

ticket = 0;

capital disponível negativo;

valores financeiros extremamente altos por erro de digitação.

Nunca bloquear automaticamente.

Perguntar:

“Tem certeza que este valor está correto?”

58. OBJETO FINAL DO DIAGNÓSTICO

Ao concluir, gerar estrutura semelhante a:

{
  lead: {},
  
  profile: {
    objetivo_principal,
    modelo_negocio,
    cidade,
    estado,
    area_m2
  },

  answers: {},

  metrics: {
    ticket_medio,
    margem_operacional,
    ponto_equilibrio_alunos,
    cac_pago,
    churn_aproximado,
    crescimento_liquido,
    runway_meses,
    investimento_total_estimado,
    gap_investimento
  },

  scores: {
    score_geral,
    score_financeiro,
    score_comercial,
    score_retencao,
    score_operacional,
    score_crescimento
  },

  diagnosis: {
    classificacao,
    principal_gargalo,
    alertas: [],
    oportunidades: []
  }
}


59. PRÉVIA GRATUITA

Ao finalizar o quiz, NÃO entregar todo o diagnóstico.

Mostrar apenas algumas informações.

Para academia existente:

Exemplo

Seu Raio-X foi concluído.

Índice Raio-X: 67/100


Principal ponto de atenção:

Retenção.

3 indicadores merecem atenção.

Identificamos 4 oportunidades de melhoria.

Mostrar no máximo 2 números:

Ticket médio estimado
Margem operacional estimada


Esconder:

análise completa;

todos os sub-scores;

plano de ação;

oportunidades completas;

alertas completos;

expansão;

projeções.

60. PRÉVIA PARA NOVO NEGÓCIO

Exemplo:

Analisamos seu projeto.

Mostrar:

Investimento total informado:
R$ XXX.XXX


Ponto de equilíbrio simplificado:
XXX alunos


Depois:

Encontramos 2 pontos de atenção que podem impactar a viabilidade do projeto.

Também identificamos oportunidades para melhorar sua estrutura financeira antes da abertura.

Bloquear o restante.

61. IMPORTANTE — CÁLCULO E IA DEVEM SER SEPARADOS

Toda matemática deve acontecer por código.

Nunca enviar para uma IA:

“calcule a margem”.

O sistema deve entregar para a IA:

faturamento = 80000
custos = 62000
margem = 22.5%
churn = 4.2%
score_financeiro = 78


A IA será usada posteriormente somente para transformar esses dados em interpretação.

Estrutura:

RESPOSTAS
↓
FUNÇÕES MATEMÁTICAS
↓
INDICADORES
↓
REGRAS DE SCORE
↓
DIAGNÓSTICO ESTRUTURADO
↓
IA PARA REDAÇÃO


Nunca:

RESPOSTAS
↓
IA CALCULA TUDO


62. ARQUITETURA DOS CÁLCULOS

Criar funções independentes.

Exemplos:

calculateAverageTicket()
calculateOperatingMargin()
calculateBreakEven()
calculateCAC()
calculateChurn()
calculateLTV()
calculateRunway()
calculateInvestmentGap()
calculateFinancialScore()
calculateCommercialScore()
calculateRetentionScore()
calculateOperationalScore()
calculateGrowthScore()
calculateOverallScore()
detectMainBottleneck()
detectAlerts()
detectOpportunities()


Isso permitirá alterar uma fórmula sem quebrar o restante da aplicação.

63. CONFIGURAÇÕES NÃO DEVEM FICAR ESPALHADAS NO CÓDIGO

Criar centralmente:

diagnosticConfig


Exemplo:

diagnosticConfig = {
  margin: {},
  churn: {},
  conversion: {},
  runway: {},
  scoreRanges: {},
  scoreWeights: {}
}


Assim posteriormente poderemos mudar:

churn saudável = 3%


para:

churn saudável = 4%


sem reconstruir a ferramenta.

64. EVENTOS PARA ANALYTICS

Registrar:

quiz_started
question_answered
quiz_abandoned
quiz_completed
result_preview_viewed
checkout_clicked


E salvar:

ultima_pergunta_respondida


Isso será importante para identificar em qual pergunta as pessoas abandonam o quiz.

65. PRINCÍPIO CENTRAL DO PRODUTO

A experiência deve provocar a seguinte sensação:

“Eu respondi perguntas simples sobre minha academia e a ferramenta descobriu coisas sobre meu negócio que eu nunca tinha calculado.”

Portanto:

Evitar perguntas técnicas.

Preferir:

Quanto entra?
Quanto sai?
Quantos alunos?
Quantos entram?
Quantos saem?
Quanto investe?
Quanto tem disponível?


E transformar isso internamente em:

ticket
margem
CAC
churn
LTV
break-even
runway
viabilidade
capacidade de expansão


Esse é o mecanismo central do Raio-X.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://gymxray.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f1551e53-553d-4e20-9b10-de001872248c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
