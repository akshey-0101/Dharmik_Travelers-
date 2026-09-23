create extension if not exists pgcrypto;
create table if not exists public.trips (
 id uuid primary key default gen_random_uuid(), slug text unique not null, title text not null,
 travel_date date, price integer not null default 0, capacity integer not null default 40,
 pickup_points jsonb default '[]', places jsonb default '[]', included jsonb default '[]',
 not_included jsonb default '[]', status text default 'draft', created_at timestamptz default now()
);
create table if not exists public.bookings (
 id uuid primary key default gen_random_uuid(), booking_code text unique not null,
 trip_id uuid references public.trips(id), customer_name text not null, phone text not null,
 passengers integer not null default 1 check(passengers between 1 and 20), pickup_point text,
 amount integer default 0, advance_paid integer default 0, payment_status text default 'pending',
 booking_status text default 'pending', notes text, created_at timestamptz default now()
);
create table if not exists public.reviews (
 id uuid primary key default gen_random_uuid(), customer_name text not null,
 rating integer check(rating between 1 and 5), review text not null, trip_id uuid references public.trips(id),
 published boolean default false, created_at timestamptz default now()
);
alter table public.trips enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "public can view active trips" on public.trips;
drop policy if exists "public can submit bookings" on public.bookings;
drop policy if exists "public can view published reviews" on public.reviews;
drop policy if exists "admin can manage trips" on public.trips;
drop policy if exists "admin can manage bookings" on public.bookings;
drop policy if exists "admin can manage reviews" on public.reviews;
create policy "public can view active trips" on public.trips for select to anon, authenticated using (status='published');
create policy "public can submit bookings" on public.bookings for insert to anon, authenticated with check (true);
create policy "public can view published reviews" on public.reviews for select to anon, authenticated using (published=true);
create policy "admin can manage trips" on public.trips for all to authenticated using ((auth.jwt()->'app_metadata'->>'role')='admin') with check ((auth.jwt()->'app_metadata'->>'role')='admin');
create policy "admin can manage bookings" on public.bookings for select, update, delete to authenticated using ((auth.jwt()->'app_metadata'->>'role')='admin') with check ((auth.jwt()->'app_metadata'->>'role')='admin');
create policy "admin can manage reviews" on public.reviews for all to authenticated using ((auth.jwt()->'app_metadata'->>'role')='admin') with check ((auth.jwt()->'app_metadata'->>'role')='admin');

-- Seed the first three demo trips. Replace prices/dates before launch.
insert into public.trips (slug,title,price,capacity,pickup_points,places,included,not_included,status)
values
('golu-kainchi-mukteshwar','Golu Devta • Kainchi Dham • Mukteshwar',1400,40,'["Shahdara, Delhi"]','["Golu Devta","Kainchi Dham","Mukteshwar"]','["Round-trip group transportation","Listed pickup point","Tea / breakfast as specified","Tour coordinator"]','["Personal expenses","Special darshan charges unless mentioned","Anything not explicitly listed"]','published'),
('khatu-shyam','Khatu Shyam Ji Darshan Yatra',1499,40,'["Delhi NCR"]','["Khatu Shyam Ji"]','["Round-trip transportation","Listed pickup points","Tour coordinator"]','["Personal expenses","Optional paid services"]','draft'),
('balaji-salasar','Mehandipur Balaji • Salasar Balaji',1499,40,'["Delhi NCR"]','["Mehandipur Balaji","Salasar Balaji"]','["Round-trip transportation","Listed pickup points","Tour coordinator"]','["Personal expenses","Optional paid services"]','draft')
on conflict (slug) do update set title=excluded.title, price=excluded.price;





ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS included jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS not_included jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS pickup_points jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS places jsonb DEFAULT '[]'::jsonb;

NOTIFY pgrst, 'reload schema';

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'trips'
ORDER BY ordinal_position;

SELECT
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'trips'
ORDER BY ordinal_position;
