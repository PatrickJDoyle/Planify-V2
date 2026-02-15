import { create } from 'zustand';

interface MapViewport {
  latitude: number;
  longitude: number;
  zoom: number;
}

interface MapStore {
  viewport: MapViewport;
  setViewport: (viewport: MapViewport) => void;
  selectedMarkerId: number | null;
  setSelectedMarkerId: (id: number | null) => void;
}

// Default: centered on Ireland
const DEFAULT_VIEWPORT: MapViewport = {
  latitude: 53.4129,
  longitude: -7.6921,
  zoom: 7,
};

export const useMapStore = create<MapStore>((set) => ({
  viewport: DEFAULT_VIEWPORT,
  setViewport: (viewport) => set({ viewport }),
  selectedMarkerId: null,
  setSelectedMarkerId: (id) => set({ selectedMarkerId: id }),
}));
