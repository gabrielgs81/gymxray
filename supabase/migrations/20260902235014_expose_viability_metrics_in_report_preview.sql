create or replace function public.xray_get_report(p_public_slug text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_report public.xray_reports%rowtype;
  v_market public.xray_market_research%rowtype;
  v_authorized boolean := false;
  v_user_id uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_market_data jsonb;
  v_preview_answers jsonb;
  v_preview_metrics jsonb;
begin
  select * into v_report
  from public.xray_reports
  where public_slug = p_public_slug and status = 'generated';

  if not found then return null; end if;

  if v_user_id is not null then
    select (
      exists (select 1 from public.xray_admins a where a.user_id = v_user_id)
      or (
        v_report.unlocked
        and exists (
          select 1 from public.xray_report_access ra
          where ra.report_id = v_report.id
            and ra.status = 'active'
            and (ra.expires_at is null or ra.expires_at > now())
            and (ra.user_id = v_user_id or lower(ra.email) = v_email)
        )
      )
    ) into v_authorized;
  end if;

  select * into v_market
  from public.xray_market_research
  where session_id = v_report.diagnostic_id;

  if found then
    v_market_data := jsonb_build_object(
      'id', v_market.id,
      'status', v_market.status,
      'scope', v_market.scope,
      'locationQuery', v_market.location_query,
      'city', v_market.city,
      'state', v_market.state,
      'updatedAt', v_market.updated_at,
      'completedAt', v_market.completed_at,
      'summary', coalesce(v_market.result -> 'summary', '{}'::jsonb),
      'methodology', coalesce(v_market.result -> 'methodology', '{}'::jsonb),
      'competitors', case
        when v_authorized then coalesce(v_market.result -> 'competitors', '[]'::jsonb)
        else coalesce((
          select jsonb_agg(item)
          from (
            select item
            from jsonb_array_elements(coalesce(v_market.result -> 'competitors', '[]'::jsonb)) with ordinality as c(item, ord)
            order by ord
            limit 2
          ) preview_competitors
        ), '[]'::jsonb)
      end,
      'sources', case
        when v_authorized then v_market.sources
        else coalesce((
          select jsonb_agg(item)
          from (
            select item
            from jsonb_array_elements(v_market.sources) with ordinality as s(item, ord)
            order by ord
            limit 3
          ) preview_sources
        ), '[]'::jsonb)
      end,
      'isPreview', not v_authorized,
      'error', case when v_market.status = 'failed' then 'A pesquisa regional precisa ser processada novamente.' else null end
    );
  else
    v_market_data := jsonb_build_object('status', 'not_started');
  end if;

  v_preview_answers := jsonb_build_object(
    'objetivo_principal', v_report.report_data #> '{answers,objetivo_principal}',
    'modelo_negocio', v_report.report_data #> '{answers,modelo_negocio}',
    'area_m2', v_report.report_data #> '{answers,area_m2}',
    'investimento_total_planejado', v_report.report_data #> '{answers,investimento_total_planejado}',
    'capital_disponivel', v_report.report_data #> '{answers,capital_disponivel}',
    'meta_alunos_faixa', v_report.report_data #> '{answers,meta_alunos_faixa}',
    'alunos_projetados_12m', v_report.report_data #> '{answers,alunos_projetados_12m}',
    'ticket_planejado', v_report.report_data #> '{answers,ticket_planejado}',
    'populacao_municipal_estimada', v_report.report_data #> '{answers,populacao_municipal_estimada}',
    'populacao_ano_referencia', v_report.report_data #> '{answers,populacao_ano_referencia}'
  );

  v_preview_metrics := jsonb_build_object(
    'investimento_total_estimado', v_report.report_data #> '{metrics,investimento_total_estimado}',
    'capital_efetivo_disponivel', v_report.report_data #> '{metrics,capital_efetivo_disponivel}',
    'gap_investimento', v_report.report_data #> '{metrics,gap_investimento}',
    'cobertura_capital', v_report.report_data #> '{metrics,cobertura_capital}',
    'custo_operacional_mensal', v_report.report_data #> '{metrics,custo_operacional_mensal}',
    'aluguel_mensal_referencia', v_report.report_data #> '{metrics,aluguel_mensal_referencia}',
    'folha_mensal_referencia', v_report.report_data #> '{metrics,folha_mensal_referencia}',
    'outros_custos_mensais_referencia', v_report.report_data #> '{metrics,outros_custos_mensais_referencia}',
    'custo_operacional_minimo', v_report.report_data #> '{metrics,custo_operacional_minimo}',
    'custo_operacional_maximo', v_report.report_data #> '{metrics,custo_operacional_maximo}',
    'custo_operacional_fonte', v_report.report_data #> '{metrics,custo_operacional_fonte}',
    'ticket_referencia', v_report.report_data #> '{metrics,ticket_referencia}',
    'ticket_fonte', v_report.report_data #> '{metrics,ticket_fonte}',
    'ponto_equilibrio_alunos', v_report.report_data #> '{metrics,ponto_equilibrio_alunos}',
    'prazo_break_even_meses', v_report.report_data #> '{metrics,prazo_break_even_meses}',
    'payback_meses_estimado', v_report.report_data #> '{metrics,payback_meses_estimado}',
    'resultado_mensal_estabilizado', v_report.report_data #> '{metrics,resultado_mensal_estabilizado}',
    'margem_estabilizada', v_report.report_data #> '{metrics,margem_estabilizada}',
    'premissas_estimadas', v_report.report_data #> '{metrics,premissas_estimadas}',
    'meta_alunos_referencia', v_report.report_data #> '{metrics,meta_alunos_referencia}',
    'densidade_alunos_planejada', v_report.report_data #> '{metrics,densidade_alunos_planejada}',
    'score_compatibilidade_espaco', v_report.report_data #> '{metrics,score_compatibilidade_espaco}',
    'populacao_municipal_estimada', v_report.report_data #> '{metrics,populacao_municipal_estimada}',
    'participacao_populacao_necessaria', v_report.report_data #> '{metrics,participacao_populacao_necessaria}'
  );

  return jsonb_build_object(
    'id', v_report.id,
    'slug', v_report.public_slug,
    'status', v_report.status,
    'paid', v_report.paid,
    'unlocked', v_report.unlocked,
    'authorized', v_authorized,
    'generatedAt', v_report.generated_at,
    'data', case
      when v_authorized then v_report.report_data || jsonb_build_object('market', v_market_data)
      else jsonb_build_object(
        'metadata', v_report.report_data -> 'metadata',
        'profile', v_report.report_data -> 'profile',
        'lead', jsonb_build_object(
          'nome', v_report.report_data #> '{lead,nome}',
          'cidade', v_report.report_data #> '{lead,cidade}',
          'estado', v_report.report_data #> '{lead,estado}'
        ),
        'answers', v_preview_answers,
        'metrics', v_preview_metrics,
        'summary', v_report.report_data -> 'summary',
        'market', v_market_data,
        'diagnosis', jsonb_build_object(
          'principal_gargalo', v_report.report_data #> '{diagnosis,principal_gargalo}',
          'alertCount', jsonb_array_length(coalesce(v_report.report_data #> '{diagnosis,alertas}', '[]'::jsonb)),
          'opportunityCount', jsonb_array_length(coalesce(v_report.report_data #> '{diagnosis,oportunidades}', '[]'::jsonb))
        )
      )
    end
  );
end;
$$;

revoke all on function public.xray_get_report(text) from public;
grant execute on function public.xray_get_report(text) to anon, authenticated;
