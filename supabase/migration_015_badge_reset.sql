-- Migración 015: guarda la última vez que el admin entró a ver los pedidos,
-- para que el número de notificación se reinicie al abrir esa sección (en
-- vez de seguir contando los mismos pedidos "Nuevo" para siempre).
alter table store_config add column if not exists pedidos_ultima_revision timestamptz;
