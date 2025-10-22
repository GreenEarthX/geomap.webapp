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

  let selectedPipeline: L.Path | null = null;

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

    const popupContent = props.pipeline_name ? props.pipeline_name : 'N/A';
    const tooltipContent = props.pipeline_name ? props.pipeline_name : 'N/A';

    if (feature.geometry.type === 'LineString') {
      const latlngs = feature.geometry.coordinates.map(
        ([lng, lat]) => [lat, lng] as [number, number]
      );
      const polyline = L.polyline(latlngs, { color: '#2877B2', weight: 2 })
        .bindPopup(`<div style="padding: 8px; font-family: sans-serif; font-size: 14px; font-weight: bold; color: #333;">${popupContent}</div>`)
        .bindTooltip(tooltipContent, { sticky: true })
        .on('click', () => {
          // Reset previously selected pipeline
          if (selectedPipeline) {
            selectedPipeline.setStyle({ color: '#2877B2', weight: 2 });
          }
          // Highlight clicked pipeline
          polyline.setStyle({ color: 'red', weight: 4 });
          selectedPipeline = polyline;
          // Focus map and update selected name
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
        const polyline = L.polyline(latlngs, { color: '#2877B2', weight: 2 })
          .bindPopup(`<div style="padding: 8px; font-family: sans-serif; font-size: 14px; font-weight: bold; color: #333;">${popupContent}</div>`)
          .bindTooltip(tooltipContent, { sticky: true })
          .on('click', () => {
            // Reset previously selected pipeline
            if (selectedPipeline) {
              selectedPipeline.setStyle({ color: '#2877B2', weight: 2 });
            }
            // Highlight clicked pipeline
            polyline.setStyle({ color: 'red', weight: 4 });
            selectedPipeline = polyline;
            // Focus map and update selected name
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