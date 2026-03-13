export const MAPBOX_ACCESS_TOKEN =
  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '';

// CSULB campus center coordinates [longitude, latitude]
export const CSULB_CENTER: [number, number] = [-118.116491, 33.780516];
export const CSULB_DEFAULT_ZOOM = 16;

// Bounding box for offline tile pack (slightly larger than campus)
export const CSULB_BOUNDS = {
  ne: [-118.104, 33.792] as [number, number],
  sw: [-118.124, 33.773] as [number, number],
};
