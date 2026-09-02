type IbgeResponse = Array<{
  resultados?: Array<{
    series?: Array<{ serie?: Record<string, string> }>;
  }>;
}>;

export async function fetchMunicipalPopulation(ibgeId: number) {
  const endpoint = `https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/-1/variaveis/9324?localidades=N6[${ibgeId}]`;
  const response = await fetch(endpoint);
  if (!response.ok) return null;
  const payload = (await response.json()) as IbgeResponse;
  const series = payload[0]?.resultados?.[0]?.series?.[0]?.serie;
  if (!series) return null;
  const [year, raw] = Object.entries(series).at(-1) ?? [];
  const population = Number(raw);
  return year && Number.isFinite(population)
    ? { population, referenceYear: Number(year), source: "IBGE" }
    : null;
}
