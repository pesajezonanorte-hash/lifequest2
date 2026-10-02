# Posada & Biblioteca — espaciado, estética y verificación de fallos (2026-10-02)

Pase solicitado por el usuario: "mejorar todos los fallos, mejorar la estética de la
posada y biblioteca (todo se siente muy pegado y encimado, sin respetar espacios)
y arreglar los otros fallos en la página".

## 1) Verificación de los fallos del reporte de producción (27-sep-2026)

Se re-verificó cada incidencia de `production-audit-report-2026-09-27.md` contra el
código actual. Las 8 ya están remediadas en el repositorio:

| Incidencia | Estado verificado en código |
|---|---|
| Crear ritual creaba un hábito normal | ✅ Rituales viven en tabla/rutas propias (`apps/api/src/services/rituals.service.ts`, página dedicada `/rituals`); web ya no envía `isRitual`; migración legacy rechaza conservar el flag con datos. |
| Doble recompensa al completar ritual | ✅ `completeRitual`: transacción + `@@unique(ritualId, date)` + fallback P2002 → `alreadyDone`. |
| Racha de hábito se reseteaba el mismo día | ✅ `reconcileHabitStreaks` protege el streak si existe log completado/skipped de hoy; `logHabit` es idempotente por `habitId+date`. |
| API finanzas aceptaba importes negativos | ✅ `finance.schemas.ts` (`positiveMoney`) aplicado con `validate()` en las rutas de transacciones/presupuestos/metas/deudas. |
| API de foco aceptaba duración negativa | ✅ `completeFocusSchema` exige entero 1–480 min; aplicado en `POST /focus/complete`. |
| Fecha de log de hábito ignorada | ✅ `logHabit` ahora acepta `requestedDate`, la valida (no futuras) con errores explícitos `INVALID_HABIT_LOG_DATE` / `HABIT_LOG_FUTURE_DATE`. |
| Overflow horizontal móvil en `/food` (registro IA) | ✅ Fila con `flex-col sm:flex-row`, `min-w-0` en input y `w-full sm:w-auto` en botón; cubierto por `tests/food-mobile.spec.ts`. |
| 401 ruidosos antes de autenticar | ✅ `session-hint.ts` + `shouldBootstrapSession` + `bypassRefresh` en el interceptor Axios; cubierto por spec de bootstrap público. |

Cobertura existente: `apps/api/tests/audit-fixes.test.ts` (6 pruebas),
`apps/web/tests/food-mobile.spec.ts`, `apps/web/tests/flip-cards.spec.ts`,
`apps/web/tests/rituals-routing.spec.ts`.

## 2) Fallos corregidos en este pase

1. **Posada — el modal de comida no enviaba `date`**: el servidor estampaba su
   propio día; cerca de medianoche la comida podía caer en otra fecha que la lista
   visible. Ahora `MealModal` recibe y envía `date: today` (`parseMealDate` del API
   lo respeta).
2. **Posada — modal sin Escape ni bloqueo de scroll**: `MealModal` migrado al
   `ModalFrame` compartido (Escape, scroll-lock, header fijo), igual que Sueño.
3. **Posada — quick-add de agua sin manejo de error**: envuelto con try/catch +
   toast; antes un fallo de red era un rechazo de promesa no manejado.
4. **Posada — comidas guardadas**: crear/eliminar/agregar ahora informan por
   toast en caso de error (antes silenciosos) y confirman al agregar al registro.
5. **Biblioteca — ítem seleccionado obsoleto**: el detalle guardaba una copia del
   objeto; tras actualizar progreso el encabezado mostraba datos viejos. Ahora se
   guarda `selectedId` y el detalle se deriva de la lista viva.
6. **Biblioteca — estadísticas desactualizadas**: agregar o actualizar un ítem no
   refrescaba las tarjetas de stats. Se agrega `refreshStats()` silencioso tras
   cada mutación.
7. **Biblioteca — eliminar nota sin rollback**: borrado optimista con
   restauración + toast si la API falla (antes quedaba borrada aunque fallara).
8. **Iconos de Posada/Biblioteca caían al fallback** (⭐ 🌅 🍅 🃏 💻 no mapeaban a
   lucide): se agregaron al mapa de `glyphs.tsx`.

## 3) Rediseño de espaciado y estética (La Posada / La Biblioteca)

Problema reportado: secciones "pegadas y encimadas", filas apretadas, tableros de
botones de 12px sin aire.

- **Ritmo vertical consistente**: raíz `space-y-6` (antes `space-y-4`), tarjetas
  `p-4 sm:p-5` (antes `p-3`), secciones internas separadas por `space-y-4/5/6`.
- **`SegmentedTabs`** (nuevo `components/ui/SegmentedTabs.tsx`): chips de 44px,
  `gap-2`, aro de foco visible y wrap amable en 390px. Usado en tabs principales,
  filtros y sub-tabs de detalle (variante `pill`). Reemplaza las rejillas
  `gap-1` con botones pixel de 12px.
- **Posada / Registro**: hidratación y calorías en rejilla `md:grid-cols-2`
  (antes paneles sueltos apilados); registro IA con descripción y vista previa en
  contenedor con padding propio y rejilla de macros `2→4` columnas; grupos de
  comidas solo se muestran cuando tienen ítems (fuera el "— sin registros —"
  repetido) con encabezado + filas `divide-y` de 14px de respiro, hora del
  registro, chip de kcal y botón de borrado con área táctil de 36px.
- **Posada / modal**: campos etiquetados con el estilo moderno de Sueño (focus
  con anillo dorado), macros colapsables dentro de contenedor bordeado y presets
  de agua en rejilla 3×44px.
- **Biblioteca**: tarjetas de stats con icono en tesela y valor/etiqueta con aire;
  tarjetas de materiales reestructuradas (tesela de icono 48px, título con
  `break-words`, chip de estado con punto de color, barra de progreso con
  encabezado "Progreso x/y · %", acción "Notas y vocabulario" en pie separado por
  borde superior); tarjeta destacada flip sin cambios de API (los E2E de
  `flip-cards.spec.ts` siguen aplicando). Título renombrado a "La Biblioteca"
  (consistente con "La Posada" y con la expectativa del E2E).
- **Pomodoro / Notas / Vocabulario**: anillo más grande con tiempos legibles,
  chips de contador, formularios con inputs modernos, listas con filas
  `divide-y`/tarjetas redondeadas y estados vacíos con contorno punteado en vez
  de texto plano pegado al borde.

## 4) Validación

- `npx tsc --noEmit` (apps/web): **0 errores**.
- `npm run build` (apps/web): **compila** (vite 10.4 s).
- Limitación del sandbox: el build/tests del API no corren localmente porque la
  descarga de binarios de Prisma/bcrypt está bloqueada por red; en CI/producción se
  instalan normalmente (no se tocó código del API en este pase; los fixes de API
  verificados arriba ya venían con su suite `audit-fixes`).
