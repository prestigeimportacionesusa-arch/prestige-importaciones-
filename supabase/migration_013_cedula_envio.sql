-- Migración 013: cédula del destinatario del pedido (dato de envío), para
-- que quede completo junto con nombre, celular, dirección, barrio y ciudad.
alter table orders add column if not exists cliente_cedula text;
