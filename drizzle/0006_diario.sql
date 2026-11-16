-- Diario: los artículos pasan de estar en el código a la base de datos, con foto subida desde el panel (R2).
CREATE TABLE `posts` (
	`slug` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`topic` text NOT NULL,
	`excerpt` text NOT NULL,
	`body` text NOT NULL,
	`image` text,
	`art` text NOT NULL DEFAULT 'soap',
	`minutes` integer NOT NULL DEFAULT 4,
	`published_at` text NOT NULL,
	`active` integer NOT NULL DEFAULT 1,
	`sort_order` integer NOT NULL DEFAULT 0
);
INSERT INTO posts (slug, title, topic, excerpt, body, image, art, minutes, published_at, active, sort_order) VALUES
('como-leer-la-etiqueta-de-un-producto-para-la-piel', 'Cómo leer la etiqueta de un producto para la piel', 'Piel', 'Qué mirar en la lista de ingredientes antes de comprar.', 'La lista de ingredientes de un producto se ordena de mayor a menor cantidad. Los primeros son los que más pesan en la fórmula; los últimos suelen estar en cantidades muy pequeñas. Leer solo los primeros cuatro o cinco ya te da una idea clara de lo que estás comprando.

Desconfía de las listas larguísimas con nombres que no puedes identificar, sobre todo si el producto promete mucho. Fíjate también en las palabras fragancia o perfume: pueden esconder decenas de compuestos y son una causa frecuente de irritación en la piel sensible.

Ninguna etiqueta reemplaza la opinión de un profesional. Si tienes una condición en la piel o alergias conocidas, consulta con tu médico o dermatólogo antes de cambiar de productos, y prueba cualquier producto nuevo en una zona pequeña antes de usarlo en todo el cuerpo.', NULL, 'soap', 5, '2026-10-28', 1, 0),
('que-significa-que-un-producto-sea-organico', 'Qué significa realmente que un producto sea orgánico', 'Ciencia', 'Qué hay detrás de la palabra y por qué conviene pedir información.', 'En términos simples, un producto orgánico se produce sin pesticidas ni fertilizantes sintéticos y sin organismos modificados genéticamente. Es una forma de producir que busca cuidar el suelo, el agua y a las personas que trabajan la tierra.

Como la palabra se usa mucho en publicidad, conviene preguntar: ¿qué ingredientes son orgánicos?, ¿de dónde vienen?, ¿existe algún documento que lo respalde? Un producto serio debería poder responderte con claridad.

En Alba Pura queremos que cada producto indique qué lleva y cómo se hace. Estamos en fase de prueba, así que si tienes una duda sobre un ingrediente, escríbenos: preferimos explicarte antes de que compres.', NULL, 'oil', 5, '2026-10-21', 1, 1),
('lo-que-usamos-en-la-ducha-termina-en-el-medio-ambiente', 'Lo que usamos en la ducha termina en el medio ambiente', 'Medio ambiente', 'Del desagüe al río y al mar: por qué importa lo que contienen los productos de uso diario.', 'Todo lo que se va por el desagüe sigue su camino: pasa por las redes de agua y, en muchos casos, termina en ríos y en el mar. Jabones, champús y cremas contienen ingredientes que no siempre se descomponen con facilidad.

Una pregunta sencilla ayuda a decidir: ¿qué le pasa a este ingrediente después de que lo usamos? Los ingredientes de origen natural y las fórmulas simples suelen ser una mejor apuesta, aunque no todo lo natural es inocuo ni todo lo sintético es dañino. Por eso la información importa.

Un cambio pequeño suma: usar solo la cantidad necesaria, elegir envases que puedas reutilizar o reciclar y preferir productos que expliquen con claridad de qué están hechos.', NULL, 'honey', 4, '2026-10-14', 1, 2),
('como-empezar-a-cambiar-tus-productos-de-a-poco', 'Cómo empezar a cambiar tus productos de a poco', 'Piel', 'Una guía práctica para hacer la transición sin gastar de más ni abrumarte.', 'No hace falta cambiar todo de golpe. Empieza por el producto que más usas o el que pasa más tiempo en contacto con tu piel, como el jabón de ducha.

Cambia un producto a la vez. Así, si notas alguna reacción, sabrás cuál la causó. Prueba en una zona pequeña, espera unas horas y observa cómo responde tu piel.

Dale unas semanas para adaptarse y fíjate cómo te sientes. Y recuerda: si tienes una condición diagnosticada, tu médico es quien mejor puede orientarte.', NULL, 'tea', 4, '2026-10-07', 1, 3);
