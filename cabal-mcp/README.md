# cabal-mcp — Asistente IA para Cabal Asesores

Servidor MCP que conecta Claude Desktop con la API de Cabal / Seguros Caracas.
Los agentes de la corredora pueden consultar planes, verificar clientes y emitir
pólizas HOGAR directamente desde una conversación con Claude.

## Herramientas disponibles

| Herramienta | Descripción |
|---|---|
| `cabal_get_planes` | Planes HOGAR con precios y frecuencias de pago |
| `cabal_get_listas_iniciales` | Catálogo de estados, indoles e inmueble, países |
| `cabal_get_ciudades` | Ciudades de un estado |
| `cabal_get_sectores` | Sectores/urbanizaciones de una ciudad |
| `cabal_consultar_cliente` | Busca un asegurado existente por cédula |
| `cabal_emitir_poliza_hogar` | Emite una póliza HOGAR (requiere confirmación) |

## Instalación

```bash
cd cabal-mcp
npm install
npm run build
```

## Configuración en la app (DigitalOcean)

Agrega en las variables de entorno del app:

```
MCP_TOKEN=<genera con: openssl rand -hex 32>
```

## Configuración en Claude Desktop

Edita `claude_desktop_config.json` (en Mac: `~/Library/Application Support/Claude/`):

```json
{
  "mcpServers": {
    "cabal": {
      "command": "node",
      "args": ["C:/ruta/completa/a/cabal-mcp/dist/index.js"],
      "env": {
        "CABAL_BASE_URL": "https://monkfish-app-nf3lg.ondigitalocean.app",
        "MCP_TOKEN": "el_mismo_token_que_pusiste_en_digitalocean"
      }
    }
  }
}
```

> **Nota:** Usa la ruta completa al archivo `dist/index.js`. En Windows usa barras normales (`/`) o dobles barras invertidas (`\\`).

## Uso de ejemplo

Una vez configurado, en Claude Desktop puedes preguntar:

- *"¿Qué planes HOGAR tiene Cabal disponibles?"*
- *"Busca al cliente con cédula V-12345678"*
- *"¿Cuáles son las ciudades del estado Miranda?"*
- *"Emite una póliza HOGAR para..."* (Claude pedirá todos los datos y confirmación antes de emitir)

## Variables de entorno

| Variable | Descripción |
|---|---|
| `CABAL_BASE_URL` | URL base de la app desplegada (sin `/` al final) |
| `MCP_TOKEN` | Token secreto compartido con la app (mismo valor que `MCP_TOKEN` en DigitalOcean) |
