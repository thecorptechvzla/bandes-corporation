# Flujo del Frontend — Bandes

## Arquitectura General

- **Framework:** Next.js 16 con App Router
- **Estado servidor:** TanStack React Query v5 + Axios → `localhost:3001` (NestJS backend)
- **Estado local:** React Context (`GoldTraceabilityContext`) + `localStorage`
- **Estilos:** Tailwind CSS v4
- **Animaciones:** `motion` (framer-motion v12)
- **Autenticación:** No implementada — acceso libre, sin login ni protección de rutas

## Árbol de Componentes

```
RootLayout (app/layout.tsx)
  QueryClientProvider
    GoldTraceabilityProvider
      Sidebar (src/components/Sidebar.tsx)
      Header (solo en dashboard)
      Main Content ({children})
        Dashboard (/dashboard)
        Clientes (/clientes)
        Ingresos (/ingresos)
        Procesos (/procesos)
        Egresos (/egresos)
        Packing (/packing)
        Reportes (/reportes)
```

## Rutas

| Ruta | Vista | Descripción |
|---|---|---|
| `/` | Redirect | Redirige a `/dashboard` |
| `/dashboard` | Dashboard | Métricas, treemaps, chart de flujo |
| `/clientes` | Clientes | CRUD de clientes y proveedores |
| `/ingresos` | Ingreso de Material | Registro de barras (individual + Excel masivo) |
| `/procesos` | Procesos de Fundición | Gestión de fundición y recuperación |
| `/egresos` | Egreso de Material | Despacho multi-cliente con asignación de lotes |
| `/packing` | Packing — Carga Masiva | Historial de cargas por Excel |
| `/reportes` | Reportes | Reportes con exportación PDF |

---

## Dashboard (`/dashboard`)

### Hooks que consume

| Hook | Endpoint | Query Key | Refetch | Propósito |
|---|---|---|---|---|
| `useBars()` | `GET /bars` | `['bars']` | — | Treemap de proveedores + chart flujo 7 días (ingresos) |
| `useMaterialExits()` | `GET /material-exits` | `['material-exits']` | — | Treemap de clientes + chart flujo 7 días (egresos) |
| `useClients()` | `GET /clients` | `['clients']` | — | Datos para treemaps de proveedores y clientes |
| `useDashboardMetrics()` | `GET /dashboard/metrics` | `['dashboard', 'metrics']` | Cada 30s | 4 tarjetas: Oro Recibido, Oro en Proceso, Oro en Bóveda, Merma |
| `useGoldTraceability()` | Context / localStorage | — | — | `weightUnit` para unidades de peso |

### Datos que muestra

- **4 tarjetas de métricas:** oro recibido, oro en proceso, oro en bóveda, merma
- **Treemap de proveedores:** distribución visual del oro recibido por proveedor
- **Treemap de clientes:** distribución del oro despachado por cliente
- **Chart de flujo:** barras comparativas de últimos 7 días (ingresos vs egresos)
- **Tablas expandibles** con detalle de barras por cliente

---

## Clientes (`/clientes`)

### Hooks que consume

| Hook | Endpoint | Query Key | Propósito |
|---|---|---|---|
| `useClients()` | `GET /clients` | `['clients']` | Lista completa de clientes con filtro y búsqueda |
| `useCreateClient()` | `POST /clients` | mutación → invalida `['clients']` | Crear nuevo cliente |
| `useUpdateClient()` | `PATCH /clients/:id` | mutación → invalida `['clients']` | Editar cliente existente |
| `useDeleteClient()` | `DELETE /clients/:id` | mutación → invalida `['clients']` | Eliminar cliente |

### Funcionalidad

- Listado de clientes con roles: `PROVEEDOR`, `CLIENTE`, `AMBOS`
- Filtro por rol y búsqueda por texto
- Modal de creación/edición (RIF, nombre, contacto, rol)
- Confirmación para eliminar

---

## Ingreso de Material (`/ingresos`)

### Hooks que consume

| Hook | Endpoint | Query Key | Propósito |
|---|---|---|---|
| `useClients({ role: 'PROVEEDOR' })` | `GET /clients` | `['clients', 'PROVEEDOR']` | Dropdown de proveedores + agrupación accordion |
| `useBars()` | `GET /bars` | `['bars']` | Inventario de barras agrupadas por cliente |
| `useCreateBar()` | `POST /bars` | mutación → invalida `['bars']`, `['clients']` | Registrar barra individual |
| `useBulkUploadBars()` | `POST /bars/bulk-upload` | mutación → invalida `['bars']` | Carga masiva por Excel/CSV |
| `useUpdateBar()` | `PATCH /bars/:id` | mutación → invalida `['bars']` | Editar peso/pureza/leyAg de barra |
| `useGoldTraceability()` | Context / localStorage | — | `weightUnit` |

### Funcionalidad

- **Registro individual:** formulario con proveedor, código de barra, peso bruto, pureza Au‰, pureza Ag‰, cálculo automático de Fino Analítico (FA)
- **Carga masiva:** subir archivo .xlsx/.xls/.csv con plantilla descargable
- **Vista de inventario:** barras agrupadas por proveedor en tablas tipo acordeón con editar/eliminar

---

## Proceso de Fundición (`/procesos`)

### Hooks que consume

| Hook | Endpoint / Context | Query Key | Propósito |
|---|---|---|---|
| `useBars()` | `GET /bars` | `['bars']` | Seleccionar barras disponibles + contenido de lotes |
| `useClients()` | `GET /clients` | `['clients']` | Filtro por cliente + labels de agrupación |
| `useProcesses()` | `GET /processes` | `['processes']` | Vista de procesos activos (reactor) |
| `useLots()` | `GET /lots` | `['lots']` | Mapeo lotes → procesos |
| `useCreateProcess()` | `POST /processes` | mutación → invalida `['processes']` | Iniciar proceso de fundición |
| `useCreateLot()` | `POST /lots` | mutación → invalida `['lots']`, `['processes']` | Crear lote en el proceso |
| `useUpdateBar()` | `PATCH /bars/:id` | mutación → invalida `['bars']` | Cambiar status/lotId de barras |
| `useUpdateLot()` | `PATCH /lots/:id` | mutación → invalida `['lots']`, `['processes']`, `['available-lots']` | Registrar peso recuperado y purezas |
| `useUpdateProcess()` | `PATCH /processes/:id` | mutación → invalida `['processes']`, `['available-lots']` | Cerrar proceso |
| `useGoldTraceability()` | Context / localStorage | — | `weightUnit` |

### Flujo del proceso

1. Seleccionar operador, molde/crisol, temperatura
2. Filtrar barras por cliente, seleccionar barras `IN_STOCK`
3. Iniciar fundición → crea Process + Lot, barras pasan a `PROCESANDO`
4. Vista de reactor con lotes activos agrupados por cliente
5. Al hacer clic en un lote → modal de recuperación: ingresar peso recuperado, pureza Au/Ag
6. Confirmar → lote se cierra, proceso pasa a `CLOSED`, barras vuelven a `IN_STOCK`

---

## Egreso de Material (`/egresos`)

### Hooks que consume

| Hook | Endpoint | Query Key | Propósito |
|---|---|---|---|
| `useClients({ role: 'CLIENTE' })` | `GET /clients` | `['clients', 'CLIENTE']` | Selector de clientes + terminal de despacho |
| `useProcesses()` | `GET /processes` | `['processes']` | Procesos cerrados con lotes recuperados disponibles |
| `useBars()` | `GET /bars` | `['bars']` | Conteo de barras por lote y pesos disponibles |
| `useCreateMaterialExit()` | `POST /material-exits` | mutación → invalida `['material-exits']`, `['bars']`, `['clients']`, `['available-lots']` | Crear despacho |
| `useGoldTraceability()` | Context / localStorage | — | `weightUnit` |

### Flujo del despacho

1. Abrir selector de clientes → habilitar terminal(es)
2. Seleccionar cliente activo
3. Opcional: ingresar cantidad de oro requerida (gramos)
4. Desde "Bóveda de Lotes Disponibles", asignar lotes al cliente activo
5. Ingresar destino (requerido)
6. Despachar → crea `MaterialExit` con `ExitDetails` por lote
7. Modal de éxito con opción de descargar comprobante PDF

---

## Packing — Carga Masiva (`/packing`)

### Hooks que consume

| Hook | Endpoint | Query Key | Propósito |
|---|---|---|---|
| `useBulkUploads()` | `GET /bulk-uploads` | `['bulk-uploads']` | Historial de cargas (con fallback a mock data) |
| `useClients()` | `GET /clients` | `['clients']` | Nombre de cliente en cada registro |

### Funcionalidad

- Tarjetas resumen: total de cargas, registros creados, errores totales
- Tabla con búsqueda: nombre archivo, cliente, fecha, filas, creados, errores, estado
- Estados: `COMPLETED`, `PARTIAL`, `FAILED`
- Expandir errores por carga
- Descargar archivo original subido

---

## Reportes (`/reportes`)

### Hooks que consume

| Hook | Endpoint | Query Key | Propósito |
|---|---|---|---|
| `useBars()` | `GET /bars` | `['bars']` | Datos de oro recibido y en espera |
| `useClients()` | `GET /clients` | `['clients']` | Balance por cliente (recibido vs despachado) |
| `useProcesses()` | `GET /processes` | `['processes']` | Datos de fundiciones completadas |
| `useLots()` | `GET /lots` | `['lots']` | Detalle de lotes recuperados |
| `useMaterialExits()` | `GET /material-exits` | `['material-exits']` | Despachos por cliente |

### Funcionalidad

- **Oro Recibido:** ingreso histórico total — barras, clientes, peso bruto, FA
- **Oro Fundido:** datos de fundiciones completadas — lotes, barras, peso recuperado, eficiencia %
- **Oro en Espera:** oro pendiente de procesar — cantidad, peso, clientes, FA
- **Tabla de balance por cliente** con indicador de saldo
- Exportación PDF con filtros (fecha, cliente) usando `html-to-image` + `jsPDF`

---

## Flujo de Datos General

```
UI (Page Component)
  → Custom Hook (useBars, useClients, etc.)
    → TanStack Query
      → Axios (api.ts → localhost:3001)
        → NestJS Backend
          → Prisma ORM
            → PostgreSQL
      ← Respuesta cachead por TanStack Query
    ← Componente re-renderiza con datos frescos
  ← UI actualizada
```

### Mutaciones e Invalidación

Cada mutación invalida las queries relacionadas para mantener la UI sincronizada:

| Mutación | Invalida |
|---|---|
| `useCreateBar()` | `['bars']`, `['clients']` |
| `useUpdateBar()` | `['bars']` |
| `useBulkUploadBars()` | `['bars']` |
| `useCreateClient()` | `['clients']` |
| `useUpdateClient()` | `['clients']` |
| `useDeleteClient()` | `['clients']` |
| `useCreateProcess()` | `['processes']` |
| `useUpdateProcess()` | `['processes']`, `['available-lots']` |
| `useCreateLot()` | `['lots']`, `['processes']` |
| `useUpdateLot()` | `['lots']`, `['processes']`, `['available-lots']` |
| `useCreateMaterialExit()` | `['material-exits']`, `['bars']`, `['clients']`, `['available-lots']` |

### Estado Local (GoldTraceabilityContext)

- Persistido en `localStorage`
- Contiene: `suppliers`, `goldBars`, `castingLots`, `transactions`, `weightUnit`
- El `weightUnit` (kg/g) se consume en dashboard, ingresos, procesos y egresos
- `bandes-corp/` usa SOLO este contexto (sin backend)
