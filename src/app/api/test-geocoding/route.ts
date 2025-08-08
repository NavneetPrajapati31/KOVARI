import { NextRequest, NextResponse } from 'next/server';
import { getCoordinatesForLocation } from '../../../lib/geocoding';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const location = searchParams.get('location');

        if (!location) {
            return NextResponse.json({ error: 'Location parameter is required' }, { status: 400 });
        }

        console.log(`Testing geocoding for: ${location}`);
        const coordinates = await getCoordinatesForLocation(location);

        if (coordinates) {
            return NextResponse.json({ 
                location, 
                coordinates,
                message: 'Geocoding successful' 
            });
        } else {
            return NextResponse.json({ 
                location, 
                coordinates: null,
                message: 'Location not found' 
            }, { status: 404 });
        }

    } catch (error) {
        console.error('Error in test-geocoding:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 