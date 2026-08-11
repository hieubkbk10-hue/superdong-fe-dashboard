import { Location, Route as JourneyRoute, RouteStop } from '@/types';

export const unwrapData = <T,>(value: T | { data?: T } | undefined): T | undefined => {
  if (!value) return undefined;
  if (typeof value === 'object' && value !== null && 'data' in value) return (value as { data?: T }).data;
  return value as T;
};

export type StopOption = {
  location_id: string;
  stop_order: number;
  name: string;
  code: string;
};

export const getStopsArray = (route: JourneyRoute): RouteStop[] => {
  if (Array.isArray(route.stops)) return route.stops;
  return route.stops?.data || [];
};

export const normalizeRouteStops = (route: JourneyRoute, locationsById: Map<string, Location>): StopOption[] =>
  getStopsArray(route)
    .map((stop) => {
      const location = unwrapData<Location>(stop.location) || locationsById.get(String(stop.location_id));
      return {
        location_id: String(stop.location_id),
        stop_order: Number(stop.stop_order || 0),
        name: location?.name || '',
        code: location?.code || '',
      };
    })
    .sort((a, b) => a.stop_order - b.stop_order);

export const buildRouteDisplayName = (route: Pick<JourneyRoute, 'code' | 'name'> & { stops?: StopOption[] }, fallbackFromName?: string, fallbackToName?: string): string => {
  const explicitName = route.name?.trim();
  if (explicitName) return explicitName;

  const orderedStops = [...(route.stops || [])].sort((a, b) => a.stop_order - b.stop_order);
  const firstStop = orderedStops[0];
  const lastStop = orderedStops[orderedStops.length - 1];
  if (firstStop?.name && lastStop?.name) return `${firstStop.name} → ${lastStop.name}`;

  if (fallbackFromName && fallbackToName) return `${fallbackFromName} → ${fallbackToName}`;

  return route.code || 'Chưa cập nhật';
};

export const formatRouteOptionLabel = (route: Pick<JourneyRoute, 'code' | 'name'> & { stops?: StopOption[] }, fallbackFromName?: string, fallbackToName?: string): string => {
  const displayName = buildRouteDisplayName(route, fallbackFromName, fallbackToName);
  return route.code ? `${displayName} (${route.code})` : displayName;
};
