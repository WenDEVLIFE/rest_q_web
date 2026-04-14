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
        
        if (lineString) {
            const coordsText = lineString.getElementsByTagName('coordinates')[0]?.textContent || "";
            const coords = coordsText.trim().split(/\s+/).map(c => {
                const [lng, lat] = c.split(',').map(Number);
                return [lat, lng] as [number, number];
            });
            
            segments.push({
                id: p.getAttribute('id') || `seg-${i}`,
                name,
                path: coords,
                status: 'fluid', // Default status from KML
                type: 'road'
            });
        }
    }
    return segments;
  }
}
