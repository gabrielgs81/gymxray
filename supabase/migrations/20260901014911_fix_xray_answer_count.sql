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

  if v_visitor_id is null then return false; end if;

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
