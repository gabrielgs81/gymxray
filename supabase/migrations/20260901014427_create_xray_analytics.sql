create table public.xray_page_views (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null,
  session_id uuid,
  viewed_at timestamptz not null default now(),
  path text,
  referrer text,
  attribution jsonb not null default '{}'::jsonb,
  device jsonb not null default '{}'::jsonb
);

create table public.xray_quiz_sessions (
  id uuid primary key,
  visitor_id uuid not null,
  write_token_hash text not null,
  quiz_version text not null default 'v1',
  status text not null default 'iniciado' check (status in ('iniciado', 'em_andamento', 'concluido', 'reiniciado')),
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  current_step text,
  last_answered_step text,
  total_steps integer,
  answers_count integer not null default 0,
  answers jsonb not null default '{}'::jsonb,
  lead jsonb not null default '{}'::jsonb,
  attribution jsonb not null default '{}'::jsonb,
  device jsonb not null default '{}'::jsonb
);

create table public.xray_session_steps (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.xray_quiz_sessions(id) on delete cascade,
  step_id text not null,
  step_index integer,
  question_keys text[] not null default '{}',
  first_viewed_at timestamptz not null default now(),
  last_viewed_at timestamptz not null default now(),
  completed_at timestamptz,
  visit_count integer not null default 1,
  duration_ms integer,
  unique (session_id, step_id)
);

create table public.xray_answers (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.xray_quiz_sessions(id) on delete cascade,
  step_id text not null,
  question_key text not null,
  value jsonb not null,
  first_answered_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revision integer not null default 1,
  unique (session_id, question_key)
);

create table public.xray_answer_history (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.xray_quiz_sessions(id) on delete cascade,
  step_id text not null,
  question_key text not null,
  value jsonb not null,
  answered_at timestamptz not null default now()
);

create table public.xray_events (
  id bigint generated always as identity primary key,
  session_id uuid references public.xray_quiz_sessions(id) on delete cascade,
  visitor_id uuid not null,
  event_name text not null,
  step_id text,
  occurred_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb
);

create table public.xray_diagnostics (
  session_id uuid primary key references public.xray_quiz_sessions(id) on delete cascade,
  score integer,
  path text,
  scores jsonb not null default '{}'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  diagnosis jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now()
);

create index xray_page_views_visitor_idx on public.xray_page_views (visitor_id, viewed_at desc);
create index xray_sessions_status_idx on public.xray_quiz_sessions (status, updated_at desc);
create index xray_sessions_visitor_idx on public.xray_quiz_sessions (visitor_id, started_at desc);
create index xray_events_session_idx on public.xray_events (session_id, occurred_at);
create index xray_events_name_idx on public.xray_events (event_name, occurred_at desc);
create index xray_answer_history_session_idx on public.xray_answer_history (session_id, answered_at);

alter table public.xray_page_views enable row level security;
alter table public.xray_quiz_sessions enable row level security;
alter table public.xray_session_steps enable row level security;
alter table public.xray_answers enable row level security;
alter table public.xray_answer_history enable row level security;
alter table public.xray_events enable row level security;
alter table public.xray_diagnostics enable row level security;

revoke all on public.xray_page_views from anon, authenticated;
revoke all on public.xray_quiz_sessions from anon, authenticated;
revoke all on public.xray_session_steps from anon, authenticated;
revoke all on public.xray_answers from anon, authenticated;
revoke all on public.xray_answer_history from anon, authenticated;
revoke all on public.xray_events from anon, authenticated;
revoke all on public.xray_diagnostics from anon, authenticated;

create or replace function public.xray_track_page_view(
  p_visitor_id uuid,
  p_payload jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_id uuid;
begin
  insert into public.xray_page_views (visitor_id, path, referrer, attribution, device)
  values (
    p_visitor_id,
    left(p_payload->>'path', 500),
    left(p_payload->>'referrer', 1000),
    coalesce(p_payload->'attribution', '{}'::jsonb),
    coalesce(p_payload->'device', '{}'::jsonb)
  ) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.xray_start_session(
  p_session_id uuid,
  p_visitor_id uuid,
  p_write_token uuid,
  p_payload jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
begin
  insert into public.xray_quiz_sessions (
    id, visitor_id, write_token_hash, quiz_version, current_step, total_steps,
    lead, attribution, device
  ) values (
    p_session_id,
    p_visitor_id,
    encode(extensions.digest(p_write_token::text, 'sha256'), 'hex'),
    coalesce(nullif(p_payload->>'quiz_version', ''), 'v1'),
    p_payload->>'current_step',
    nullif(p_payload->>'total_steps', '')::integer,
    coalesce(p_payload->'lead', '{}'::jsonb),
    coalesce(p_payload->'attribution', '{}'::jsonb),
    coalesce(p_payload->'device', '{}'::jsonb)
  ) on conflict (id) do nothing;

  update public.xray_page_views
  set session_id = p_session_id
  where visitor_id = p_visitor_id and session_id is null;

  insert into public.xray_events (session_id, visitor_id, event_name, payload)
  values (p_session_id, p_visitor_id, 'quiz_started', p_payload);
  return p_session_id;
end;
$$;

create or replace function public.xray_ingest(
  p_session_id uuid,
  p_write_token uuid,
  p_action text,
  p_payload jsonb default '{}'::jsonb
) returns boolean
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_visitor_id uuid;
  v_step_id text := p_payload->>'step_id';
  v_item record;
begin
  select visitor_id into v_visitor_id
  from public.xray_quiz_sessions
  where id = p_session_id
    and write_token_hash = encode(extensions.digest(p_write_token::text, 'sha256'), 'hex');

  if v_visitor_id is null then
    return false;
  end if;

  update public.xray_quiz_sessions
  set updated_at = now(),
      status = coalesce(nullif(p_payload->>'status', ''), status),
      current_step = coalesce(p_payload->>'current_step', current_step),
      last_answered_step = coalesce(p_payload->>'last_answered_step', last_answered_step),
      total_steps = coalesce(nullif(p_payload->>'total_steps', '')::integer, total_steps),
      answers = case when p_payload ? 'all_answers' then p_payload->'all_answers' else answers end,
      answers_count = case
        when p_payload ? 'all_answers'
          then (select count(*) from jsonb_object_keys(p_payload->'all_answers'))
        else answers_count
      end,
      lead = case when p_payload ? 'lead' then p_payload->'lead' else lead end,
      completed_at = case when p_action = 'quiz_completed' then now() else completed_at end
  where id = p_session_id;

  if p_action = 'step_viewed' then
    insert into public.xray_session_steps (session_id, step_id, step_index, question_keys)
    values (
      p_session_id, v_step_id, nullif(p_payload->>'step_index', '')::integer,
      coalesce(array(select jsonb_array_elements_text(p_payload->'question_keys')), '{}')
    )
    on conflict (session_id, step_id) do update
      set last_viewed_at = now(), visit_count = public.xray_session_steps.visit_count + 1,
          step_index = excluded.step_index, question_keys = excluded.question_keys;
  elsif p_action = 'step_completed' then
    update public.xray_session_steps
    set completed_at = now(), last_viewed_at = now(),
        duration_ms = nullif(p_payload->>'duration_ms', '')::integer
    where session_id = p_session_id and step_id = v_step_id;

    for v_item in select key, value from jsonb_each(coalesce(p_payload->'answers', '{}'::jsonb)) loop
      insert into public.xray_answers (session_id, step_id, question_key, value)
      values (p_session_id, v_step_id, v_item.key, v_item.value)
      on conflict (session_id, question_key) do update
        set value = excluded.value, step_id = excluded.step_id, updated_at = now(),
            revision = public.xray_answers.revision + 1;
      insert into public.xray_answer_history (session_id, step_id, question_key, value)
      values (p_session_id, v_step_id, v_item.key, v_item.value);
    end loop;
  elsif p_action = 'diagnostic_generated' then
    insert into public.xray_diagnostics (session_id, score, path, scores, metrics, diagnosis, result)
    values (
      p_session_id, nullif(p_payload->>'score', '')::integer, p_payload->>'path',
      coalesce(p_payload->'scores', '{}'::jsonb), coalesce(p_payload->'metrics', '{}'::jsonb),
      coalesce(p_payload->'diagnosis', '{}'::jsonb), coalesce(p_payload->'result', '{}'::jsonb)
    ) on conflict (session_id) do update
      set score = excluded.score, path = excluded.path, scores = excluded.scores,
          metrics = excluded.metrics, diagnosis = excluded.diagnosis,
          result = excluded.result, generated_at = now();
  end if;

  insert into public.xray_events (session_id, visitor_id, event_name, step_id, payload)
  values (p_session_id, v_visitor_id, p_action, v_step_id, p_payload - 'all_answers' - 'lead' - 'result');
  return true;
end;
$$;

revoke all on function public.xray_track_page_view(uuid, jsonb) from public;
revoke all on function public.xray_start_session(uuid, uuid, uuid, jsonb) from public;
revoke all on function public.xray_ingest(uuid, uuid, text, jsonb) from public;
grant execute on function public.xray_track_page_view(uuid, jsonb) to anon, authenticated;
grant execute on function public.xray_start_session(uuid, uuid, uuid, jsonb) to anon, authenticated;
grant execute on function public.xray_ingest(uuid, uuid, text, jsonb) to anon, authenticated;
