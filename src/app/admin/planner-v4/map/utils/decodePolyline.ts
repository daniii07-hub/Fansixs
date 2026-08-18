export type LatLngLiteral = {
  lat: number;
  lng: number;
};

export function decodePolyline(
  encoded: string,
): LatLngLiteral[] {
  const points: LatLngLiteral[] = [];

  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte = 0;

    do {
      if (index >= encoded.length) {
        return points;
      }

      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    latitude +=
      result & 1
        ? ~(result >> 1)
        : result >> 1;

    result = 0;
    shift = 0;

    do {
      if (index >= encoded.length) {
        return points;
      }

      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    longitude +=
      result & 1
        ? ~(result >> 1)
        : result >> 1;

    points.push({
      lat: latitude / 1e5,
      lng: longitude / 1e5,
    });
  }

  return points;
}