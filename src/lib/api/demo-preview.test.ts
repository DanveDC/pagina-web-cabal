import { test } from "node:test";
import assert from "node:assert/strict";
import { segurosCaracasDemoClient } from "./seguros-caracas-demo";
import { buildUpstreamPreview, PENDING_SC } from "./suscribir-preview";
import { buildSuscribirPayload } from "@/lib/validation/seguros-caracas";
import { PERSONA_EMPTY } from "@/types/seguros-caracas";

test("demo client serves the spec samples without network", async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = (() => { throw new Error("network used in demo"); }) as typeof fetch;
  try {
    const p = await segurosCaracasDemoClient.getPropuestas();
    assert.ok(p.ok && "propuestas" in p.data && p.data.propuestas[0]!.nmPropuesta === "OPCIÓN RESIDENCIAL");
    const s = await segurosCaracasDemoClient.getSectores("1", "1");
    assert.ok(s.ok && "sectores" in s.data && s.data.sectores[0]!.descripcion === "MONTAHUELA");
    const hit = await segurosCaracasDemoClient.getCliente("V", "99999999");
    assert.ok(hit.ok && "cliente" in hit.data);
    const miss = await segurosCaracasDemoClient.getCliente("V", "12345678");
    assert.ok(miss.ok && !("cliente" in miss.data));
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("preview puts credentials as placeholders and keeps the spec shape", () => {
  const r = buildSuscribirPayload(
    {
      inmueble: {
        cdEstado: "1", deEstado: "DISTRITO CAPITAL", cdCiudad: "1", deCiudad: "CARACAS",
        cdSector: "13351", deSector: "MONTAHUELA", cdPostal: "1040", x: "-67.0683", y: "10.3933",
        cdIndole: "1", deInmueble: "APARTAMENTO RESIDENCIAL", deCalle: "Av. Principal",
        deDireccion1: "Av. Principal, Torre A, Apto 4", deDireccion2: "",
      },
      asegurado: {
        ...PERSONA_EMPTY, nacionalidad: "V", cedulaRif: "12345678", nombres: "Ana", apellidosRazonSocial: "Pérez",
        sexo: "F", edoCivil: "S", feNacimiento: "10/05/1990", email: "ana@example.com",
        estado: "MIRANDA", ciudad: "CARACAS", direccion: "Av. Principal", cdAreaTlf: "0212", nuTlf: "5551234",
      },
      tomadorIgualAsegurado: true,
      tomador: { ...PERSONA_EMPTY },
    },
    { cdOpcion: 1, cdMoneda: "02", frPago: "A" }
  );
  assert.ok(r.ok);
  if (!r.ok) return;
  const prev = buildUpstreamPreview(r.payload);
  assert.equal(prev.pedido.cdProductor, PENDING_SC);
  assert.equal(prev.pedido.cdConvenio, PENDING_SC);
  assert.equal(prev.pedido.cdUsuario, PENDING_SC);
  assert.equal(prev.pedido.frPago, "A");
  assert.equal(prev.pedido.hogar.deSector, "MONTAHUELA");
  assert.equal(prev.pedido.asegurado.estado, "MIRANDA");
  assert.equal(typeof prev.pedido.asegurado.cedulaRif, "number");
});
