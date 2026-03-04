import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import type { FeatureCollection, Point } from 'geojson';

import {
  MAPBOX_ACCESS_TOKEN,
  CSULB_CENTER,
  CSULB_DEFAULT_ZOOM,
  CSULB_BOUNDS,
} from '@/constants/mapbox';
import type { BuildingPin } from '@/hooks/use-building-pins';

MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);

interface CampusMapProps {
  buildingPins: BuildingPin[];
  onBuildingPress: (buildingId: string) => void;
}

export function CampusMap({ buildingPins, onBuildingPress }: CampusMapProps) {
  // Download offline tile pack for CSULB campus
  useEffect(() => {
    const downloadOfflinePack = async () => {
      try {
        await MapboxGL.offlineManager.createPack(
          {
            name: 'csulb-campus',
            styleURL: MapboxGL.StyleURL.Street,
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

  const handlePress = (event: any) => {
    const feature = event?.features?.[0];
    if (feature?.properties?.id) {
      onBuildingPress(feature.properties.id);
    }
  };

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL={MapboxGL.StyleURL.Street}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
        pitchEnabled={true}
        rotateEnabled={true}
      >
        <MapboxGL.Camera
          defaultSettings={{
            centerCoordinate: CSULB_CENTER,
            zoomLevel: CSULB_DEFAULT_ZOOM,
            pitch: 45,
            heading: -17,
          }}
          minZoomLevel={14}
          maxZoomLevel={18}
          maxBounds={{
            ne: CSULB_BOUNDS.ne,
            sw: CSULB_BOUNDS.sw,
          }}
        />

        {/* 3D building extrusions */}
        <MapboxGL.FillExtrusionLayer
          id="3d-buildings"
          sourceID="composite"
          sourceLayerID="building"
          filter={['==', 'extrude', 'true']}
          minZoomLevel={14}
          style={{
            fillExtrusionColor: '#aaa',
            fillExtrusionHeight: ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'height']],
            fillExtrusionBase: ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'min_height']],
            fillExtrusionOpacity: 0.6,
          }}
        />

        <MapboxGL.ShapeSource
          id="building-pins"
          shape={geojson}
          onPress={handlePress}
        >
          {/* Pin circles */}
          <MapboxGL.CircleLayer
            id="building-circles"
            style={{
              circleRadius: 12,
              circleColor: [
                'case',
                ['get', 'hasAvailableRoom'],
                '#28a745',
                '#dc3545',
              ],
              circleStrokeWidth: 3,
              circleStrokeColor: '#ffffff',
            }}
          />

          {/* Building code labels */}
          <MapboxGL.SymbolLayer
            id="building-labels"
            style={{
              textField: ['get', 'code'],
              textSize: 11,
              textFont: ['DIN Pro Bold'],
              textColor: [
                'case',
                ['get', 'hasAvailableRoom'],
                '#28a745',
                '#dc3545',
              ],
              textHaloColor: '#ffffff',
              textHaloWidth: 1.5,
              textOffset: [0, 1.8],
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
