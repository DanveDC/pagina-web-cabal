#!/usr/bin/env node
// ─── Cabal MCP Server ────────────────────────────────────────────────────────
// Asistente IA para agentes de Cabal Asesores de Seguros.
// Expone herramientas para consultar pólizas, siniestros, renovaciones,
// comisiones, clientes y la API de Seguros Caracas.
//
// Configuración en claude_desktop_config.json:
// {
//   "mcpServers": {
//     "cabal": {
//       "command": "node",
//       "args": ["/ruta/a/cabal-mcp/dist/index.js"],
//       "env": {
//         "CABAL_BASE_URL": "https://monkfish-app-nf3lg.ondigitalocean.app",
//         "MCP_TOKEN": "tu_token_secreto"
//       }
//     }
//   }
// }

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";

// ─── config ──────────────────────────────────────────────────────────────────

const BASE_URL = (process.env.CABAL_BASE_URL ?? "").replace(/\/+$/, "");
const MCP_TOKEN = process.env.MCP_TOKEN ?? "";

if (!BASE_URL) {
  process.stderr.write("[cabal-mcp] ERROR: CABAL_BASE_URL no está configurado.\n");
  process.exit(1);
}
if (!MCP_TOKEN) {
  process.stderr.write("[cabal-mcp] ERROR: MCP_TOKEN no está configurado.\n");
  process.exit(1);
}

// ─── gateway call ─────────────────────────────────────────────────────────────

async function callCabal(action: string, params: Record<string, unknown> = {}): Promise<unknown> {
  const res = await fetch(`${BASE_URL}/api/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MCP_TOKEN}`,
    },
    body: JSON.stringify({ action, params }),
    signal: AbortSignal.timeout(20_000),
  });

  const data = await res.json();

  if (!res.ok) {
    const err = (data as { error?: string }).error ?? `http_${res.status}`;
    // 501 = herramienta correcta pero BD no disponible aún — mensaje amigable
    if (res.status === 501) {
      throw new Error(`Esta función requiere la base de datos configurada. ${(data as { detail?: string }).detail ?? ""}`);
    }
    throw new Error(`Cabal API error: ${err} (${res.status})`);
  }

  return data;
}

// ─── herramientas: definiciones ───────────────────────────────────────────────

const TOOLS: Tool[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // BLOQUE 1: API Seguros Caracas (en vivo)
  // ══════════════════════════════════════════════════════════════════════════

  {
    name: "cabal_get_planes",
    description:
      "Obtiene los planes HOGAR disponibles de Seguros Caracas con sus precios y frecuencias de pago. " +
      "Úsalo para responder preguntas sobre coberturas o para iniciar una cotización.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "cabal_get_listas_iniciales",
    description:
      "Obtiene los catálogos base: estados venezolanos, indoles de inmueble y países. " +
      "Úsalo para conocer los códigos válidos de estado o tipo de inmueble.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "cabal_get_ciudades",
    description: "Obtiene las ciudades de un estado venezolano dado su código.",
    inputSchema: {
      type: "object",
      properties: {
        cdEstado: { type: "string", description: "Código del estado (ej: '08' Carabobo, '01' Distrito Capital)." },
      },
      required: ["cdEstado"],
    },
  },
  {
    name: "cabal_get_sectores",
    description: "Obtiene los sectores/urbanizaciones de una ciudad. Necesario para emitir una póliza HOGAR.",
    inputSchema: {
      type: "object",
      properties: {
        cdEstado: { type: "string", description: "Código del estado." },
        cdCiudad: { type: "string", description: "Código de la ciudad." },
      },
      required: ["cdEstado", "cdCiudad"],
    },
  },
  {
    name: "cabal_consultar_cliente",
    description:
      "Busca un cliente en la base de datos de Seguros Caracas por cédula o RIF. " +
      "Devuelve nombres, apellidos, fecha de nacimiento, sexo y estado civil. " +
      "Útil para pre-llenar datos del asegurado o tomador.",
    inputSchema: {
      type: "object",
      properties: {
        nacionalidad: { type: "string", enum: ["V", "E", "J", "G"], description: "V=venezolano, E=extranjero, J=jurídico, G=gubernamental." },
        cedulaRif: { type: "string", description: "Cédula o RIF sin puntos ni guiones." },
      },
      required: ["nacionalidad", "cedulaRif"],
    },
  },
  {
    name: "cabal_emitir_poliza_hogar",
    description:
      "Emite una póliza HOGAR en Seguros Caracas. Devuelve el número de póliza si la emisión es exitosa. " +
      "IMPORTANTE: solicita confirmación explícita del agente antes de llamar esta herramienta.",
    inputSchema: {
      type: "object",
      properties: {
        pedido: {
          type: "object",
          description: "Objeto pedido completo para la suscripción.",
          properties: {
            cdOpcion:   { type: "number", description: "Código del plan (de cabal_get_planes)." },
            cdMoneda:   { type: "string", description: "Moneda: USD, VES." },
            frPago:     { type: "string", description: "Frecuencia: AN=anual, SM=semestral, TR=trimestral, MN=mensual." },
            hogar: {
              type: "object",
              properties: {
                cdEstado: { type: "string" }, deEstado: { type: "string" },
                cdCiudad: { type: "string" }, deCiudad: { type: "string" },
                cdSector: { type: "string" }, deSector: { type: "string" },
                cdPostal: { type: "string" }, deInmueble: { type: "string" },
                deCalle:  { type: "string" }, x: { type: "string" }, y: { type: "string" },
                deDireccion1: { type: "string" }, deDireccion2: { type: "string" },
                cdIndole: { type: "string" },
              },
              required: ["cdEstado","deEstado","cdCiudad","deCiudad","cdSector","deSector","cdPostal","deInmueble","deCalle","x","y","deDireccion1","deDireccion2","cdIndole"],
            },
            asegurado: {
              type: "object",
              properties: {
                nacionalidad: { type: "string" }, cedulaRif: { type: "number" },
                nombres: { type: "string" }, apellidosRazonSocial: { type: "string" },
                edoCivil: { type: "string" }, sexo: { type: "string" },
                feNacimiento: { type: "string", description: "DD/MM/YYYY" },
                pais: { type: "string" }, estado: { type: "string" }, ciudad: { type: "string" },
                email: { type: "string" }, direccion: { type: "string" },
                cdAreaTlf: { type: "string" }, nuTlf: { type: "string" }, profesion: { type: "string" },
              },
              required: ["nacionalidad","cedulaRif","nombres","apellidosRazonSocial","edoCivil","sexo","feNacimiento","pais","estado","ciudad","email","direccion","cdAreaTlf","nuTlf","profesion"],
            },
            tomador: {
              type: "object",
              description: "Igual al asegurado o diferente.",
              properties: {
                nacionalidad: { type: "string" }, cedulaRif: { type: "number" },
                nombres: { type: "string" }, apellidosRazonSocial: { type: "string" },
                edoCivil: { type: "string" }, sexo: { type: "string" },
                feNacimiento: { type: "string" }, pais: { type: "string" },
                estado: { type: "string" }, ciudad: { type: "string" },
                email: { type: "string" }, direccion: { type: "string" },
                cdAreaTlf: { type: "string" }, nuTlf: { type: "string" }, profesion: { type: "string" },
              },
              required: ["nacionalidad","cedulaRif","nombres","apellidosRazonSocial","edoCivil","sexo","feNacimiento","pais","estado","ciudad","email","direccion","cdAreaTlf","nuTlf","profesion"],
            },
            documentos: { type: "array", items: { type: "object" } },
            domicilio: {
              type: "object",
              properties: {
                tpCuenta: { type: "string" }, nuCuenta: { type: "string" },
                feVencimiento: { type: "string" }, cdBanco: { type: "number" },
              },
              required: ["tpCuenta","nuCuenta","feVencimiento","cdBanco"],
            },
          },
          required: ["cdOpcion","cdMoneda","frPago","hogar","asegurado","tomador","documentos","domicilio"],
        },
      },
      required: ["pedido"],
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BLOQUE 2: Pólizas internas (cartera Cabal — requiere BD)
  // ══════════════════════════════════════════════════════════════════════════

  {
    name: "cabal_buscar_polizas",
    description:
      "Busca pólizas en la cartera interna de Cabal. Filtra por cédula del asegurado, " +
      "nombre, número de póliza, agente, estado (activa/vencida/cancelada) o ramo. " +
      "Ejemplos: '¿Qué pólizas tiene Juan Pérez?', '¿Cuántas pólizas activas tiene el agente López?'",
    inputSchema: {
      type: "object",
      properties: {
        cedula: { type: "string", description: "Cédula del asegurado o tomador." },
        nombre: { type: "string", description: "Nombre o apellido (búsqueda parcial)." },
        numero_poliza: { type: "string", description: "Número exacto de póliza." },
        agente_id: { type: "string", description: "UUID o nombre del agente." },
        estado: { type: "string", enum: ["activa","vencida","cancelada","siniestrada","renovada","todas"], description: "Estado de la póliza. Por defecto: todas." },
        ramo: { type: "string", enum: ["HOGAR","AUTO","SALUD","VIDA","RESPONSABILIDAD","todos"], description: "Ramo del seguro." },
        limite: { type: "number", description: "Máx. resultados (default 20)." },
      },
      required: [],
    },
  },
  {
    name: "cabal_get_poliza",
    description:
      "Obtiene el detalle completo de una póliza: datos del inmueble/vehículo, " +
      "asegurado, tomador, agente, prima, vigencia, siniestros y renovaciones asociadas. " +
      "Ejemplo: '¿Cuál es el estado de la póliza #0012345?'",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "UUID interno de la póliza." },
        numero_poliza: { type: "string", description: "Número de póliza emitido por la aseguradora." },
      },
      required: [],
    },
  },
  {
    name: "cabal_polizas_por_vencer",
    description:
      "Lista las pólizas que vencen en los próximos N días. " +
      "Ideal para generar llamadas de renovación. " +
      "Ejemplos: '¿Qué vence esta semana?', '¿Qué clientes hay que contactar en los próximos 30 días?'",
    inputSchema: {
      type: "object",
      properties: {
        dias: { type: "number", description: "Rango en días (default 30)." },
        agente_id: { type: "string", description: "Filtrar por agente específico." },
        ramo: { type: "string", description: "Filtrar por ramo." },
      },
      required: [],
    },
  },
  {
    name: "cabal_estadisticas_cartera",
    description:
      "Resumen estadístico de la cartera: total de pólizas activas/vencidas/canceladas, " +
      "prima total en cartera, distribución por ramo, por agente y por aseguradora. " +
      "Ejemplo: '¿Cuánto vale la cartera activa?', '¿Cuántas pólizas HOGAR tenemos?'",
    inputSchema: {
      type: "object",
      properties: {
        periodo: { type: "string", description: "Mes/año para filtrar emisión (ej: '2026-09'). Vacío = todo." },
        agente_id: { type: "string", description: "Filtrar por agente." },
      },
      required: [],
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BLOQUE 3: Clientes internos (requiere BD)
  // ══════════════════════════════════════════════════════════════════════════

  {
    name: "cabal_buscar_cliente_interno",
    description:
      "Busca un cliente en la base de datos interna de Cabal (no en Seguros Caracas). " +
      "Devuelve datos de contacto y un resumen de sus pólizas activas. " +
      "Ejemplo: '¿Tenemos registrada a Ana García?', '¿Cuál es el email de V-12345678?'",
    inputSchema: {
      type: "object",
      properties: {
        cedula: { type: "string", description: "Cédula o RIF sin puntos." },
        nombre: { type: "string", description: "Nombre o apellido (búsqueda parcial)." },
        email: { type: "string", description: "Email del cliente." },
      },
      required: [],
    },
  },
  {
    name: "cabal_historial_cliente",
    description:
      "Historial completo de un cliente: todas sus pólizas (activas e históricas), " +
      "siniestros, renovaciones y pagos registrados en Cabal. " +
      "Ejemplo: '¿Cuántos seguros ha tenido Juan Pérez con nosotros?', 'Muéstrame todo de V-12345678'",
    inputSchema: {
      type: "object",
      properties: {
        cedula: { type: "string", description: "Cédula del cliente." },
        cliente_id: { type: "string", description: "UUID interno del cliente." },
      },
      required: [],
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BLOQUE 4: Siniestros (requiere BD)
  // ══════════════════════════════════════════════════════════════════════════

  {
    name: "cabal_registrar_siniestro",
    description:
      "Registra un nuevo siniestro en la póliza indicada. " +
      "Ejemplo: 'Registra un siniestro de incendio en la póliza #0012345 que ocurrió el 3 de septiembre'",
    inputSchema: {
      type: "object",
      properties: {
        poliza_id: { type: "string", description: "UUID o número de póliza." },
        fecha_ocurrencia: { type: "string", description: "Fecha del evento (YYYY-MM-DD)." },
        tipo: {
          type: "string",
          enum: ["robo","incendio","inundacion","daño_electrico","daño_estructura","otro"],
          description: "Tipo de siniestro.",
        },
        descripcion: { type: "string", description: "Descripción detallada del evento." },
        monto_reclamado: { type: "number", description: "Monto reclamado por el cliente." },
        moneda: { type: "string", description: "USD o VES." },
        numero_siniestro_aseguradora: { type: "string", description: "Número asignado por SC (si ya lo tienen)." },
      },
      required: ["poliza_id","fecha_ocurrencia","tipo","descripcion"],
    },
  },
  {
    name: "cabal_buscar_siniestros",
    description:
      "Lista siniestros con filtros. " +
      "Ejemplos: '¿Qué siniestros están abiertos?', '¿Cuántos siniestros de robo hubo este año?'",
    inputSchema: {
      type: "object",
      properties: {
        poliza_id: { type: "string", description: "Filtrar por póliza." },
        cliente_cedula: { type: "string", description: "Filtrar por cédula del asegurado." },
        estado: {
          type: "string",
          enum: ["reportado","en_investigacion","aprobado","pagado","rechazado","cerrado","todos"],
          description: "Estado del siniestro.",
        },
        tipo: { type: "string", description: "Tipo de siniestro." },
        desde: { type: "string", description: "Fecha mínima de ocurrencia (YYYY-MM-DD)." },
        hasta: { type: "string", description: "Fecha máxima de ocurrencia (YYYY-MM-DD)." },
        limite: { type: "number", description: "Máx resultados (default 20)." },
      },
      required: [],
    },
  },
  {
    name: "cabal_get_siniestro",
    description:
      "Detalle completo de un siniestro: póliza, cliente, montos, estado y notas de seguimiento. " +
      "Ejemplo: '¿Cuál es el estado del siniestro #S-004?'",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "UUID del siniestro." },
        numero_siniestro: { type: "string", description: "Número de siniestro interno." },
      },
      required: [],
    },
  },
  {
    name: "cabal_actualizar_siniestro",
    description:
      "Actualiza el estado, montos o notas de un siniestro existente. " +
      "Ejemplo: 'El siniestro #S-004 fue aprobado por $1.200', 'Marca el siniestro como cerrado'",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "UUID del siniestro a actualizar." },
        numero_siniestro: { type: "string", description: "Número de siniestro (alternativa al id)." },
        estado: {
          type: "string",
          enum: ["reportado","en_investigacion","aprobado","pagado","rechazado","cerrado"],
          description: "Nuevo estado.",
        },
        monto_aprobado: { type: "number", description: "Monto aprobado por la aseguradora." },
        monto_pagado: { type: "number", description: "Monto efectivamente pagado al cliente." },
        numero_siniestro_aseguradora: { type: "string", description: "Número asignado por Seguros Caracas." },
        notas: { type: "string", description: "Notas de seguimiento del caso." },
      },
      required: [],
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BLOQUE 5: Renovaciones (requiere BD)
  // ══════════════════════════════════════════════════════════════════════════

  {
    name: "cabal_renovaciones_pendientes",
    description:
      "Lista las pólizas que vencen próximamente y aún no han sido renovadas. " +
      "Incluye datos de contacto del cliente para facilitar el seguimiento. " +
      "Ejemplo: '¿A quién tengo que llamar esta semana para renovar?', '¿Qué clientes perdemos si no actuamos?'",
    inputSchema: {
      type: "object",
      properties: {
        dias: { type: "number", description: "Vencen en los próximos N días (default 30)." },
        agente_id: { type: "string", description: "Filtrar por agente." },
        ramo: { type: "string", description: "Filtrar por ramo." },
        incluir_contacto: { type: "boolean", description: "Incluir email y teléfono del cliente (default true)." },
      },
      required: [],
    },
  },
  {
    name: "cabal_registrar_renovacion",
    description:
      "Registra que una póliza fue renovada: nueva vigencia, prima actualizada y (opcionalmente) nuevo número de póliza. " +
      "Ejemplo: 'La póliza de Ana García fue renovada por $450 hasta septiembre 2027'",
    inputSchema: {
      type: "object",
      properties: {
        poliza_id: { type: "string", description: "UUID o número de póliza original." },
        fecha_nueva_vigencia: { type: "string", description: "Nueva fecha de inicio (YYYY-MM-DD)." },
        fecha_nuevo_vencimiento: { type: "string", description: "Nueva fecha de vencimiento (YYYY-MM-DD)." },
        prima_nueva: { type: "number", description: "Nueva prima." },
        moneda: { type: "string", description: "Moneda de la prima." },
        nuevo_numero_poliza: { type: "string", description: "Nuevo número si se emitió póliza nueva." },
        notas: { type: "string", description: "Observaciones de la renovación." },
      },
      required: ["poliza_id","fecha_nueva_vigencia","fecha_nuevo_vencimiento"],
    },
  },
  {
    name: "cabal_historial_renovaciones",
    description:
      "Muestra el historial completo de renovaciones de una póliza o cliente. " +
      "Ejemplo: '¿Cuántas veces ha renovado el cliente V-12345678?', '¿Cuál es la tasa de retención?'",
    inputSchema: {
      type: "object",
      properties: {
        poliza_id: { type: "string", description: "UUID o número de póliza." },
        cedula: { type: "string", description: "Cédula del cliente (devuelve renovaciones de todas sus pólizas)." },
      },
      required: [],
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BLOQUE 6: Comisiones (requiere BD)
  // ══════════════════════════════════════════════════════════════════════════

  {
    name: "cabal_comisiones_pendientes",
    description:
      "Lista todas las comisiones devengadas que aún no han sido pagadas a los agentes. " +
      "Agrupa por agente con el total adeudado. " +
      "Ejemplo: '¿Cuánto le debo a cada agente?', '¿Qué comisiones están pendientes de pago?'",
    inputSchema: {
      type: "object",
      properties: {
        agente_id: { type: "string", description: "Filtrar por agente específico." },
        moneda: { type: "string", description: "Filtrar por moneda (USD/VES)." },
        desde: { type: "string", description: "Fecha mínima de cálculo (YYYY-MM-DD)." },
      },
      required: [],
    },
  },
  {
    name: "cabal_resumen_comisiones_agente",
    description:
      "Resumen de comisiones de un agente específico: total ganado, pagado y pendiente, " +
      "detallado por período y por póliza. " +
      "Ejemplo: '¿Cuánto ganó Carlos López este mes?', '¿Cuánto ha facturado el agente López este año?'",
    inputSchema: {
      type: "object",
      properties: {
        agente_id: { type: "string", description: "UUID o nombre del agente." },
        desde: { type: "string", description: "Inicio del período (YYYY-MM-DD)." },
        hasta: { type: "string", description: "Fin del período (YYYY-MM-DD)." },
      },
      required: ["agente_id"],
    },
  },
  {
    name: "cabal_resumen_comisiones_periodo",
    description:
      "Total de comisiones pagadas y pendientes en un período dado, agrupadas por agente. " +
      "Ejemplo: '¿Cuánto pagamos en comisiones en Q3?', '¿Cuál fue el costo de comisiones de agosto?'",
    inputSchema: {
      type: "object",
      properties: {
        desde: { type: "string", description: "Inicio del período (YYYY-MM-DD)." },
        hasta: { type: "string", description: "Fin del período (YYYY-MM-DD)." },
        moneda: { type: "string", description: "USD o VES." },
      },
      required: ["desde","hasta"],
    },
  },
  {
    name: "cabal_registrar_pago_comision",
    description:
      "Marca una o varias comisiones como pagadas, registrando la referencia bancaria. " +
      "Ejemplo: 'Marca como pagada la comisión de Carlos López del mes de agosto, transferencia #12345'",
    inputSchema: {
      type: "object",
      properties: {
        comision_ids: {
          type: "array",
          items: { type: "string" },
          description: "Lista de UUIDs de comisiones a marcar como pagadas.",
        },
        agente_id: { type: "string", description: "Alternativa: pagar todas las pendientes de un agente." },
        fecha_pago: { type: "string", description: "Fecha del pago (YYYY-MM-DD, default: hoy)." },
        referencia_pago: { type: "string", description: "Número de transferencia o referencia bancaria." },
        notas: { type: "string", description: "Observaciones del pago." },
      },
      required: ["referencia_pago"],
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BLOQUE 7: Reportes y estadísticas (requiere BD)
  // ══════════════════════════════════════════════════════════════════════════

  {
    name: "cabal_reporte_produccion",
    description:
      "Reporte de producción: pólizas emitidas, primas totales y comparativo vs período anterior. " +
      "Ejemplo: '¿Cuánto produjimos este mes?', '¿Cómo vamos vs agosto?', '¿Cuál fue la producción de Q2?'",
    inputSchema: {
      type: "object",
      properties: {
        desde: { type: "string", description: "Inicio del período (YYYY-MM-DD)." },
        hasta: { type: "string", description: "Fin del período (YYYY-MM-DD)." },
        comparar_periodo_anterior: { type: "boolean", description: "Incluir comparativo vs período equivalente anterior (default true)." },
        agente_id: { type: "string", description: "Filtrar por agente." },
        ramo: { type: "string", description: "Filtrar por ramo." },
      },
      required: ["desde","hasta"],
    },
  },
  {
    name: "cabal_ranking_agentes",
    description:
      "Ranking de agentes ordenado por prima emitida, número de pólizas activas o comisiones generadas. " +
      "Ejemplo: '¿Quién es el agente con más cartera?', '¿Cuál es el top 3 de agentes este año?'",
    inputSchema: {
      type: "object",
      properties: {
        ordenar_por: {
          type: "string",
          enum: ["prima_total","numero_polizas","comisiones_generadas"],
          description: "Criterio de ranking (default: prima_total).",
        },
        desde: { type: "string", description: "Inicio del período." },
        hasta: { type: "string", description: "Fin del período." },
        top: { type: "number", description: "Cuántos agentes mostrar (default 10)." },
      },
      required: [],
    },
  },
];

// ─── dispatcher ────────────────────────────────────────────────────────────────

type Args = Record<string, unknown>;

async function dispatch(name: string, args: Args): Promise<unknown> {
  switch (name) {
    // ── Seguros Caracas ──────────────────────────────────────────────────────
    case "cabal_get_planes":
      return callCabal("propuestas");
    case "cabal_get_listas_iniciales":
      return callCabal("listas");
    case "cabal_get_ciudades":
      return callCabal("ciudades", { cdEstado: args.cdEstado });
    case "cabal_get_sectores":
      return callCabal("sectores", { cdEstado: args.cdEstado, cdCiudad: args.cdCiudad });
    case "cabal_consultar_cliente":
      return callCabal("consultar_cliente", { nacionalidad: args.nacionalidad ?? "V", cedulaRif: args.cedulaRif });
    case "cabal_emitir_poliza_hogar":
      return callCabal("suscribir", { pedido: args.pedido });

    // ── Pólizas ──────────────────────────────────────────────────────────────
    case "cabal_buscar_polizas":
      return callCabal("buscar_polizas", args);
    case "cabal_get_poliza":
      return callCabal("get_poliza", args);
    case "cabal_polizas_por_vencer":
      return callCabal("polizas_por_vencer", args);
    case "cabal_estadisticas_cartera":
      return callCabal("estadisticas_cartera", args);

    // ── Clientes ─────────────────────────────────────────────────────────────
    case "cabal_buscar_cliente_interno":
      return callCabal("buscar_cliente", args);
    case "cabal_historial_cliente":
      return callCabal("historial_cliente", args);

    // ── Siniestros ───────────────────────────────────────────────────────────
    case "cabal_registrar_siniestro":
      return callCabal("registrar_siniestro", args);
    case "cabal_buscar_siniestros":
      return callCabal("buscar_siniestros", args);
    case "cabal_get_siniestro":
      return callCabal("get_siniestro", args);
    case "cabal_actualizar_siniestro":
      return callCabal("actualizar_siniestro", args);

    // ── Renovaciones ─────────────────────────────────────────────────────────
    case "cabal_renovaciones_pendientes":
      return callCabal("renovaciones_pendientes", args);
    case "cabal_registrar_renovacion":
      return callCabal("registrar_renovacion", args);
    case "cabal_historial_renovaciones":
      return callCabal("historial_renovaciones", args);

    // ── Comisiones ───────────────────────────────────────────────────────────
    case "cabal_comisiones_pendientes":
      return callCabal("comisiones_pendientes", args);
    case "cabal_resumen_comisiones_agente":
      return callCabal("resumen_comisiones_agente", args);
    case "cabal_resumen_comisiones_periodo":
      return callCabal("resumen_comisiones_periodo", args);
    case "cabal_registrar_pago_comision":
      return callCabal("registrar_pago_comision", args);

    // ── Reportes ─────────────────────────────────────────────────────────────
    case "cabal_reporte_produccion":
      return callCabal("reporte_produccion", args);
    case "cabal_ranking_agentes":
      return callCabal("ranking_agentes", args);

    default:
      throw new Error(`Herramienta desconocida: ${name}`);
  }
}

// ─── server ──────────────────────────────────────────────────────────────────

const server = new Server(
  { name: "cabal-mcp", version: "2.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  try {
    const result = await dispatch(name, args as Args);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
  }
});

// ─── start ────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
process.stderr.write(`[cabal-mcp v2] ${TOOLS.length} herramientas disponibles. Servidor iniciado.\n`);
