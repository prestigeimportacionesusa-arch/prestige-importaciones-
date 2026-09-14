-- Migración 012: datos de la persona titular del cupo de Addi (puede ser
-- distinta a quien hace el pedido), necesarios para generar el link de pago
-- manualmente desde el panel de Addi.
alter table orders add column if not exists addi_nombre text;
alter table orders add column if not exists addi_cedula text;
alter table orders add column if not exists addi_celular text;
