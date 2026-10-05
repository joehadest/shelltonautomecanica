import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

// Exercise the TypeScript modules with Node's test runner, without a framework dependency.
function loadModule(file, globals = {}) {
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2017,
    },
  });
  const context = { exports: {}, URL, Response, AbortSignal, ...globals };
  runInNewContext(outputText, context, { filename: file });
  return context.exports;
}

const catalogue = loadModule("../src/lib/vehicle-catalog.ts");
const plain = (value) => JSON.parse(JSON.stringify(value));

function handler(fetchMock) {
  return loadModule("../src/app/api/veiculos/route.ts", {
    fetch: fetchMock,
    require: (name) => {
      assert.equal(name, "@/lib/vehicle-catalog");
      return catalogue;
    },
  }).GET;
}

test("search matches accents and multiple terms in any order", () => {
  const options = [
    { code: "1", name: "Citroën C3 1.0" },
    { code: "2", name: "ONIX HATCH LT 1.0" },
    { code: "3", name: "ONIX HATCH LT 1.4" },
  ];
  assert.equal(catalogue.filterVehicleOptions(options, "CITROEN")[0].code, "1");
  assert.equal(
    catalogue.filterVehicleOptions(options, "1.0 Onix")[0].code,
    "2",
  );
  assert.equal(catalogue.filterVehicleOptions(options, "onix 1.0").length, 1);
  assert.equal(catalogue.filterVehicleOptions(options, "não existe").length, 0);
  assert.equal(catalogue.filterVehicleOptions(options, " ").length, 3);
});

test("years are deduplicated across fuels and zero km stays identifiable", () => {
  const years = catalogue.normalizeVehicleCatalogue(
    [
      { code: "2020-1", name: "2020 Gasolina" },
      { code: "2020-3", name: "2020 Diesel" },
      { code: "32000-1", name: "Zero KM Gasolina" },
      { code: "2024-1", name: "2024 Gasolina" },
    ],
    "years",
  );
  assert.deepEqual(plain(years), [
    { code: "32000", name: "Zero km" },
    { code: "2024", name: "2024" },
    { code: "2020", name: "2020" },
  ]);
});

test("provider labels normalize and malformed payloads are rejected", () => {
  const brands = catalogue.normalizeVehicleCatalogue(
    [
      { code: "59", name: "VW - VolksWagen" },
      { code: 23, name: "GM - Chevrolet" },
    ],
    "brands",
  );
  assert.deepEqual(plain(brands), [
    { code: "23", name: "Chevrolet" },
    { code: "59", name: "Volkswagen" },
  ]);
  for (const payload of [
    { error: "limited" },
    [null],
    [{ code: "../", name: "Carro" }],
    [{ code: "1", name: "" }],
  ]) {
    assert.throws(() => catalogue.normalizeVehicleCatalogue(payload, "models"));
  }
});

test("document vehicle includes the optional year and avoids repeated brand", () => {
  const selection = {
    brand: { code: "23", name: "Chevrolet" },
    model: null,
    year: null,
  };
  assert.equal(catalogue.formatSelectedVehicle(selection), "");
  selection.model = { code: "1", name: "Onix 1.0" };
  assert.equal(
    catalogue.formatSelectedVehicle(selection),
    "Chevrolet Onix 1.0",
  );
  selection.year = { code: "2020", name: "2020" };
  assert.equal(
    catalogue.formatSelectedVehicle(selection),
    "Chevrolet Onix 1.0 · 2020",
  );
  selection.model.name = "Chevrolet Onix 1.0";
  assert.equal(
    catalogue.formatSelectedVehicle(selection),
    "Chevrolet Onix 1.0 · 2020",
  );
});

test("invalid parameters never reach the upstream service", async () => {
  const GET = handler(() => {
    throw new Error("Upstream should not be called");
  });
  for (const query of [
    "marca=",
    "marca=-1",
    "marca=../",
    "modelo=1",
    "marca=23&modelo=",
    "marca=23&modelo=https://example.com",
    "marca=123456789",
  ]) {
    assert.equal(
      (await GET(new Request(`http://localhost/api/veiculos?${query}`))).status,
      400,
    );
  }
});

test("route requests only the selected catalogue level and enables cache", async () => {
  const cases = [
    { query: "", suffix: "", data: [{ code: "23", name: "GM - Chevrolet" }] },
    {
      query: "?marca=23",
      suffix: "/23/models",
      data: [{ code: "1", name: "Onix" }],
    },
    {
      query: "?marca=23&modelo=1",
      suffix: "/23/models/1/years",
      data: [{ code: "2020-1", name: "2020 Gasolina" }],
    },
  ];
  for (const { query, suffix, data } of cases) {
    let calls = 0;
    const GET = handler(async (url, options) => {
      calls++;
      assert.equal(
        url,
        `https://fipe.parallelum.com.br/api/v2/cars/brands${suffix}`,
      );
      assert.equal(options.next.revalidate, 86400);
      assert.ok(options.signal instanceof AbortSignal);
      return Response.json(data);
    });
    const response = await GET(
      new Request(`http://localhost/api/veiculos${query}`),
    );
    assert.equal(response.status, 200);
    assert.equal(calls, 1);
    assert.match(response.headers.get("cache-control"), /s-maxage=86400/);
    assert.equal((await response.json()).items.length, 1);
  }
});

test("network errors, rate limits and invalid upstream data allow manual fallback", async () => {
  for (const fetchMock of [
    async () => {
      throw new Error("Timeout");
    },
    async () => new Response(null, { status: 429 }),
    async () => Response.json({ invalid: true }),
  ]) {
    const response = await handler(fetchMock)(
      new Request("http://localhost/api/veiculos"),
    );
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("cache-control"), null);
    assert.match((await response.json()).error, /manualmente/);
  }
});
