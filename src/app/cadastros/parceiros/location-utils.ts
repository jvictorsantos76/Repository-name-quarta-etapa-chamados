export type CoordenadasOperacionais = {
  latitude: number;
  longitude: number;
};

const COORDENADA_REGEX = /(-?\d{1,2}(?:[.,]\d+)?)\s*,\s*(-?\d{1,3}(?:[.,]\d+)?)/;
const GOOGLE_AT_COORDENADA_REGEX = /@(-?\d{1,2}(?:[.,]\d+)?),(-?\d{1,3}(?:[.,]\d+)?)/;

export function normalizarNumeroCoordenada(valor: string) {
  const texto = valor.trim();

  if (!texto) {
    return null;
  }

  const numero = Number(texto.replace(",", "."));
  return Number.isFinite(numero) ? numero : null;
}

export function coordenadasValidas(latitude: number | null, longitude: number | null) {
  return (
    latitude !== null &&
    longitude !== null &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export function interpretarCoordenadasMaps(texto: string) {
  const entrada = texto.trim();

  if (!entrada) {
    return null;
  }

  const decodificado = decodeURIComponent(entrada);
  const match = decodificado.match(GOOGLE_AT_COORDENADA_REGEX) ?? decodificado.match(COORDENADA_REGEX);

  if (!match) {
    return null;
  }

  const latitude = normalizarNumeroCoordenada(match[1] ?? "");
  const longitude = normalizarNumeroCoordenada(match[2] ?? "");

  return coordenadasValidas(latitude, longitude) ? { latitude, longitude } : null;
}

export function montarDestinoRota({
  latitude,
  longitude,
  endereco,
}: {
  latitude: string;
  longitude: string;
  endereco: string;
}) {
  const lat = normalizarNumeroCoordenada(latitude);
  const lng = normalizarNumeroCoordenada(longitude);
  const destino = coordenadasValidas(lat, lng) ? `${lat},${lng}` : endereco.trim();

  return destino
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destino)}`
    : null;
}

export function montarMapaPreview({
  latitude,
  longitude,
  endereco,
}: {
  latitude: string;
  longitude: string;
  endereco: string;
}) {
  const lat = normalizarNumeroCoordenada(latitude);
  const lng = normalizarNumeroCoordenada(longitude);
  const query = coordenadasValidas(lat, lng) ? `${lat},${lng}` : endereco.trim();

  return query
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    : null;
}
