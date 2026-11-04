-- Pagos con Culqi (tarjeta y Yape): las columnas de Webpay pasan a nombres genéricos.
ALTER TABLE orders RENAME COLUMN webpay_token TO payment_ref;
ALTER TABLE orders RENAME COLUMN webpay_auth_code TO payment_auth;
UPDATE orders SET payment = 'culqi' WHERE payment = 'webpay';
