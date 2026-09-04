# Cabal Asesores — Diseño de Base de Datos

PostgreSQL gestionado en DigitalOcean ($15/mes). Todas las tablas usan `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` y timestamps `created_at / updated_at`.

---

## Tablas

### `agentes`
Corredores y agentes de Cabal.

| Columna | Tipo | Descripción |
|---|---|---|
| id | UUID PK | |
| nombres | TEXT | |
| apellidos | TEXT | |
| cedula | TEXT UNIQUE | |
| email | TEXT UNIQUE | |
| telefono | TEXT | |
| cd_productor | TEXT | Código asignado por Seguros Caracas |
| porcentaje_comision | NUMERIC(5,2) | % default de comisión |
| estado | TEXT | `activo` / `inactivo` |

---

### `clientes`
Tomadores y asegurados registrados en Cabal.

| Columna | Tipo | Descripción |
|---|---|---|
| id | UUID PK | |
| nacionalidad | TEXT | V / E / J / G |
| cedula_rif | TEXT UNIQUE | Sin puntos ni guiones |
| nombres | TEXT | |
| apellidos | TEXT | |
| email | TEXT | |
| telefono | TEXT | |
| area_tlf | TEXT | Código de área |
| sexo | TEXT | M / F / X |
| fecha_nacimiento | DATE | |
| estado_civil | TEXT | |
| profesion | TEXT | |
| pais | TEXT | Default: VENEZUELA |
| estado_residencia | TEXT | |
| ciudad_residencia | TEXT | |
| direccion | TEXT | |

---

### `polizas`
Pólizas emitidas (de cualquier ramo). Las HOGAR tienen referencia directa a Seguros Caracas.

| Columna | Tipo | Descripción |
|---|---|---|
| id | UUID PK | |
| numero_poliza | TEXT UNIQUE | Generado por la aseguradora |
| cd_ramo | INTEGER | Código ramo SC |
| cd_sucursal | INTEGER | Sucursal SC |
| nu_poliza | INTEGER | Número SC |
| nu_recibo | INTEGER | Recibo SC |
| asegurado_id | UUID FK → clientes | |
| tomador_id | UUID FK → clientes | Puede ser igual al asegurado |
| agente_id | UUID FK → agentes | Quien gestionó la póliza |
| ramo | TEXT | `HOGAR` / `AUTO` / `SALUD` / `VIDA` / `RESPONSABILIDAD` |
| aseguradora | TEXT | `SEGUROS_CARACAS` / otros |
| cd_opcion | INTEGER | Plan elegido |
| cd_moneda | TEXT | USD / VES |
| fr_pago | TEXT | AN / SM / TR / MN |
| prima_total | NUMERIC(14,2) | Prima total anual |
| moneda | TEXT | |
| fecha_inicio | DATE | Inicio de vigencia |
| fecha_vencimiento | DATE | Fin de vigencia |
| estado | TEXT | `activa` / `vencida` / `cancelada` / `siniestrada` / `renovada` |
| datos_inmueble | JSONB | Hogar: estado, ciudad, sector, dirección, coordenadas |
| notas | TEXT | |

**Índices:** `asegurado_id`, `agente_id`, `fecha_vencimiento`, `estado`

---

### `siniestros`
Reclamaciones reportadas sobre una póliza.

| Columna | Tipo | Descripción |
|---|---|---|
| id | UUID PK | |
| numero_siniestro | TEXT UNIQUE | Número interno de Cabal |
| poliza_id | UUID FK → polizas | |
| agente_id | UUID FK → agentes | Agente que reporta |
| fecha_ocurrencia | DATE | Cuándo ocurrió el evento |
| fecha_reporte | DATE | Cuándo lo reportó el cliente |
| tipo | TEXT | `robo` / `incendio` / `inundacion` / `daño_electrico` / `daño_estructura` / `otro` |
| descripcion | TEXT | Descripción del evento |
| monto_reclamado | NUMERIC(14,2) | |
| monto_aprobado | NUMERIC(14,2) | Aprobado por la aseguradora |
| monto_pagado | NUMERIC(14,2) | Efectivamente pagado |
| moneda | TEXT | |
| estado | TEXT | `reportado` / `en_investigacion` / `aprobado` / `pagado` / `rechazado` / `cerrado` |
| notas | TEXT | Seguimiento del caso |
| numero_siniestro_aseguradora | TEXT | Número asignado por SC |

---

### `renovaciones`
Historial de renovaciones de cada póliza.

| Columna | Tipo | Descripción |
|---|---|---|
| id | UUID PK | |
| poliza_id | UUID FK → polizas | |
| agente_id | UUID FK → agentes | |
| fecha_vencimiento_anterior | DATE | |
| fecha_nueva_vigencia | DATE | Nueva fecha de inicio |
| fecha_nuevo_vencimiento | DATE | Nuevo vencimiento |
| prima_anterior | NUMERIC(14,2) | |
| prima_nueva | NUMERIC(14,2) | |
| moneda | TEXT | |
| estado | TEXT | `pendiente` / `completada` / `rechazada` / `vencida_sin_renovar` |
| notas | TEXT | |
| nuevo_numero_poliza | TEXT | Si se emitió póliza nueva |

---

### `comisiones`
Comisiones devengadas y pagos a agentes.

| Columna | Tipo | Descripción |
|---|---|---|
| id | UUID PK | |
| poliza_id | UUID FK → polizas | |
| agente_id | UUID FK → agentes | |
| tipo | TEXT | `emision` / `renovacion` / `endoso` |
| base_calculo | NUMERIC(14,2) | Prima sobre la que se calcula |
| porcentaje | NUMERIC(5,2) | % aplicado |
| monto_bruto | NUMERIC(14,2) | base × porcentaje |
| descuentos | NUMERIC(14,2) | Retenciones / ajustes |
| monto_neto | NUMERIC(14,2) | Lo que recibe el agente |
| moneda | TEXT | |
| fecha_calculo | DATE | |
| fecha_pago | DATE | NULL si pendiente |
| estado | TEXT | `pendiente` / `pagada` / `ajustada` |
| referencia_pago | TEXT | Número de transferencia |
| notas | TEXT | |

---

### `pagos_clientes`
Pagos de prima recibidos de los clientes.

| Columna | Tipo | Descripción |
|---|---|---|
| id | UUID PK | |
| poliza_id | UUID FK → polizas | |
| cliente_id | UUID FK → clientes | |
| monto | NUMERIC(14,2) | |
| moneda | TEXT | |
| fecha_pago | DATE | |
| metodo | TEXT | `transferencia` / `zelle` / `efectivo_usd` / `efectivo_bs` / `tarjeta` |
| banco | TEXT | Banco origen |
| referencia | TEXT | Número de referencia |
| estado | TEXT | `confirmado` / `pendiente` / `rechazado` |
| notas | TEXT | |

---

## Herramientas MCP por categoría

### 🔵 API Seguros Caracas (en vivo)
| Herramienta | Acción |
|---|---|
| `cabal_get_planes` | Planes HOGAR disponibles |
| `cabal_get_listas_iniciales` | Catálogos: estados, indoles, países |
| `cabal_get_ciudades` | Ciudades de un estado |
| `cabal_get_sectores` | Sectores de una ciudad |
| `cabal_consultar_cliente` | Busca asegurado en SC por cédula |
| `cabal_emitir_poliza_hogar` | Emite póliza HOGAR |

### 🟢 Pólizas (requiere BD)
| Herramienta | Pregunta tipo |
|---|---|
| `cabal_buscar_polizas` | "¿Qué pólizas tiene Juan Pérez?" |
| `cabal_get_poliza` | "Dame el detalle de la póliza #0012345" |
| `cabal_polizas_por_vencer` | "¿Qué vence en los próximos 30 días?" |
| `cabal_estadisticas_cartera` | "¿Cuántas pólizas activas tenemos?" |

### 🟡 Siniestros (requiere BD)
| Herramienta | Pregunta tipo |
|---|---|
| `cabal_registrar_siniestro` | "Registra un siniestro de incendio para la póliza X" |
| `cabal_buscar_siniestros` | "¿Qué siniestros hay abiertos?" |
| `cabal_get_siniestro` | "¿Cuál es el estado del siniestro #S-004?" |
| `cabal_actualizar_siniestro` | "El siniestro #S-004 fue aprobado por $1.200" |

### 🟠 Renovaciones (requiere BD)
| Herramienta | Pregunta tipo |
|---|---|
| `cabal_renovaciones_pendientes` | "¿Qué clientes hay que llamar esta semana para renovar?" |
| `cabal_registrar_renovacion` | "Registra la renovación de la póliza de Ana García" |
| `cabal_historial_renovaciones` | "¿Cuántas veces ha renovado el cliente V-12345678?" |

### 🔴 Comisiones (requiere BD)
| Herramienta | Pregunta tipo |
|---|---|
| `cabal_comisiones_pendientes` | "¿Cuánto le debo a cada agente?" |
| `cabal_resumen_comisiones_agente` | "¿Cuánto ganó Carlos López este mes?" |
| `cabal_resumen_comisiones_periodo` | "¿Cuánto pagamos en comisiones en Q3?" |
| `cabal_registrar_pago_comision` | "Marca como pagada la comisión #abc-123" |

### ⚪ Clientes internos (requiere BD)
| Herramienta | Pregunta tipo |
|---|---|
| `cabal_buscar_cliente_interno` | "¿Tenemos registrada a Ana García?" |
| `cabal_historial_cliente` | "Muéstrame todo de V-12345678: pólizas, siniestros, pagos" |

### 📊 Reportes (requiere BD)
| Herramienta | Pregunta tipo |
|---|---|
| `cabal_reporte_produccion` | "¿Cuánto produjimos este mes vs el anterior?" |
| `cabal_ranking_agentes` | "¿Cuál es el agente con más cartera activa?" |

---

## Notas de implementación

- Las herramientas **🔵 (SC)** ya están activas.
- Las demás necesitan provisionar PostgreSQL en DigitalOcean ($15/mes) y correr las migraciones.
- Usar Prisma ORM + `@prisma/client` para las rutas Next.js.
- Ver `DEPLOYMENT.md` para agregar `DATABASE_URL` al entorno.
