create table if not exists public.xray_market_research (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.xray_quiz_sessions(id) on delete cascade,
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'completed', 'failed')),
  scope text not null default 'city'
    check (scope in ('address', 'neighborhood', 'city')),
  location_query text not null,
  city text not null,
  state text not null,
  neighborhood_or_address text,
  project_context jsonb not null default '{}'::jsonb,
  request_fingerprint text not null,
  openai_response_id text,
  model text,
  result jsonb not null default '{}'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  error_message text,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id)
);

create table if not exists public.xray_market_competitors (
  id uuid primary key default gen_random_uuid(),
  research_id uuid not null references public.xray_market_research(id) on delete cascade,
  position integer not null check (position > 0),
  name text not null,
  address text,
  neighborhood text,
  academy_type text,
  size_estimate text,
  size_evidence text,
  equipment_profile jsonb not null default '[]'::jsonb,
  equipment_evidence text,
  competitive_level text check (competitive_level in ('baixo', 'medio', 'alto', 'incerto')),
  competitive_reason text,
  project_fit text,
  confidence text check (confidence in ('baixa', 'media', 'alta')),
  source_urls jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (research_id, position)
);

create index if not exists xray_market_research_status_updated_idx
  on public.xray_market_research (updated_at)
  where status in ('queued', 'processing');
create index if not exists xray_market_competitors_research_id_idx
  on public.xray_market_competitors (research_id);

alter table public.xray_market_research enable row level security;
alter table public.xray_market_competitors enable row level security;

revoke all on public.xray_market_research from anon, authenticated;
revoke all on public.xray_market_competitors from anon, authenticated;
grant all on public.xray_market_research to service_role;
grant all on public.xray_market_competitors to service_role;

create policy "xray admins read market research"
on public.xray_market_research for select to authenticated
using (exists (
  select 1 from public.xray_admins a where a.user_id = (select auth.uid())
));

create policy "xray admins read market competitors"
on public.xray_market_competitors for select to authenticated
using (exists (
  select 1 from public.xray_admins a where a.user_id = (select auth.uid())
));

grant select on public.xray_market_research to authenticated;
grant select on public.xray_market_competitors to authenticated;

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
