-- Migración 007: sección de testimonios (capturas de conversaciones reales
-- con clientes), independiente del sistema de reseñas por producto.
create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  imagen text not null,
  orden integer not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table testimonials enable row level security;

create policy "public read testimonials" on testimonials
  for select using (activo = true);

create policy "admin manage testimonials" on testimonials
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
