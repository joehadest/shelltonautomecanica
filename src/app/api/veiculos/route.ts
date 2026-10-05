import {
  normalizeVehicleCatalogue,
  type VehicleCatalogueKind,
} from "@/lib/vehicle-catalog";

const CATALOGUE_BASE = "https://fipe.parallelum.com.br/api/v2/cars/brands";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const brand = params.get("marca");
  const model = params.get("modelo");
  if (
    (brand !== null && !/^\d{1,8}$/.test(brand)) ||
    (model !== null && (!brand || !/^\d{1,8}$/.test(model)))
  ) {
    return Response.json(
      { error: "Marca ou modelo inválido." },
      { status: 400 },
    );
  }

  const kind: VehicleCatalogueKind = model
    ? "years"
    : brand
      ? "models"
      : "brands";
  const url = `${CATALOGUE_BASE}${brand ? `/${brand}/models` : ""}${model ? `/${model}/years` : ""}`;
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("Catálogo indisponível");
    const items = normalizeVehicleCatalogue(await response.json(), kind);
    return Response.json(
      { items },
      {
        headers: {
          "Cache-Control":
            "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
        },
      },
    );
  } catch {
    return Response.json(
      {
        error:
          "Não foi possível carregar o catálogo. Tente novamente ou informe o veículo manualmente.",
      },
      { status: 503 },
    );
  }
}
