-- Inicio de sesión solo con Google: se quita la contraseña y se agregan los datos del cliente.
-- La tabla users estaba vacía al aplicar esta migración.
DROP INDEX IF EXISTS users_google_sub_unique;
ALTER TABLE users DROP COLUMN password_hash;
ALTER TABLE users ADD COLUMN google_sub text;
ALTER TABLE users ADD COLUMN picture text;
ALTER TABLE users ADD COLUMN phone text;
ALTER TABLE users ADD COLUMN address_line text;
ALTER TABLE users ADD COLUMN district text;
ALTER TABLE users ADD COLUMN region text;
ALTER TABLE users ADD COLUMN profile_completed_at integer;
CREATE UNIQUE INDEX users_google_sub_unique ON users (google_sub);
