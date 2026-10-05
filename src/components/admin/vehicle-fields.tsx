"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check, ChevronDown, Loader2, RotateCcw, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  filterVehicleOptions,
  formatSelectedVehicle,
  type VehicleOption,
  type VehicleSelection,
} from "@/lib/vehicle-catalog";
import styles from "./documentos.module.css";

const catalogueCache = new Map<
  string,
  { expires: number; promise: Promise<VehicleOption[]> }
>();

function loadCatalogue(url: string): Promise<VehicleOption[]> {
  const cached = catalogueCache.get(url);
  if (cached && cached.expires > Date.now()) return cached.promise;
  const promise = fetch(url, { signal: AbortSignal.timeout(15000) })
    .then(async (response) => {
      if (!response.ok) throw new Error("Catálogo indisponível");
      const data = await response.json();
      if (!Array.isArray(data.items)) throw new Error("Catálogo inválido");
      return data.items as VehicleOption[];
    })
    .catch((error) => {
      catalogueCache.delete(url);
      throw error;
    });
  catalogueCache.set(url, {
    expires: Date.now() + 4 * 60 * 60 * 1000,
    promise,
  });
  return promise;
}

function useCatalogue(url: string | null) {
  const [result, setResult] = useState<{
    url: string;
    items: VehicleOption[];
    error: boolean;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!url) return;
    let active = true;
    loadCatalogue(url)
      .then((items) => {
        if (active) setResult({ url, items, error: false });
      })
      .catch(() => {
        if (active) setResult({ url, items: [], error: true });
      });
    return () => {
      active = false;
    };
  }, [url, attempt]);
  const current = result?.url === url ? result : null;
  return {
    items: current?.items ?? [],
    loading: !!url && !current,
    error: current?.error ?? false,
    retry: () => {
      setResult(null);
      setAttempt((value) => value + 1);
    },
  };
}

function VehicleSearch({
  id,
  label,
  placeholder,
  selected,
  options,
  loading,
  disabled,
  onSelect,
  onClear,
}: {
  id: string;
  label: string;
  placeholder: string;
  selected: VehicleOption | null;
  options: VehicleOption[];
  loading: boolean;
  disabled?: boolean;
  onSelect: (option: VehicleOption) => void;
  onClear: () => void;
}) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const matches = useMemo(
    () => filterVehicleOptions(options, query ?? ""),
    [options, query],
  );
  const visible = matches.slice(0, 40);
  const activeOption = visible[active];

  useEffect(() => {
    if (open && active >= 0)
      listRef.current
        ?.querySelector(`[data-index="${active}"]`)
        ?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function choose(option: VehicleOption) {
    onSelect(option);
    setQuery(null);
    setOpen(false);
    setActive(-1);
  }
  return (
    <div className={styles.field}>
      <Label htmlFor={id}>{label}</Label>
      <div className={styles.vehicleSearch}>
        <Input
          ref={inputRef}
          id={id}
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          value={query ?? selected?.name ?? ""}
          placeholder={placeholder}
          aria-expanded={open && !disabled}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-controls={open ? listId : undefined}
          aria-activedescendant={
            open && activeOption ? `${listId}-${activeOption.code}` : undefined
          }
          onFocus={() => {
            setOpen(true);
            setActive(-1);
          }}
        onClick={() => {
          setOpen(true);
          setActive(-1);
        }}
          onBlur={() => {
            setOpen(false);
            setQuery(null);
            setActive(-1);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              setActive((index) =>
                visible.length
                  ? event.key === "ArrowDown"
                    ? Math.min(index + 1, visible.length - 1)
                    : index < 0
                      ? visible.length - 1
                      : Math.max(index - 1, 0)
                  : -1,
              );
            } else if (event.key === "Enter" && open && activeOption) {
              event.preventDefault();
              choose(activeOption);
            } else if (event.key === "Escape" && open) {
              event.preventDefault();
              event.stopPropagation();
              setOpen(false);
              setQuery(null);
              setActive(-1);
            }
          }}
        />
        <span className={styles.vehicleSearchActions}>
          {loading ? (
            <Loader2
              size={17}
              className="animate-spin"
              aria-label="Carregando catálogo"
            />
          ) : (
            <>
              {selected && (
                <button
                  type="button"
                  aria-label={`Limpar ${label.toLowerCase()}`}
                  disabled={disabled}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onClear();
                    setQuery(null);
                    setOpen(false);
                  }}
                >
                  <X size={15} />
                </button>
              )}
              <button
                type="button"
                disabled={disabled}
                aria-label={`Mostrar opções de ${label.toLowerCase()}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  inputRef.current?.focus();
                  setOpen(!open);
                  setActive(-1);
                }}
              >
                <ChevronDown size={17} />
              </button>
            </>
          )}
        </span>
      </div>
      {open && !disabled && (
        <div className={styles.vehicleResults}>
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={`Opções de ${label.toLowerCase()}`}
            aria-busy={loading}
          >
            {visible.map((option, index) => (
              <li
                key={option.code}
                id={`${listId}-${option.code}`}
                role="option"
                aria-selected={selected?.code === option.code}
                data-active={active === index}
                data-index={index}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
              >
                <span>{option.name}</span>
                {selected?.code === option.code && <Check size={16} />}
              </li>
            ))}
          </ul>
          <p role="status">
            {loading
              ? "Carregando opções..."
              : matches.length === 0
                ? "Nenhum resultado. Você pode informar o veículo manualmente."
                : matches.length > visible.length
                  ? `Mostrando ${visible.length} de ${matches.length}. Digite para refinar a busca.`
                  : `${matches.length} ${matches.length === 1 ? "opção disponível" : "opções disponíveis"}.`}
          </p>
        </div>
      )}
    </div>
  );
}

export function VehicleFields({
  value,
  selection,
  onChange,
  children,
}: {
  value: string;
  selection?: VehicleSelection;
  onChange: (value: string, selection?: VehicleSelection) => void;
  children: ReactNode;
}) {
  const [manual, setManual] = useState(!!value && !selection);
  const brands = useCatalogue(manual ? null : "/api/veiculos");
  const models = useCatalogue(
    !manual && selection ? `/api/veiculos?marca=${selection.brand.code}` : null,
  );
  const years = useCatalogue(
    !manual && selection?.model
      ? `/api/veiculos?marca=${selection.brand.code}&modelo=${selection.model.code}`
      : null,
  );
  const failed = brands.error
    ? brands
    : models.error
      ? models
      : years.error
        ? years
        : null;
  function select(next: VehicleSelection) {
    onChange(formatSelectedVehicle(next), next);
  }

  return (
    <div className={styles.vehicleFields}>
      <div className={styles.vehicleMode}>
        <p>
          {manual
            ? "Informe o veículo como preferir."
            : "Busque a marca e depois o modelo. O ano é opcional."}
        </p>
        <button type="button" onClick={() => setManual(!manual)}>
          {manual ? "Buscar no catálogo" : "Informar manualmente"}
        </button>
      </div>
      {manual ? (
        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <Label htmlFor="doc-modelo">Modelo</Label>
            <Input
              id="doc-modelo"
              placeholder="Ex.: Chevrolet Onix 1.0 · 2020"
              value={value}
              onChange={(event) => onChange(event.target.value)}
            />
          </div>
          {children}
        </div>
      ) : (
        <>
          <div className={styles.fieldGrid}>
            <VehicleSearch
              id="doc-marca"
              label="Marca"
              placeholder="Digite para buscar a marca"
              selected={selection?.brand ?? null}
              options={brands.items}
              loading={brands.loading}
              onSelect={(brand) => select({ brand, model: null, year: null })}
              onClear={() => onChange("")}
            />
            <VehicleSearch
              key={selection?.brand.code ?? "sem-marca"}
              id="doc-modelo-catalogo"
              label="Modelo"
              placeholder={
                selection
                  ? "Digite para buscar o modelo"
                  : "Escolha a marca primeiro"
              }
              selected={selection?.model ?? null}
              disabled={!selection}
              options={models.items}
              loading={models.loading}
              onSelect={(model) => {
                if (selection) select({ ...selection, model, year: null });
              }}
              onClear={() => {
                if (selection)
                  select({ ...selection, model: null, year: null });
              }}
            />
            <div className={styles.field}>
              <Label htmlFor="doc-ano">
                Ano{" "}
                <span className="text-muted-foreground font-normal">
                  (opcional)
                </span>
              </Label>
              <Select
                id="doc-ano"
                disabled={!selection?.model || years.loading || years.error}
                value={selection?.year?.code ?? ""}
                onChange={(event) => {
                  if (selection)
                    select({
                      ...selection,
                      year:
                        years.items.find(
                          (year) => year.code === event.target.value,
                        ) ?? null,
                    });
                }}
              >
                <option value="">
                  {!selection?.model
                    ? "Escolha o modelo primeiro"
                    : years.loading
                      ? "Carregando anos..."
                      : "Sem ano informado"}
                </option>
                {years.items.map((year) => (
                  <option key={year.code} value={year.code}>
                    {year.name}
                  </option>
                ))}
              </Select>
            </div>
            {children}
          </div>
          {failed && (
            <div className={styles.vehicleStatus} role="status">
              <p>
                Não foi possível carregar{" "}
                {brands.error
                  ? "as marcas"
                  : models.error
                    ? "os modelos"
                    : "os anos"}
                . Tente novamente ou informe o veículo manualmente.
              </p>
              <button type="button" onClick={failed.retry}>
                <RotateCcw size={15} />
                Tentar novamente
              </button>
            </div>
          )}
          {value && (
            <p className={styles.vehicleSelected}>
              <Check size={15} />
              <span>
                Veículo no documento: <strong>{value}</strong>
              </span>
            </p>
          )}
        </>
      )}
    </div>
  );
}
