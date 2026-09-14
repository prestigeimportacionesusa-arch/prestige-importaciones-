-- Migración 014: los pedidos ahora se numeran de forma secuencial (100,
-- 101, 102...) en vez de un número aleatorio de 4 dígitos. El número lo
-- asigna la base de datos automáticamente al crear cada pedido, así nunca
-- se repite aunque lleguen dos pedidos al mismo tiempo.
create sequence if not exists orders_numero_seq start 100;
alter table orders alter column numero set default nextval('orders_numero_seq');
