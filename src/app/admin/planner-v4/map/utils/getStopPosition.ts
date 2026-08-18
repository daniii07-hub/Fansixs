import type {
  RouteStop,
} from "../../routing";
import type {
  LatLngLiteral,
} from "./decodePolyline";

export function getStopPosition(
  stop: RouteStop,
): LatLngLiteral | null {
  if (!stop.coordinate) {
    return null;
  }

  const {
    latitude,
    longitude,
  } = stop.coordinate;

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return {
    lat: latitude,
    lng: longitude,
  };
}