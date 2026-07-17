-- ════════════════════════════════════════════════════════════════
--  iShop — الأسعار + كشف الأسعار بالكود (R1850)
--  ✅ اتنفّذت فعلاً على السيرفر عبر migration اسمها: pricing_and_code_unlock
--  الملف ده للتوثيق/إعادة الإنشاء. آمن لإعادة التشغيل.
--  ملاحظة: جدول devices مالوش قيد فريد على id، فمفيش FK عليه.
-- ════════════════════════════════════════════════════════════════

-- 1) السياسات السعرية (+ الكود السري access_code)
create table if not exists public.pricing_policies (
  id          bigint generated always as identity primary key,
  name        text    not null,
  code        text    not null unique,   -- مُعرّف داخلي ثابت
  is_active   boolean not null default true,
  is_public   boolean not null default false,  -- "عرض الأسعار" على الافتراضية
  is_default  boolean not null default false,  -- السياسة الافتراضية (محمية)
  access_code text unique,                      -- كود التير السري (مخفي عن الزائر)
  sort        int     not null default 0,
  created_at  timestamptz not null default now()
);

insert into public.pricing_policies (name, code, is_default, sort)
select 'السعر الافتراضي', 'default', true, 0
where not exists (select 1 from public.pricing_policies where is_default);

alter table public.pricing_policies enable row level security;

drop policy if exists pp_read  on public.pricing_policies;
create policy pp_read on public.pricing_policies for select using (true);

drop policy if exists pp_admin on public.pricing_policies;
create policy pp_admin on public.pricing_policies for all
  using (public.is_admin()) with check (public.is_admin());

-- الكود السري مخفي عن الزائر: منح الجدول الكامل بيتفوّق على منع العمود،
-- فنسحب منح SELECT على الجدول ونمنح الأعمدة الآمنة فقط (من غير access_code).
revoke select on public.pricing_policies from anon;
grant  select (id, name, code, is_active, is_public, is_default, sort)
  on public.pricing_policies to anon;

-- 2) أسعار الأجهزة (بدون FK على devices)
create table if not exists public.device_prices (
  device_id bigint  not null,
  policy_id bigint  not null references public.pricing_policies(id) on delete cascade,
  price     numeric,
  primary key (device_id, policy_id)
);

alter table public.device_prices enable row level security;

-- قراءة: الموظف يقرأ الكل؛ الزائر يقرأ أسعار السياسات المعلَنة فقط
drop policy if exists dp_read on public.device_prices;
create policy dp_read on public.device_prices for select using (
  auth.uid() is not null
  or policy_id in (select id from public.pricing_policies where is_public and is_active)
);

-- كتابة: نفس صلاحية تعديل الجهاز بالظبط
create or replace function public.can_write_device_price(p_device_id bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.ishop_users u
    join public.devices d on d.id = p_device_id
    where u.auth_id = auth.uid() and u.is_active
      and (
        u.role = 'admin'
        or (u.role in ('entry','user') and d.addedby = u.display_name and coalesce(u.can_edit, true))
      )
  );
$$;

drop policy if exists dp_write on public.device_prices;
create policy dp_write on public.device_prices for all
  using      (public.can_write_device_price(device_id))
  with check (public.can_write_device_price(device_id));

-- 3) كشف الأسعار بالكود — للسياسة المطابقة فقط، وللأجهزة غير المؤرشفة
create or replace function public.unlock_prices(p_code text)
returns table (device_id bigint, policy_id bigint, policy_name text, price numeric)
language sql stable security definer set search_path = public as $$
  select dp.device_id, dp.policy_id, pol.name, dp.price
  from public.pricing_policies pol
  join public.device_prices dp on dp.policy_id = pol.id
  join public.devices d on d.id = dp.device_id and coalesce(d.archived, false) = false
  where pol.is_active and pol.access_code is not null and pol.access_code = p_code;
$$;

grant execute on function public.unlock_prices(text) to anon, authenticated;
