/**
 * Divisor orgánico entre dos secciones: una curva suave que "derrama" el color de la siguiente sobre la anterior.
 * `bg` es el fondo de la sección de arriba y `fill` (una clase text-*) el color de la sección de abajo.
 */
export function Wave({ bg, fill, mirror }: { bg: string; fill: string; mirror?: boolean }) {
  return (
    <div aria-hidden="true" className={`${bg} -mb-px leading-[0]`}>
      <svg viewBox="0 0 1440 90" preserveAspectRatio="none" className={`block h-[34px] w-full sm:h-[60px] lg:h-[80px] ${fill} ${mirror ? "-scale-x-100" : ""}`}>
        <path fill="currentColor" d="M0 90V48C170 10 340 2 540 28s430 56 650 28c100-13 170-32 250-52V90Z" />
      </svg>
    </div>
  );
}
