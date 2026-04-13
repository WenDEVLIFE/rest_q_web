import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // GDACS RSS/XML Feed is the most reliable free source for active disasters
    const response = await fetch('https://www.gdacs.org/xml/rss.xml', {
      next: { revalidate: 300 } // Cache for 5 minutes
    });
    
    const xmlText = await response.text();
    
    // Simple parsing for TC (Tropical Cyclones) in the official Philippine region or global
    // In a production app, we'd use a full XML parser, but here we can use regex/string methods
    // to find <item> tags with <gdacs:eventtype>TC</gdacs:eventtype>
    
    const items = xmlText.split('<item>');
    const cyclones = items.filter(item => item.includes('TC</gdacs:eventtype>')).map(item => {
      const name = item.match(/<title>(.*?)<\/title>/)?.[1] || 'Unnamed Storm';
      const lat = item.match(/<geo:lat>(.*?)<\/geo:lat>/)?.[1];
      const lng = item.match(/<geo:long>(.*?)<\/geo:long>/)?.[1];
      const speed = item.match(/<gdacs:severity val="(.*?)"/)?.[1] || '0';
      const type = item.match(/<gdacs:eventname>(.*?)<\/gdacs:eventname>/)?.[1] || 'Tropical Cyclone';
      
      return {
        name,
        lat: parseFloat(lat || '15.0'),
        lng: parseFloat(lng || '120.0'),
        speed: parseFloat(speed),
        type,
        isLive: true
      };
    }).filter(c => c.name !== 'Unnamed Storm');

    // Return the latest active cyclone, or a null/simulated state if none are active
    if (cyclones.length > 0) {
      return NextResponse.json({
        success: true,
        data: cyclones[0], // Focus on the primary active storm
        all: cyclones
      });
    }

    return NextResponse.json({
      success: true,
      data: null, // No active typhoons
      message: "Clear skies - No active tropical cyclones in the region."
    });

  } catch (error) {
    console.error('Typhoon API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch meteorological data' }, { status: 500 });
  }
}
