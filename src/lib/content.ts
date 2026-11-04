import { STANDARD_SHIPPING } from "@/lib/checkout";
import type { Product } from "@/lib/products";

export type Post = {
  slug: string;
  title: string;
  topic: "Piel" | "Ciencia" | "Medio ambiente";
  excerpt: string;
  date: string;
  minutes: number;
  image?: string;
  /** Ilustración que se usa cuando el artículo no tiene foto. */
  art: Product["art"];
  body: string[];
};

export const posts: Post[] = [
  {
    slug: "como-leer-la-etiqueta-de-un-producto-para-la-piel",
    title: "Cómo leer la etiqueta de un producto para la piel",
    topic: "Piel",
    excerpt: "Qué mirar en la lista de ingredientes antes de comprar.",
    date: "2026-10-28",
    minutes: 5,
    art: "soap",
    body: [
      "La lista de ingredientes de un producto se ordena de mayor a menor cantidad. Los primeros son los que más pesan en la fórmula; los últimos suelen estar en cantidades muy pequeñas. Leer solo los primeros cuatro o cinco ya te da una idea clara de lo que estás comprando.",
      "Desconfía de las listas larguísimas con nombres que no puedes identificar, sobre todo si el producto promete mucho. Fíjate también en las palabras fragancia o perfume: pueden esconder decenas de compuestos y son una causa frecuente de irritación en la piel sensible.",
      "Ninguna etiqueta reemplaza la opinión de un profesional. Si tienes una condición en la piel o alergias conocidas, consulta con tu médico o dermatólogo antes de cambiar de productos, y prueba cualquier producto nuevo en una zona pequeña antes de usarlo en todo el cuerpo.",
    ],
  },
  {
    slug: "que-significa-que-un-producto-sea-organico",
    title: "Qué significa realmente que un producto sea orgánico",
    topic: "Ciencia",
    excerpt: "Qué hay detrás de la palabra y por qué conviene pedir información.",
    date: "2026-10-21",
    minutes: 5,
    art: "oil",
    body: [
      "En términos simples, un producto orgánico se produce sin pesticidas ni fertilizantes sintéticos y sin organismos modificados genéticamente. Es una forma de producir que busca cuidar el suelo, el agua y a las personas que trabajan la tierra.",
      "Como la palabra se usa mucho en publicidad, conviene preguntar: ¿qué ingredientes son orgánicos?, ¿de dónde vienen?, ¿existe algún documento que lo respalde? Un producto serio debería poder responderte con claridad.",
      "En Alba Pura queremos que cada producto indique qué lleva y cómo se hace. Estamos en fase de prueba, así que si tienes una duda sobre un ingrediente, escríbenos: preferimos explicarte antes de que compres.",
    ],
  },
  {
    slug: "lo-que-usamos-en-la-ducha-termina-en-el-medio-ambiente",
    title: "Lo que usamos en la ducha termina en el medio ambiente",
    topic: "Medio ambiente",
    excerpt: "Del desagüe al río y al mar: por qué importa lo que contienen los productos de uso diario.",
    date: "2026-10-14",
    minutes: 4,
    art: "honey",
    body: [
      "Todo lo que se va por el desagüe sigue su camino: pasa por las redes de agua y, en muchos casos, termina en ríos y en el mar. Jabones, champús y cremas contienen ingredientes que no siempre se descomponen con facilidad.",
      "Una pregunta sencilla ayuda a decidir: ¿qué le pasa a este ingrediente después de que lo usamos? Los ingredientes de origen natural y las fórmulas simples suelen ser una mejor apuesta, aunque no todo lo natural es inocuo ni todo lo sintético es dañino. Por eso la información importa.",
      "Un cambio pequeño suma: usar solo la cantidad necesaria, elegir envases que puedas reutilizar o reciclar y preferir productos que expliquen con claridad de qué están hechos.",
    ],
  },
  {
    slug: "como-empezar-a-cambiar-tus-productos-de-a-poco",
    title: "Cómo empezar a cambiar tus productos de a poco",
    topic: "Piel",
    excerpt: "Una guía práctica para hacer la transición sin gastar de más ni abrumarte.",
    date: "2026-10-07",
    minutes: 4,
    art: "tea",
    body: [
      "No hace falta cambiar todo de golpe. Empieza por el producto que más usas o el que pasa más tiempo en contacto con tu piel, como el jabón de ducha.",
      "Cambia un producto a la vez. Así, si notas alguna reacción, sabrás cuál la causó. Prueba en una zona pequeña, espera unas horas y observa cómo responde tu piel.",
      "Dale unas semanas para adaptarse y fíjate cómo te sientes. Y recuerda: si tienes una condición diagnosticada, tu médico es quien mejor puede orientarte.",
    ],
  },
];

export const faqs: { group: string; items: { q: string; a: string }[] }[] = [
  {
    group: "Envíos",
    items: [
      { q: "¿Dónde entregan?", a: "Por ahora, en Lima Metropolitana y Callao. Estamos en fase de prueba y queremos cuidar cada entrega. Si estás en otra ciudad, escríbenos y vemos si es posible." },
      { q: "¿Cuánto cuesta el delivery?", a: `El delivery en Lima Metropolitana y Callao cuesta S/ ${STANDARD_SHIPPING}. Al finalizar tu pedido ves el total exacto antes de pagar. Te confirmamos el día de entrega por correo.` },
      { q: "¿Puedo recoger mi pedido?", a: "Sí. Elige Retiro coordinado al pagar y te escribimos para acordar un punto en Lima, el día y la hora." },
    ],
  },
  {
    group: "Pagos",
    items: [
      { q: "¿Qué medios de pago aceptan?", a: "Tarjetas Visa, Mastercard, American Express y Diners, Yape, o el QR de tu billetera móvil (Yape, Plin y otras). Pagas de forma segura con Culqi y los datos de tu tarjeta no pasan por nuestro sitio. Preparamos tu pedido cuando se confirma el pago." },
      { q: "¿Puedo pagar por transferencia o por WhatsApp?", a: "Por ahora el pago se hace con tarjeta o Yape en la tienda. Si tienes dudas o prefieres que te ayudemos con tu pedido, escríbenos por WhatsApp." },
    ],
  },
  {
    group: "Devoluciones",
    items: [
      { q: "Mi pedido llegó dañado, ¿qué hago?", a: "Escríbenos dentro de las 48 horas siguientes a la entrega con una foto del producto y del empaque. Lo reponemos sin costo." },
      { q: "¿Puedo devolver un producto?", a: "Por tratarse de productos de cuidado personal y de consumo, no aceptamos devoluciones de productos abiertos. Si algo no es lo que esperabas, escríbenos y revisamos tu caso." },
    ],
  },
  {
    group: "Productos",
    items: [
      { q: "¿Los productos son orgánicos?", a: "Esa es la base de la línea: ingredientes de origen natural y procesos pensados para no dañar a las personas ni al medio ambiente. Detallamos lo que lleva cada producto en su ficha. Si tienes dudas sobre un ingrediente, escríbenos." },
      { q: "Tengo piel sensible o alergias, ¿puedo usarlos?", a: "Revisa la lista de ingredientes y prueba el producto en una zona pequeña antes de usarlo. Si tienes una condición diagnosticada o alergias conocidas, consulta antes con tu médico." },
      { q: "¿Por qué dicen que están en fase de prueba?", a: "Estamos lanzando una primera tanda pequeña para escuchar a quienes los prueben y mejorar antes de ampliar la línea. Tu opinión nos ayuda mucho." },
    ],
  },
];

export function getPost(slug: string) {
  return posts.find((p) => p.slug === slug);
}

export function formatDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" });
}
