import L from 'leaflet';
import { PipelineItem, GeoJSONFeatureCollection } from '@/lib/types2';
import { generatePopupHtml } from '@/lib/map/generatePopupHtml';




export const addPipelineMarkers = (
  data: GeoJSONFeatureCollection,
  map: L.Map,
  pipelineLayer: L.FeatureGroup,
  statusColorMap: Record<string, string>,
  setSelectedPlantName: (name: string) => void
) => {
  if (!data || !Array.isArray(data.features)) {
    console.warn('Missing or invalid Pipeline data');
    return;
  }

  data.features.forEach((feature) => {
  const props = feature.properties as PipelineItem;

  // ✅ Add safety check for missing or null geometry
  if (
    !feature.geometry ||
    !['LineString', 'MultiLineString'].includes(feature.geometry.type) ||
    !feature.geometry.coordinates
  ) {
    console.warn('Skipping Pipeline feature with invalid geometry:', { feature });
    return;
  }

  const popupHtml = generatePopupHtml(props, 'Pipeline');

  if (feature.geometry.type === 'LineString') {
    const latlngs = feature.geometry.coordinates.map(
      ([lng, lat]) => [lat, lng] as [number, number]
    );

    const polyline = L.polyline(latlngs, { color: 'blue', weight: 3 })
      .bindPopup(popupHtml)
      .on('click', () => {
        if (props.pipeline_name) {
          setSelectedPlantName(props.pipeline_name);
          if (latlngs.length > 0) {
            map.setView(latlngs[0], 7);
          }
        }
      });

    pipelineLayer.addLayer(polyline);
  }

  if (feature.geometry.type === 'MultiLineString') {
    feature.geometry.coordinates.forEach((line) => {
      const latlngs = line.map(([lng, lat]) => [lat, lng] as [number, number]);

      const polyline = L.polyline(latlngs, { color: 'blue', weight: 4 })
        .bindPopup(popupHtml)
        .on('click', () => {
          if (props.pipeline_name) {
            setSelectedPlantName(props.pipeline_name);
            if (latlngs.length > 0) {
              map.setView(latlngs[0], 7);
            }
          }
        });

      pipelineLayer.addLayer(polyline);
    });
  }
});

};
