import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase";
import { findGroupMatchesForUser } from "@/lib/matching/group";
import { getCoordinatesForLocation } from "@/lib/geocoding";

// Define the types based on what the matching function expects
interface Location {
  lat: number;
  lon: number;
}

interface UserProfile {
  userId: string;
  destination: Location;
  budget: number;
  startDate: string;
  endDate: string;
  age: number;
  languages: string[];
  interests: string[];
  smoking: boolean;
  drinking: boolean;
  nationality: string;
}

interface GroupProfile {
  groupId: string;
  name: string;
  destination: Location;
  averageBudget: number;
  startDate: string;
  endDate: string;
  averageAge: number;
  dominantLanguages: string[];
  topInterests: string[];
  smokingPolicy: 'Smokers Welcome' | 'Mixed' | 'Non-Smoking';
  drinkingPolicy: 'Drinkers Welcome' | 'Mixed' | 'Non-Drinking';
  dominantNationalities: string[];
}

interface GroupWithCoords {
  id: string;
  name: string;
  destination: string;
  budget: number;
  start_date: string;
  end_date: string;
  creator_id: string;
  destination_lat: number | null;
  destination_lon: number | null;
  non_smokers: boolean | null;
  non_drinkers: boolean | null;
  dominant_languages: string[] | null;
  top_interests: string[] | null;
  average_age: number | null;
  members_count: number;
  destinationCoords: Location;
  distance: number;
}

/**
 * Calculates distance between two locations using Haversine formula
 */
const calculateDistance = (loc1: Location, loc2: Location): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (loc2.lat - loc1.lat) * (Math.PI / 180);
  const dLon = (loc2.lon - loc1.lon) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + 
            Math.cos(loc1.lat * (Math.PI / 180)) * Math.cos(loc2.lat * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { 
      destination, 
      budget, 
      startDate, 
      endDate, 
      userId, 
      age, 
      languages, 
      interests, 
      smoking, 
      drinking, 
      nationality 
    } = data;
    
    console.log("Received request data:", {
      destination,
      budget,
      startDate,
      endDate,
      userId,
      age,
      languages,
      interests,
      smoking,
      drinking,
      nationality
    });

    if (!destination || !budget || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields: destination, budget, startDate, endDate" }, { status: 400 });
    }

    // Get coordinates for user's destination
    let userDestinationCoords: Location;
    if (typeof destination === 'string') {
      const destinationString = destination.trim();
      if (!destinationString) {
        return NextResponse.json({ 
          error: "Invalid destination", 
          details: "Destination cannot be empty" 
        }, { status: 400 });
      }

      console.log("Getting coordinates for destination:", destinationString);
      const coords = await getCoordinatesForLocation(destinationString);
      if (!coords) {
        console.error("Could not find coordinates for destination:", destinationString);
        return NextResponse.json({ 
          error: "Could not find coordinates for the specified destination", 
          details: `The location "${destinationString}" could not be found. Please check the spelling or try a more specific location name (e.g., "Paris, France" instead of just "Paris").`,
          destination: destinationString
        }, { status: 400 });
      }
      console.log("Found coordinates for destination:", coords);
      userDestinationCoords = coords;
    } else if (destination && typeof destination === 'object' && 'lat' in destination && 'lon' in destination) {
      // Validate coordinates object
      const lat = Number(destination.lat);
      const lon = Number(destination.lon);
      if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        return NextResponse.json({ 
          error: "Invalid coordinates", 
          details: "Provided coordinates are invalid. Latitude must be between -90 and 90, longitude must be between -180 and 180." 
        }, { status: 400 });
      }
      console.log("Destination is already coordinates:", destination);
      userDestinationCoords = { lat, lon };
    } else {
      return NextResponse.json({ 
        error: "Invalid destination format", 
        details: "Destination must be either a string (location name) or an object with lat and lon properties." 
      }, { status: 400 });
    }

    // Create a user profile with provided filter data or defaults
    const userProfile: UserProfile = {
      userId: userId || 'anonymous',
      destination: userDestinationCoords,
      budget: Number(budget),
      startDate,
      endDate,
      age: age || 25,
      languages: languages || ['English'],
      interests: interests || [],
      smoking: smoking || false,
      drinking: drinking || false,
      nationality: nationality || 'Unknown',
    };
    
    console.log("User profile for matching:", userProfile);

    const supabase = createRouteHandlerSupabaseClient();

    // Fetch groups with all necessary fields from the schema
    console.log("Fetching groups from database...");
    const { data: groups, error } = await supabase
      .from('groups')
      .select(`
        id,
        name,
        destination,
        budget,
        start_date,
        end_date,
        creator_id,
        destination_lat,
        destination_lon,
        non_smokers,
        non_drinkers,
        dominant_languages,
        top_interests,
        average_age,
        members_count
      `);

    if (error) {
      console.error("Database error fetching groups:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!groups || groups.length === 0) {
      console.log("No groups found in database");
      return NextResponse.json({ groups: [] });
    }
    
    console.log(`Found ${groups.length} groups in database:`, groups);

    // Get coordinates for all group destinations and filter by distance
    console.log("Processing group destinations for coordinates...");
    const groupsWithCoords: GroupWithCoords[] = [];
    for (const group of groups) {
      if (group.destination) {
        const hasStoredCoords =
          typeof group.destination_lat === "number" &&
          typeof group.destination_lon === "number";

        const groupCoords = hasStoredCoords
          ? { lat: group.destination_lat as number, lon: group.destination_lon as number }
          : await getCoordinatesForLocation(group.destination);

        if (!groupCoords) {
          console.log(`Could not get coordinates for group ${group.id} destination: ${group.destination}`);
          continue;
        }

        if (!hasStoredCoords) {
          // Persist coordinates so future searches can reuse them
          await supabase
            .from("groups")
            .update({
              destination_lat: groupCoords.lat,
              destination_lon: groupCoords.lon,
            })
            .eq("id", group.id);
        }

        const distance = calculateDistance(userDestinationCoords, groupCoords);
        console.log(`Group ${group.id} is ${distance.toFixed(2)}km away`);
        if (distance <= 200) {
          groupsWithCoords.push({
            ...group,
            destinationCoords: groupCoords,
            distance,
          });
        } else {
          console.log(`Group ${group.id} is too far (${distance.toFixed(2)}km > 200km)`);
        }
      } else {
        console.log(`Group ${group.id} has no destination`);
      }
    }

    if (groupsWithCoords.length === 0) {
      console.log("No groups found within 200km distance");
      return NextResponse.json({ groups: [] });
    }
    
    console.log(`Found ${groupsWithCoords.length} groups within distance limit:`, groupsWithCoords);

    // Get creator profiles for nationality information
    const creatorIds = [...new Set(groupsWithCoords.map(g => g.creator_id))];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, name, username, profile_photo, nationality')
      .in('user_id', creatorIds);

    if (profilesError) {
      console.error("Error fetching creator profiles:", profilesError);
    }

    // Create a map of profiles by user_id
    const profilesMap = (profiles || []).reduce((acc: any, profile) => {
      acc[profile.user_id] = profile;
      return acc;
    }, {});

    // Transform groups into the expected format for matching
    console.log("Transforming groups into profiles for matching...");
    const groupProfiles: GroupProfile[] = groupsWithCoords.map((group: any) => {
      const creator = profilesMap[group.creator_id];
      
      // Determine smoking policy based on group's non_smokers boolean field
      let smokingPolicy: 'Smokers Welcome' | 'Mixed' | 'Non-Smoking';
      if (group.non_smokers === true) {
        smokingPolicy = 'Non-Smoking';
      } else if (group.non_smokers === false) {
        smokingPolicy = 'Smokers Welcome';
      } else {
        smokingPolicy = 'Mixed'; // Default to mixed if null
      }
      
      // Determine drinking policy based on group's non_drinkers boolean field
      let drinkingPolicy: 'Drinkers Welcome' | 'Mixed' | 'Non-Drinking';
      if (group.non_drinkers === true) {
        drinkingPolicy = 'Non-Drinking';
      } else if (group.non_drinkers === false) {
        drinkingPolicy = 'Drinkers Welcome';
      } else {
        drinkingPolicy = 'Mixed'; // Default to mixed if null
      }
      
      return {
        groupId: group.id,
        name: group.name || 'Unknown Group',
        destination: group.destinationCoords,
        averageBudget: Number(group.budget) || 0,
        startDate: group.start_date || '',
        endDate: group.end_date || '',
        averageAge: Number(group.average_age) || 25,
        dominantLanguages: group.dominant_languages || ['English'],
        topInterests: group.top_interests || [],
        smokingPolicy,
        drinkingPolicy,
        dominantNationalities: creator?.nationality ? [creator.nationality] : [],
      };
    });
    
    console.log(`Created ${groupProfiles.length} group profiles for matching:`, groupProfiles);

    // Use the group matching algorithm to get scored matches
    const matches = findGroupMatchesForUser(userProfile, groupProfiles);
    console.log(`Matching algorithm returned ${matches.length} matches:`, matches);

    // Transform the results to include group details and maintain distance info
    const safeMatches = matches.map((match) => {
      const originalGroup = groupsWithCoords.find(g => g.id === match.group.groupId);
      const creator = originalGroup ? profilesMap[originalGroup.creator_id] : null;
      
      // Format dates properly
      const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Not specified';
        try {
          return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        } catch {
          return 'Invalid date';
        }
      };
      
      return {
        id: match.group.groupId,
        name: match.group.name,
        destination: originalGroup?.destination || 'Unknown Destination',
        budget: match.group.averageBudget,
        startDate: formatDate(originalGroup?.start_date || null),
        endDate: formatDate(originalGroup?.end_date || null),
        score: match.score,
        breakdown: match.breakdown,
        members: originalGroup?.members_count || 0,
        distance: originalGroup?.distance || 0,
        creator: {
          name: creator?.name || "Unknown",
          username: creator?.username || "unknown",
          avatar: creator?.profile_photo || "",
        },
        tags: match.group.topInterests || [],
      };
    });

    console.log(`Returning ${safeMatches.length} final matches:`, safeMatches);
    return NextResponse.json({ groups: safeMatches });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
