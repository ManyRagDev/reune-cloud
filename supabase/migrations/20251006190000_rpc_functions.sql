-- RPC: participants_bulk_upsert
create or replace function public.participants_bulk_upsert(
  evento_id uuid,
  participantes jsonb
)
returns setof public.participantes_evento
language plpgsql
security definer
as $$
declare
  rec record;
  out_row public.participantes_evento%rowtype;
begin
  -- ACL: validar que o usuário é dono do evento
  if not exists (
    select 1 from public.eventos e where e.id = participants_bulk_upsert.evento_id and e.usuario_id = auth.uid()
  ) then
    raise exception 'not authorized for event %', participants_bulk_upsert.evento_id using errcode = '42501';
  end if;

  for rec in
    select * from jsonb_to_recordset(participantes) as (
      id uuid,
      nome_participante text,
      contato text,
      status_convite text,
      preferencias jsonb,
      valor_responsavel numeric
    )
  loop
    insert into public.participantes_evento as p (
      id, evento_id, nome_participante, contato, status_convite, preferencias, valor_responsavel
    ) values (
      coalesce(rec.id, gen_random_uuid()),
      evento_id,
      rec.nome_participante,
      rec.contato,
      coalesce(rec.status_convite, 'pendente'),
      rec.preferencias,
      rec.valor_responsavel
    )
    on conflict (id) do update set
      nome_participante = excluded.nome_participante,
      contato = excluded.contato,
      status_convite = excluded.status_convite,
      preferencias = excluded.preferencias,
      valor_responsavel = excluded.valor_responsavel
    returning * into out_row;

    return next out_row;
  end loop;
  return;
end;
$$;

-- RPC: items_replace_for_event (transacional)
create or replace function public.items_replace_for_event(
  evento_id uuid,
  itens jsonb
)
returns setof public.itens_evento
language plpgsql
security definer
as $$
declare
  out_row public.itens_evento%rowtype;
begin
  -- ACL: validar que o usuário é dono do evento
  if not exists (
    select 1 from public.eventos e where e.id = items_replace_for_event.evento_id and e.usuario_id = auth.uid()
  ) then
    raise exception 'not authorized for event %', items_replace_for_event.evento_id using errcode = '42501';
  end if;

  -- Transação implícita na função; em caso de erro, aborta
  delete from public.itens_evento where evento_id = items_replace_for_event.evento_id;

  insert into public.itens_evento (
    id, evento_id, nome_item, quantidade, unidade, valor_estimado, categoria, prioridade
  )
  select
    coalesce(i.id, gen_random_uuid()) as id,
    items_replace_for_event.evento_id as evento_id,
    i.nome_item,
    i.quantidade,
    i.unidade,
    i.valor_estimado,
    i.categoria,
    i.prioridade
  from jsonb_to_recordset(itens) as i(
    id uuid,
    nome_item text,
    quantidade numeric,
    unidade text,
    valor_estimado numeric,
    categoria text,
    prioridade text
  );

  -- Retornar finais
  for out_row in
    select * from public.itens_evento where evento_id = items_replace_for_event.evento_id order by updated_at desc
  loop
    return next out_row;
  end loop;
  return;
end;
$$;

-- RPC: distribution_bulk_upsert
create or replace function public.distribution_bulk_upsert(
  evento_id uuid,
  rows jsonb
)
returns setof public.distribuicao_itens
language plpgsql
security definer
as $$
declare
  rec record;
  out_row public.distribuicao_itens%rowtype;
begin
  -- ACL: validar dono
  if not exists (
    select 1 from public.eventos e where e.id = distribution_bulk_upsert.evento_id and e.usuario_id = auth.uid()
  ) then
    raise exception 'not authorized for event %', distribution_bulk_upsert.evento_id using errcode = '42501';
  end if;

  for rec in
    select * from jsonb_to_recordset(rows) as (
      id uuid,
      item_id uuid,
      participante_id uuid,
      quantidade_atribuida numeric,
      valor_rateado numeric,
      observacoes text
    )
  loop
    -- Validar item pertence ao evento
    if not exists (
      select 1 from public.itens_evento i where i.id = rec.item_id and i.evento_id = distribution_bulk_upsert.evento_id
    ) then
      raise exception 'item % does not belong to event %', rec.item_id, distribution_bulk_upsert.evento_id using errcode = '23503';
    end if;

    insert into public.distribuicao_itens as d (
      id, item_id, participante_id, quantidade_atribuida, valor_rateado, observacoes
    ) values (
      coalesce(rec.id, gen_random_uuid()),
      rec.item_id,
      rec.participante_id,
      rec.quantidade_atribuida,
      rec.valor_rateado,
      rec.observacoes
    )
    on conflict (item_id, participante_id) do update set
      quantidade_atribuida = excluded.quantidade_atribuida,
      valor_rateado = excluded.valor_rateado,
      observacoes = excluded.observacoes
    returning * into out_row;

    return next out_row;
  end loop;
  return;
end;
$$;

-- RPC: events_plan
create or replace function public.events_plan(evento_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  ev jsonb;
  it jsonb;
  pa jsonb;
  di jsonb;
begin
  -- ACL
  if not exists (
    select 1 from public.eventos e where e.id = events_plan.evento_id and e.usuario_id = auth.uid()
  ) then
    raise exception 'not authorized for event %', events_plan.evento_id using errcode = '42501';
  end if;

  select to_jsonb(e) into ev from public.eventos e where e.id = events_plan.evento_id;
  select coalesce(jsonb_agg(to_jsonb(i)), '[]'::jsonb) into it from public.itens_evento i where i.evento_id = events_plan.evento_id;
  select coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb) into pa from public.participantes_evento p where p.evento_id = events_plan.evento_id;
  select coalesce(jsonb_agg(to_jsonb(d)), '[]'::jsonb) into di from public.distribuicao_itens d
    join public.itens_evento i on i.id = d.item_id
    where i.evento_id = events_plan.evento_id;

  return jsonb_build_object('evento', ev, 'itens', it, 'participantes', pa, 'distribuicao', di);
end;
$$;

-- RPC: events_distribution_summary (opcional)
create or replace function public.events_distribution_summary(evento_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  por_participante jsonb;
  total numeric;
begin
  if not exists (
    select 1 from public.eventos e where e.id = events_distribution_summary.evento_id and e.usuario_id = auth.uid()
  ) then
    raise exception 'not authorized for event %', events_distribution_summary.evento_id using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) into por_participante
  from (
    select d.participante_id, sum(d.valor_rateado) as total
    from public.distribuicao_itens d
    join public.itens_evento i on i.id = d.item_id
    where i.evento_id = events_distribution_summary.evento_id
    group by d.participante_id
  ) x;

  select coalesce(sum(d.valor_rateado), 0) into total
  from public.distribuicao_itens d
  join public.itens_evento i on i.id = d.item_id
  where i.evento_id = events_distribution_summary.evento_id;

  return jsonb_build_object('porParticipante', por_participante, 'custoTotal', total);
end;
$$;