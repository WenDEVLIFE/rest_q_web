"use client";

export class KMLService {
  static async parseKML(kmlText: string) {
    const parser = new DOMParser();
    const kml = parser.parseFromString(kmlText, 'text/xml');
    
    const placemarks = kml.getElementsByTagName('Placemark');
    const segments = [];

    for (let i = 0; i < placemarks.length; i++) {
        const p = placemarks[i];
        const name = p.getElementsByTagName('name')[0]?.textContent || `Segment ${i}`;
        const lineString = p.getElementsByTagName('LineString')[0];
                const point = p.getElementsByTagName('Point')[0];
        
        if (lineString) {
            const coordsText = lineString.getElementsByTagName('coordinates')[0]?.textContent || "";
            const coords = coordsText.trim().split(/\s+/).map(c => {
                const [lng, lat] = c.split(',').map(Number);
                return [lat, lng] as [number, number];
            });

            const center: [number, number] = coords.length > 0 
                ? [coords[Math.floor(coords.length / 2)][0], coords[Math.floor(coords.length / 2)][1]]
                : [0, 0];
            
            segments.push({
                id: p.getAttribute('id') || `seg-${i}`,
                name,
                path: coords,
                center,
                status: 'fluid', // Default status from KML
                type: 'road'
            });
        } else if (point) {
            const coordsText = point.getElementsByTagName('coordinates')[0]?.textContent || '';
            const [lng, lat] = coordsText.trim().split(',').map(Number);

            if (Number.isFinite(lat) && Number.isFinite(lng)) {
                segments.push({
                    id: p.getAttribute('id') || `seg-${i}`,
                    name,
                    path: [],
                    center: [lat, lng] as [number, number],
                    status: 'fluid',
                    type: 'point'
                });
            }
        }
    }
    return segments;
  }
}
