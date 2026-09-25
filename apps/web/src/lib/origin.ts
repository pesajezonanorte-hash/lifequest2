/**
 * Origen de apertura (último punto del puntero).
 *
 * Los overlays (modales, menús, dropdowns) usan esto como `transform-origin`
 * para desplegarse con un scale desde el lugar exacto donde se abrieron
 * (el botón/FAB que disparó la apertura). Si se abrió por teclado, se usa el
 * centro de la pantalla.
 */
let last = { x: -1, y: -1 };

if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointerdown',
    (e) => {
      last = { x: e.clientX, y: e.clientY };
    },
    { capture: true, passive: true },
  );
}

/** CSS transform-origin en coordenadas de viewport ('123px 456px' | 'center'). */
export function getOpenOrigin(): string {
  if (last.x < 0 || last.y < 0) return 'center';
  return `${Math.round(last.x)}px ${Math.round(last.y)}px`;
}
