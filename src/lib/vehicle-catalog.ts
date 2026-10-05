export interface VehicleOption {
  code: string;
  name: string;
}

export interface VehicleSelection {
  brand: VehicleOption;
  model: VehicleOption | null;
  year: VehicleOption | null;
}

export type VehicleCatalogueKind = "brands" | "models" | "years";

export function normalizeVehicleSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function filterVehicleOptions(options: VehicleOption[], query: string) {
  const terms = normalizeVehicleSearch(query).split(/\s+/).filter(Boolean);
  return options.filter((option) => {
    const name = normalizeVehicleSearch(option.name);
    return terms.every((term) => name.includes(term));
  });
}

export function normalizeVehicleCatalogue(
  data: unknown,
  kind: VehicleCatalogueKind,
): VehicleOption[] {
  if (!Array.isArray(data)) throw new Error("Catálogo inválido");
  const options = new Map<string, VehicleOption>();
  for (const entry of data) {
    if (
      !entry ||
      typeof entry !== "object" ||
      !["string", "number"].includes(typeof entry.code) ||
      typeof entry.name !== "string" ||
      !entry.name.trim()
    ) {
      throw new Error("Item de catálogo inválido");
    }
    let code = String(entry.code);
    let name = entry.name.trim();
    if (kind === "years") {
      const year = /^(\d{4,5})(?:-\d+)?$/.exec(code)?.[1];
      if (!year) throw new Error("Ano inválido");
      code = year;
      name = year === "32000" || year === "9999" ? "Zero km" : year;
    } else {
      if (!/^\d{1,8}$/.test(code)) throw new Error("Código inválido");
      if (kind === "brands") {
        name = name
          .replace(/^GM\s*-\s*/i, "")
          .replace(/^VW\s*-\s*VolksWagen$/i, "Volkswagen");
      }
    }
    options.set(code, { code, name });
  }
  return [...options.values()].sort((a, b) =>
    kind === "years"
      ? Number(b.code) - Number(a.code)
      : a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }),
  );
}

export function formatSelectedVehicle(selection: VehicleSelection): string {
  if (!selection.model) return "";
  const { brand, model, year } = selection;
  const name = normalizeVehicleSearch(model.name).startsWith(
    normalizeVehicleSearch(brand.name) + " ",
  )
    ? model.name
    : `${brand.name} ${model.name}`;
  return year ? `${name} · ${year.name}` : name;
}
