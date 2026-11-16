-- Orden de Culqi asociada al pedido (para pagar con QR de billeteras móviles).
ALTER TABLE orders ADD COLUMN culqi_order text;
