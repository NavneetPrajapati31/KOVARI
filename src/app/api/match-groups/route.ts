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
    const { destination, budget, startDate, endDate, userId, age, languages, interests, smoking, drinking, nationality } = data;

    if (!destination || !budget || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields: destination, budget, startDate, endDate" }, { status: 400 });
    }

    // Get coordinates for user's destination
    let userDestinationCoords: Location;
    if (typeof destination === 'string') {
      const coords = await getCoordinatesForLocation(destination);
      if (!coords) {
        return NextResponse.json({ error: "Could not find coordinates for the specified destination" }, { status: 400 });
      }
      userDestinationCoords = coords;
    } else {
      userDestinationCoords = destination;
    }

    // Create a user profile with default values for missing fields
    const userProfile: UserProfile = {
      userId: userId || 'anonymous', // Use anonymous if no userId provided
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

    const supabase = createRouteHandlerSupabaseClient();

    // Fetch groups with all necessary fields from the schema
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
        non_smokers,
        non_drinkers,
        dominant_languages,
        top_interests,
        average_age,
        members_count
      `);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!groups || groups.length === 0) {
      return NextResponse.json({ groups: [] });
    }

    // Get coordinates for all group destinations and filter by distance
    const groupsWithCoords: GroupWithCoords[] = [];
    for (const group of groups) {
      if (group.destination) {
        const groupCoords = await getCoordinatesForLocation(group.destination);
        if (groupCoords) {
          const distance = calculateDistance(userDestinationCoords, groupCoords);
          if (distance <= 200) { // Only include groups within 200km
            groupsWithCoords.push({
              ...group,
              destinationCoords: groupCoords,
              distance
            });
          }
        }
      }
    }

    if (groupsWithCoords.length === 0) {
      return NextResponse.json({ groups: [] });
    }

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

    // Transform groups into the expected format
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

    const matches = findGroupMatchesForUser(userProfile, groupProfiles);

    // Transform the results to include group details
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
      };
    });

    return NextResponse.json({ groups: safeMatches });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
