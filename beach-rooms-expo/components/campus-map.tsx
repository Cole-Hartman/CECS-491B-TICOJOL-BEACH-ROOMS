import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapboxGL, { MapView } from '@rnmapbox/maps';
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

  const mapRef = useRef<MapView>(null);

  const hidePOILabels = () => {
    const map = mapRef.current;
    if (!map) return;
    try {
      map.setSourceVisibility(false, 'composite', 'poi_label');
      map.setSourceVisibility(false, 'composite', 'natural_label');
      map.setSourceVisibility(false, 'composite', 'transit_label');
    } catch (err) {
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
        styleURL={MapboxGL.StyleURL.Street}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
        scaleBarEnabled={false}
        pitchEnabled={true}
        rotateEnabled={true}
        onDidFinishLoadingMap={hidePOILabels}
      >
        <MapboxGL.Camera
          defaultSettings={{
            centerCoordinate: CSULB_CENTER,
            zoomLevel: CSULB_DEFAULT_ZOOM,
            pitch: 32,
            heading: 0,
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
            fillExtrusionColor: 'hsl(40, 43%, 93%)',
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
              {/* Glow ring */}
              <MapboxGL.CircleLayer
                  id="building-glow"
                  style={{
                      // Interpolate radius based on zoom level
                      circleRadius: [
                          'interpolate',
                          ['linear'],
                          ['zoom'],
                          13, 6,  // At zoom level 13 (zoomed out), radius is 6
                          18, 16, // At zoom level 18 (zoomed in), radius is 16
                      ],
                      circleBlur: 1.5,
                      circleOpacity: 0.7,
                      circleColor: [
                          'case',
                          ['get', 'hasAvailableRoom'],
                          '#00ff66',
                          '#ef4444',
                      ],
                      circlePitchAlignment: 'map',
                  }}
              />

              {/* Solid dot */}
              <MapboxGL.CircleLayer
                  id="building-dot"
                  style={{
                      // Interpolate radius based on zoom level
                      circleRadius: [
                          'interpolate',
                          ['linear'],
                          ['zoom'],
                          13, 3,   // At zoom level 13, radius is 3
                          18, 6,   // At zoom level 18, radius is 6
                      ],
                      circleColor: [
                          'case',
                          ['get', 'hasAvailableRoom'],
                          '#39ff78',
                          '#ef4444',
                      ],
                      circlePitchAlignment: 'map',
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
