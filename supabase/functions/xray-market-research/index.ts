import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const nullableString = { type: ["string", "null"] };
const outputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "competitors", "methodology"],
  properties: {
    summary: {
      type: "object",
      additionalProperties: false,
      required: [
        "scope_description",
        "total_identified",
        "competition_diagnosis",
        "diagnosis_reason",
        "market_reading",
        "types_found",
        "gaps",
        "caveats",
      ],
      properties: {
        scope_description: { type: "string" },
        total_identified: { type: "integer", minimum: 0 },
        competition_diagnosis: {
          type: "string",
          enum: ["espaco_aparente", "competitivo", "alta_concorrencia", "inconclusivo"],
        },
        diagnosis_reason: { type: "string" },
        market_reading: { type: "string" },
        types_found: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["type", "count"],
            properties: { type: { type: "string" }, count: { type: "integer", minimum: 0 } },
          },
        },
        gaps: { type: "array", items: { type: "string" } },
        caveats: { type: "array", items: { type: "string" } },
      },
    },
    competitors: {
      type: "array",
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "name",
          "address",
          "neighborhood",
          "academy_type",
          "size_estimate",
          "size_evidence",
          "equipment_profile",
          "equipment_evidence",
          "competitive_level",
          "competitive_reason",
          "project_fit",
          "confidence",
          "source_urls",
        ],
        properties: {
          name: { type: "string" },
          address: nullableString,
          neighborhood: nullableString,
          academy_type: nullableString,
          size_estimate: {
            type: "string",
            enum: ["pequena", "media", "grande", "nao_identificado"],
          },
          size_evidence: nullableString,
          equipment_profile: { type: "array", items: { type: "string" } },
          equipment_evidence: nullableString,
          competitive_level: { type: "string", enum: ["baixo", "medio", "alto", "incerto"] },
          competitive_reason: { type: "string" },
          project_fit: { type: "string" },
          confidence: { type: "string", enum: ["baixa", "media", "alta"] },
          source_urls: { type: "array", items: { type: "string" } },
        },
      },
    },
    methodology: {
      type: "object",
      additionalProperties: false,
      required: ["searched_at", "queries_used", "limitations"],
      properties: {
        searched_at: { type: "string" },
        queries_used: { type: "array", items: { type: "string" } },
        limitations: { type: "array", items: { type: "string" } },
      },
    },
  },
};

function secretKey() {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}") as Record<string, string>;
  return keys.default || Object.values(keys)[0];
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function collectSources(value: unknown, found = new Map<string, { title: string; url: string }>()) {
  if (Array.isArray(value)) value.forEach((item) => collectSources(item, found));
  else if (value && typeof value === "object") {
    const item = value as Record<string, unknown>;
    if (typeof item.url === "string" && /^https?:\/\//.test(item.url)) {
      found.set(item.url, {
        title: typeof item.title === "string" ? item.title : new URL(item.url).hostname,
        url: item.url,
      });
    }
    Object.values(item).forEach((child) => collectSources(child, found));
  }
  return [...found.values()];
}

function outputText(response: Record<string, unknown>) {
  if (typeof response.output_text === "string") return response.output_text;
  for (const output of Array.isArray(response.output) ? response.output : []) {
    const record = output as Record<string, unknown>;
    for (const content of Array.isArray(record.content) ? record.content : []) {
      const part = content as Record<string, unknown>;
      if (part.type === "output_text" && typeof part.text === "string") return part.text;
    }
  }
  throw new Error("A OpenAI não retornou o relatório estruturado.");
}

function safeError(error: unknown) {
  return (error instanceof Error ? error.message : "Falha inesperada na pesquisa.").slice(0, 500);
}

function projectDescription(answers: Record<string, unknown>) {
  return {
    objetivo: answers.objetivo_principal ?? null,
    modelo: answers.modelo_negocio ?? answers.modelo_nova_unidade ?? null,
    area_m2: answers.area_m2 ?? answers.area_nova_unidade_m2 ?? null,
    meta_alunos: answers.meta_alunos_faixa ?? answers.alunos_projetados_12m ?? null,
    investimento:
      answers.investimento_total_planejado ?? answers.investimento_expansao_estimado ?? null,
  };
}

function buildPrompt(location: Record<string, string | null>, project: Record<string, unknown>) {
  return `Você é um analista de mercado fitness brasileiro. Faça uma pesquisa web atual e verificável sobre academias em ${location.query}.

CONTEXTO DO PROJETO DO CLIENTE
${JSON.stringify(project)}

REGRAS DE QUALIDADE
- Pesquise o endereço/bairro e o entorno quando essa informação existir; caso contrário, pesquise a cidade inteira.
- Identifique academias reais e atualmente encontráveis. Priorize site oficial, Google/Apple Maps quando aparecerem nos resultados, redes sociais oficiais, imprensa local e diretórios confiáveis.
- Classifique o formato da academia e o quanto ela concorre com o projeto informado.
- Porte, área e equipamentos podem ser estimados somente quando houver evidência pública. Marque claramente como estimativa e explique a evidência.
- Nunca invente área, quantidade, marca ou modelo de equipamentos. Para equipment_profile, use categorias observáveis ou declaradas, como musculação, peso livre, cardio, funcional, aulas coletivas e treinamento personalizado.
- Toda academia deve ter pelo menos uma URL de fonte. Remova duplicatas e unidades fora da região analisada.
- A contagem significa "academias identificadas na pesquisa", não o total censitário da região.
- A conclusão de concorrência deve considerar o modelo, a escala e o público do projeto do cliente. Quando faltarem dados do projeto, use "incerto" e declare a limitação.
- Escreva em português do Brasil, com frases objetivas para um relatório executivo.`;
}

async function persistCompleted(
  db: ReturnType<typeof createClient>,
  researchId: string,
  response: Record<string, unknown>,
  model: string,
) {
  const result = JSON.parse(outputText(response)) as Record<string, unknown>;
  const sources = collectSources(response);
  const competitors = Array.isArray(result.competitors)
    ? (result.competitors as Record<string, unknown>[])
    : [];

  const { error: updateError } = await db
    .from("xray_market_research")
    .update({
      status: "completed",
      result,
      sources,
      model,
      error_message: null,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", researchId);
  if (updateError) throw updateError;

  await db.from("xray_market_competitors").delete().eq("research_id", researchId);
  if (competitors.length) {
    const rows = competitors.map((item, index) => ({
      research_id: researchId,
      position: index + 1,
      name: item.name,
      address: item.address,
      neighborhood: item.neighborhood,
      academy_type: item.academy_type,
      size_estimate: item.size_estimate,
      size_evidence: item.size_evidence,
      equipment_profile: item.equipment_profile ?? [],
      equipment_evidence: item.equipment_evidence,
      competitive_level: item.competitive_level,
      competitive_reason: item.competitive_reason,
      project_fit: item.project_fit,
      confidence: item.confidence,
      source_urls: item.source_urls ?? [],
    }));
    const { error } = await db.from("xray_market_competitors").insert(rows);
    if (error) throw error;
  }
}

async function retrieveAndPersist(
  db: ReturnType<typeof createClient>,
  research: Record<string, unknown>,
) {
  const responseId = String(research.openai_response_id || "");
  if (!responseId) return "queued";
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) throw new Error("OPENAI_API_KEY não configurada.");
  const response = await fetch(`https://api.openai.com/v1/responses/${responseId}`, {
    headers: { Authorization: `Bearer ${openaiKey}` },
  });
  const payload = (await response.json()) as Record<string, unknown>;
  if (!response.ok) throw new Error(`Falha ao consultar OpenAI (${response.status}).`);
  if (payload.status === "completed") {
    await persistCompleted(
      db,
      String(research.id),
      payload,
      String(research.model || "gpt-5.6-terra"),
    );
    return "completed";
  }
  if (["failed", "cancelled", "incomplete"].includes(String(payload.status))) {
    const detail = payload.error ?? payload.incomplete_details;
    const message =
      detail && typeof detail === "object"
        ? String(
            (detail as Record<string, unknown>).message ??
              (detail as Record<string, unknown>).reason ??
              "",
          )
        : "";
    throw new Error(
      `Pesquisa encerrada com status ${String(payload.status)}${message ? `: ${message}` : "."}`,
    );
  }
  return String(payload.status || "processing");
}

async function poll(db: ReturnType<typeof createClient>, research: Record<string, unknown>) {
  try {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      if (attempt) await new Promise((resolve) => setTimeout(resolve, 4000));
      if ((await retrieveAndPersist(db, research)) === "completed") return;
    }
  } catch (error) {
    await db
      .from("xray_market_research")
      .update({
        status: "failed",
        error_message: safeError(error),
        updated_at: new Date().toISOString(),
      })
      .eq("id", research.id);
  }
}

async function launchResearch(
  db: ReturnType<typeof createClient>,
  research: Record<string, unknown>,
  location: Record<string, string | null>,
  project: Record<string, unknown>,
) {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) throw new Error("OPENAI_API_KEY não configurada.");
  const model = Deno.env.get("OPENAI_MARKET_MODEL") || "gpt-5.6-terra";
  const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      background: true,
      store: true,
      tools: [
        {
          type: "web_search",
          search_context_size: "high",
          user_location: {
            type: "approximate",
            country: "BR",
            city: location.city,
            region: location.state,
          },
        },
      ],
      tool_choice: "required",
      include: ["web_search_call.action.sources"],
      max_tool_calls: 10,
      input: buildPrompt(location, project),
      text: {
        format: {
          type: "json_schema",
          name: "gym_market_research",
          strict: true,
          schema: outputSchema,
        },
      },
    }),
  });
  const openai = (await openaiResponse.json()) as Record<string, unknown>;
  if (!openaiResponse.ok || typeof openai.id !== "string") {
    const detail = openai.error as Record<string, unknown> | undefined;
    throw new Error(
      String(detail?.message ?? `Não foi possível iniciar a pesquisa (${openaiResponse.status}).`),
    );
  }

  const now = new Date().toISOString();
  const { data: processing, error: startError } = await db
    .from("xray_market_research")
    .update({
      status: "processing",
      openai_response_id: openai.id,
      model,
      error_message: null,
      attempt_count: Number(research.attempt_count || 0) + 1,
      started_at: now,
      updated_at: now,
    })
    .eq("id", research.id)
    .select("*")
    .single();
  if (startError) throw startError;
  EdgeRuntime.waitUntil(poll(db, processing));
  return processing;
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = secretKey();
  if (!supabaseUrl || !serviceKey)
    return json({ error: "Configuração interna indisponível." }, 500);
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (body.action === "refresh") {
      const slug = typeof body.report_slug === "string" ? body.report_slug : "";
      if (!/^[a-f0-9]{30,60}$/i.test(slug)) return json({ error: "Relatório inválido." }, 400);
      const { data: report } = await db
        .from("xray_reports")
        .select("diagnostic_id")
        .eq("public_slug", slug)
        .maybeSingle();
      if (!report) return json({ error: "Relatório não encontrado." }, 404);
      const { data: research } = await db
        .from("xray_market_research")
        .select("*")
        .eq("session_id", report.diagnostic_id)
        .maybeSingle();
      if (!research) return json({ status: "not_started" });
      if (research.status === "failed" && body.retry === true) {
        const location = {
          query: research.location_query,
          city: research.city,
          state: research.state,
          complement: research.neighborhood_or_address,
          scope: research.scope,
        };
        const processing = await launchResearch(
          db,
          research,
          location,
          (research.project_context || {}) as Record<string, unknown>,
        );
        return json({ status: processing.status }, 202);
      }
      if (research.status === "processing" && research.openai_response_id) {
        try {
          await retrieveAndPersist(db, research);
        } catch (error) {
          await db
            .from("xray_market_research")
            .update({
              status: "failed",
              error_message: safeError(error),
              updated_at: new Date().toISOString(),
            })
            .eq("id", research.id);
        }
      }
      const { data: current } = await db
        .from("xray_market_research")
        .select("status,updated_at")
        .eq("id", research.id)
        .single();
      return json(current);
    }

    const sessionId = typeof body.session_id === "string" ? body.session_id : "";
    const writeToken = typeof body.write_token === "string" ? body.write_token : "";
    if (!sessionId || !writeToken) return json({ error: "Sessão inválida." }, 400);
    const { data: session } = await db
      .from("xray_quiz_sessions")
      .select("id,write_token_hash,answers,lead")
      .eq("id", sessionId)
      .maybeSingle();
    if (!session || (await sha256(writeToken)) !== session.write_token_hash)
      return json({ error: "Sessão não autorizada." }, 401);

    const answers = (session.answers || {}) as Record<string, unknown>;
    const lead = (session.lead || {}) as Record<string, unknown>;
    const city = String(lead.cidade || answers.cidade || "").trim();
    const state = String(lead.estado || answers.estado || "").trim();
    const complement = String(answers.bairro_endereco || "").trim();
    if (!city || !state) return json({ error: "Cidade e estado ainda não foram informados." }, 422);
    const scope = complement ? (/\d/.test(complement) ? "address" : "neighborhood") : "city";
    const location = {
      query: [complement, city, state, "Brasil"].filter(Boolean).join(", "),
      city,
      state,
      complement: complement || null,
      scope,
    };
    const project = projectDescription(answers);
    const fingerprint = await sha256(JSON.stringify({ location, project }));

    const { data: existing } = await db
      .from("xray_market_research")
      .select("*")
      .eq("session_id", sessionId)
      .maybeSingle();
    if (
      existing &&
      existing.request_fingerprint === fingerprint &&
      ["processing", "completed"].includes(existing.status)
    ) {
      if (existing.status === "processing") EdgeRuntime.waitUntil(poll(db, existing));
      return json({ id: existing.id, status: existing.status, reused: true }, 202);
    }

    const now = new Date().toISOString();
    const row = {
      session_id: sessionId,
      status: "queued",
      scope,
      location_query: location.query,
      city,
      state,
      neighborhood_or_address: complement || null,
      project_context: project,
      request_fingerprint: fingerprint,
      openai_response_id: null,
      result: {},
      sources: [],
      error_message: null,
      completed_at: null,
      updated_at: now,
    };
    const { data: research, error: upsertError } = await db
      .from("xray_market_research")
      .upsert(row, { onConflict: "session_id" })
      .select("*")
      .single();
    if (upsertError) throw upsertError;

    await launchResearch(db, research, location, project);
    return json({ id: research.id, status: "processing" }, 202);
  } catch (error) {
    return json({ error: safeError(error) }, 500);
  }
});
