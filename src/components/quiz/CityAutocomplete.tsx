import { useMemo, useState } from "react";
import { Check, MapPin, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import cities from "@/data/brazil-cities.json";

type City = { id: number; name: string; uf: string };

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");

export function CityAutocomplete({
  city,
  uf,
  onInput,
  onSelect,
}: {
  city: string;
  uf: string;
  onInput: (value: string) => void;
  onSelect: (city: string, uf: string, ibgeId: number) => void;
}) {
  const [focused, setFocused] = useState(false);
  const query = normalize(city.trim());
  const suggestions = useMemo(() => {
    if (query.length < 2) return [];
    return (cities as City[])
      .filter((item) => normalize(item.name).includes(query))
      .sort((a, b) => {
        const aStarts = normalize(a.name).startsWith(query) ? 0 : 1;
        const bStarts = normalize(b.name).startsWith(query) ? 0 : 1;
        return aStarts - bStarts || a.name.localeCompare(b.name, "pt-BR");
      })
      .slice(0, 8);
  }, [query]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 z-10 size-5 -translate-y-1/2 text-muted-foreground" />
      <Input
        autoFocus
        value={city}
        onFocus={() => setFocused(true)}
        onBlur={() => window.setTimeout(() => setFocused(false), 120)}
        onChange={(event) => onInput(event.target.value)}
        placeholder="Digite sua cidade"
        autoComplete="off"
        className="h-16 rounded-2xl bg-card pl-12 pr-16 text-lg"
      />
      {uf && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg bg-primary/15 px-2 py-1 text-sm font-bold text-primary">
          {uf}
        </span>
      )}

      {focused && query.length >= 2 && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 max-h-72 overflow-y-auto rounded-2xl border border-border bg-popover p-2 shadow-soft">
          {suggestions.length ? (
            suggestions.map((item) => {
              const selected = city === item.name && uf === item.uf;
              return (
                <button
                  key={item.id}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onSelect(item.name, item.uf, item.id);
                    setFocused(false);
                  }}
                >
                  <MapPin className="size-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
                  <span className="text-sm text-muted-foreground">{item.uf}</span>
                  {selected && <Check className="size-4 text-primary" />}
                </button>
              );
            })
          ) : (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              Nenhum município encontrado.
            </p>
          )}
        </div>
      )}

      <p className="mt-2 text-xs text-muted-foreground">
        {uf
          ? "Cidade selecionada · estado preenchido automaticamente"
          : "Digite ao menos 2 letras e selecione uma opção"}
      </p>
    </div>
  );
}
