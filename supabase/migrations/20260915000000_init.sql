-- 학과 대항전 클릭 배틀: departments 테이블 + 원자적 점수 증감 RPC
-- Supabase 대시보드의 SQL Editor에 붙여넣어 실행하거나 `supabase db push`로 적용하세요.

create table if not exists public.departments (
  id bigint generated always as identity primary key,
  name text not null unique,
  score bigint not null default 0 check (score >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists departments_score_idx on public.departments (score desc);

-- 원자적 증감: 단일 UPDATE 문이 Postgres의 row-level lock으로 보호되므로
-- 동시에 여러 요청이 같은 학과를 클릭해도 race condition 없이 모두 반영된다.
-- 애플리케이션 코드에서 "읽고 - 계산 - 쓰기"를 절대 따로 하지 않는다.

create or replace function public.support_department(dept_id bigint)
returns public.departments as $$
  update public.departments
  set score = score + 1, updated_at = now()
  where id = dept_id
  returning *;
$$ language sql volatile;

create or replace function public.attack_department(dept_id bigint)
returns public.departments as $$
  update public.departments
  set score = greatest(score - 1, 0), updated_at = now()
  where id = dept_id
  returning *;
$$ language sql volatile;

-- Row Level Security: 누구나 읽을 수 있지만 직접 쓰기는 아무도 할 수 없다.
-- 점수 변경은 반드시 서버(app/api/support, app/api/attack)가
-- SUPABASE_SERVICE_ROLE_KEY로 support_department/attack_department를
-- 호출해서만 이루어진다 (서비스 롤은 RLS를 우회한다).
alter table public.departments enable row level security;

create policy "departments are publicly readable"
  on public.departments for select
  to anon, authenticated
  using (true);

revoke all on function public.support_department(bigint) from public;
revoke all on function public.attack_department(bigint) from public;
grant execute on function public.support_department(bigint) to service_role;
grant execute on function public.attack_department(bigint) to service_role;

-- 초기 데이터 (연세대 참여 학과 66개). lib/departmentNames.ts 와 항상 같은 목록을 유지한다.
insert into public.departments (name) values
  ('국어국문학과'),
  ('중어중문학과'),
  ('영어영문학과'),
  ('독어독문학과'),
  ('불어불문학과'),
  ('노어노문학과'),
  ('사학과'),
  ('철학과'),
  ('문헌정보학과'),
  ('심리학과'),
  ('경제학부'),
  ('응용통계학과'),
  ('경영학과'),
  ('수학과'),
  ('물리학과'),
  ('화학과'),
  ('지구시스템과학과'),
  ('천문우주학과'),
  ('대기과학과'),
  ('화공생명공학과'),
  ('전기전자공학과'),
  ('건축공학과'),
  ('도시공학과'),
  ('건설환경공학과'),
  ('기계공학과'),
  ('신소재공학과'),
  ('산업공학과'),
  ('시스템반도체공학과'),
  ('디스플레이융합공학과'),
  ('디지털융합엔지니어링학과'),
  ('지능형데이터·최적화학과'),
  ('배터리공학과'),
  ('인공위성시스템학과'),
  ('시스템생물학과'),
  ('생화학과'),
  ('생명공학과'),
  ('첨단컴퓨팅학부'),
  ('컴퓨터과학과'),
  ('인공지능학과'),
  ('인공지능시스템학과'),
  ('첨단융합공학부'),
  ('신학과'),
  ('정치외교학과'),
  ('행정학과'),
  ('사회복지학과'),
  ('사회학과'),
  ('문화인류학과'),
  ('언론홍보영상학부'),
  ('교회음악과'),
  ('성악과'),
  ('피아노과'),
  ('관현악과'),
  ('작곡과'),
  ('의류환경학과'),
  ('식품영양학과'),
  ('실내건축학과'),
  ('아동·가족학과'),
  ('통합디자인학과'),
  ('교육학부'),
  ('체육교육학과'),
  ('스포츠응용산업학과'),
  ('진리자유학부'),
  ('의예과'),
  ('치의예과'),
  ('간호학과'),
  ('약학과')
on conflict (name) do nothing;
