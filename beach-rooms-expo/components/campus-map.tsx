import { useEffect, useMemo, useRef } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import MapboxGL, { MapView } from '@rnmapbox/maps';
import type { FeatureCollection, Point } from 'geojson';
import {
  MAPBOX_ACCESS_TOKEN,
  CSULB_CENTER,
  CSULB_DEFAULT_ZOOM,
  CSULB_BOUNDS,
} from '@/constants/mapbox';
import type { BuildingPin } from '@/hooks/use-building-pins';

const pinGreen = Image.resolveAssetSource(require('@/assets/images/pin-green.png'));
const pinRed = Image.resolveAssetSource(require('@/assets/images/pin-red.png'));

MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);

interface CampusMapProps {
  buildingPins: BuildingPin[];
  focusBuildingId?: string | null;
  onBuildingPress: (buildingId: string) => void;
}

export function CampusMap({ buildingPins, focusBuildingId, onBuildingPress }: CampusMapProps) {
  // Download offline tile pack for CSULB campus
  useEffect(() => {
    const downloadOfflinePack = async () => {
      try {
        const existing = await MapboxGL.offlineManager.getPack('csulb-campus');
        if (existing) return;
        await MapboxGL.offlineManager.createPack(
          {
            name: 'csulb-campus',
            styleURL: 'mapbox://styles/josephsong23/cmip4pzo400e501st3fdjay4h',
            bounds: [CSULB_BOUNDS.ne, CSULB_BOUNDS.sw],
            minZoom: 14,
            maxZoom: 18,
          },
          (_region, status) => {
            if (status?.percentage === 100) {
              console.log('Offline pack download complete');
            }
          },
          (_region, error) => {
            console.warn('Offline pack error:', error);
          }
        );
      } catch (err) {
        console.warn('Failed to create offline pack:', err);
      }
    };

    downloadOfflinePack();
  }, []);

  // Convert building pins to GeoJSON for native rendering
  const geojson = useMemo<FeatureCollection<Point>>(() => ({
    type: 'FeatureCollection',
    features: buildingPins.map((pin) => ({
      type: 'Feature',
      id: pin.id,
      properties: {
        id: pin.id,
        code: pin.code,
        name: pin.name,
        hasAvailableRoom: pin.hasAvailableRoom,
        availableCount: pin.availableCount,
        totalRooms: pin.totalRooms,
      },
      geometry: {
        type: 'Point',
        coordinates: [pin.longitude, pin.latitude],
      },
    })),
  }), [buildingPins]);

  const mapRef = useRef<MapView>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);

  useEffect(() => {
    if (!focusBuildingId || !cameraRef.current) return;
    const pin = buildingPins.find((p) => p.id === focusBuildingId);
    if (pin) {
      cameraRef.current.setCamera({
        centerCoordinate: [pin.longitude, pin.latitude],
        zoomLevel: 17,
        animationDuration: 800,
      });
    }
  }, [focusBuildingId, buildingPins]);

  const hidePOILabels = () => {
    const map = mapRef.current;
    if (!map) return;
    try {
      // Try to hide labels from mapbox-streets source we added
      map.setSourceVisibility(false, 'mapbox-streets', 'poi_label');
      map.setSourceVisibility(false, 'mapbox-streets', 'natural_label');
      map.setSourceVisibility(false, 'mapbox-streets', 'transit_label');
    } catch (err) {
      // Labels may be controlled by the custom style in Mapbox Studio
      console.warn('Failed to hide POI labels:', err);
    }
  };

  const handlePress = (event: any) => {
    const feature = event?.features?.[0];
    if (feature?.properties?.id) {
      onBuildingPress(feature.properties.id);
    }
  };

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        ref={mapRef}
        style={styles.map}
        styleURL="mapbox://styles/josephsong23/cmip4pzo400e501st3fdjay4h"
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
        scaleBarEnabled={false}
        pitchEnabled={true}
        rotateEnabled={true}
        onDidFinishLoadingMap={hidePOILabels}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: CSULB_CENTER,
            zoomLevel: CSULB_DEFAULT_ZOOM,
            pitch: 59.00,
            heading: -58.40,
          }}
          minZoomLevel={14}
          maxZoomLevel={18}
          maxBounds={{
            ne: CSULB_BOUNDS.ne,
            sw: CSULB_BOUNDS.sw,
          }}
        />

{/* 3D building extrusions - using mapbox-streets vector source */}
        <MapboxGL.VectorSource
          id="mapbox-streets"
          url="mapbox://mapbox.mapbox-streets-v8"
        >
          <MapboxGL.FillExtrusionLayer
            id="3d-buildings"
            sourceLayerID="building"
            filter={['==', 'extrude', 'true']}
            minZoomLevel={14}
            style={{
              fillExtrusionColor: 'hsl(40, 43%, 93%)',
              fillExtrusionHeight: ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'height']],
              fillExtrusionBase: ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'min_height']],
              fillExtrusionOpacity: 0.6,
            }}
          />
        </MapboxGL.VectorSource>

          <MapboxGL.ShapeSource
              id="building-pins"
              shape={geojson}
              onPress={handlePress}
          >
              <MapboxGL.Images
                images={{
                  'pin-green': pinGreen,
                  'pin-red': pinRed,
                }}
              />

              {/* Pin icons */}
              <MapboxGL.SymbolLayer
                  id="building-pins-icon"
                  style={{
                      iconImage: [
                          'case',
                          ['get', 'hasAvailableRoom'],
                          'pin-green',
                          'pin-red',
                      ],
                      iconSize: [
                          'interpolate',
                          ['linear'],
                          ['zoom'],
                          13, 0.15,
                          18, 0.4,
                      ],
                      iconAllowOverlap: true,
                      iconPitchAlignment: 'viewport',
                  }}
              />

              {/* Building code labels */}
              <MapboxGL.SymbolLayer
                  id="building-labels"
                  style={{
                      textField: ['get', 'code'],
                      // Interpolate text size based on zoom level
                      textSize: [
                          'interpolate',
                          ['linear'],
                          ['zoom'],
                          13, 8, // At zoom level 13 (zoomed out), font size is 10
                          18, 14, // At zoom level 18 (zoomed in), font size is 14
                      ],
                      textFont: ['DIN Pro Bold'],
                      textColor: '#2E3135',
                      textHaloColor: '#ffffff',
                      textHaloWidth: 1.2,
                      textOffset: [0, 1.5],
                      textAllowOverlap: true,
                      iconAllowOverlap: true,
                  }}
              />
          </MapboxGL.ShapeSource>
      </MapboxGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
