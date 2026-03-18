/**
 * Helper to extract compatibility features for logging
 * 
 * Fetches necessary data (sessions, profiles) and extracts features
 * for ML training data collection.
 */

import { extractCompatibilityFeatures } from "../features/compatibility-features";
import { CompatibilityFeatures, MatchType } from "../utils/ml-types";
import { ensureRedisConnection } from "@/lib/redis";
import { createClient } from "@supabase/supabase-js";
import { getCoordinatesForLocation } from "@/lib/geocoding";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

type SoloSession = {
  userId: string;
  destination?: { lat: number; lon: number; name?: string };
  budget?: number;
  startDate?: string;
  endDate?: string;
  interests?: string[];
  static_attributes?: {
    age?: number;
    interests?: string[];
    personality?: string;
    location?: { lat: number; lon: number };
    smoking?: string;
    drinking?: string;
    religion?: string;
  };
};

/**
 * Get user session from Redis by Clerk ID
 */
async function getUserSession(clerkUserId: string): Promise<SoloSession | null> {
  try {
    const redisClient = await ensureRedisConnection();
    const sessionJSON = await redisClient.get(`session:${clerkUserId}`);
    if (!sessionJSON) return null;
    return JSON.parse(sessionJSON) as SoloSession;
  } catch (error) {
    console.error("Error fetching user session for logging:", error);
    return null;
  }
}

/**
 * Get user profile data from Supabase
 */
async function getUserProfile(userId: string): Promise<any> {
  try {
    // First, get the user's Clerk ID if userId is a UUID
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    let userUuid = userId;
    let clerkUserId = userId;

    if (uuidRegex.test(userId)) {
      // It's a UUID, get Clerk ID
      const { data: userData } = await supabaseAdmin
        .from("users")
        .select("clerk_user_id")
        .eq("id", userId)
        .single();
      if (userData?.clerk_user_id) {
        clerkUserId = userData.clerk_user_id;
      }
      userUuid = userId;
    } else {
      // It's a Clerk ID, get UUID
      const { data: userData } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("clerk_user_id", userId)
        .single();
      if (userData?.id) {
        userUuid = userData.id;
      }
    }

    // Get profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("age, interests, personality, location")
      .eq("user_id", userUuid)
      .single();

    return {
      profile,
      clerkUserId,
      userUuid,
    };
  } catch (error) {
    console.error("Error fetching user profile for logging:", error);
    return null;
  }
}

/**
 * Extract compatibility features for logging a solo match outcome
 */
export async function extractFeaturesForSoloMatch(
  userClerkId: string,
  targetClerkId: string,
  destinationId: string
): Promise<CompatibilityFeatures | null> {
  try {
    // Get both user sessions from Redis
    const userSession = await getUserSession(userClerkId);
    const targetSession = await getUserSession(targetClerkId);

    if (!userSession || !targetSession) {
      console.warn("Could not fetch sessions for feature extraction");
      return null;
    }

    // Get profile data for static attributes
    const userProfileData = await getUserProfile(userClerkId);
    const targetProfileData = await getUserProfile(targetClerkId);

    // Build SoloLike objects for feature extraction
    const userLike = {
      destination: userSession.destination,
      startDate: userSession.startDate,
      endDate: userSession.endDate,
      budget: userSession.budget,
      static_attributes: {
        age: userProfileData?.profile?.age,
        interests: userProfileData?.profile?.interests || userSession.interests,
        personality: userProfileData?.profile?.personality,
        location: userProfileData?.profile?.location,
      },
    };

    const targetLike = {
      destination: targetSession.destination,
      startDate: targetSession.startDate,
      endDate: targetSession.endDate,
      budget: targetSession.budget,
      static_attributes: {
        age: targetProfileData?.profile?.age,
        interests: targetProfileData?.profile?.interests || targetSession.interests,
        personality: targetProfileData?.profile?.personality,
        location: targetProfileData?.profile?.location,
      },
    };

    // Extract features
    return extractCompatibilityFeatures("user_user", userLike, targetLike);
  } catch (error) {
    console.error("Error extracting features for solo match:", error);
    return null;
  }
}

/**
 * Extract compatibility features for logging a group match outcome
 * Note: Group matching feature extraction can be added later
 */
export async function extractFeaturesForGroupMatch(
  userClerkId: string,
  groupId: string,
  destinationId: string
): Promise<CompatibilityFeatures | null> {
  try {
    // Get user session
    const userSession = await getUserSession(userClerkId);
    if (!userSession) {
      console.warn("Could not fetch user session for group match feature extraction");
      return null;
    }

    // Get user profile
    const userProfileData = await getUserProfile(userClerkId);

    // Get group data
    const { data: groupData } = await supabaseAdmin
      .from("groups")
      .select("destination, start_date, end_date, budget, average_age, top_interests, dominant_languages, dominant_nationalities, members_count")
      .eq("id", groupId)
      .single();

    if (!groupData) {
      console.warn("Could not fetch group data for feature extraction");
      return null;
    }

    // Convert destination string to coordinates
    const destinationCoords = await getCoordinatesForLocation(groupData.destination);
    if (!destinationCoords) {
      console.warn("Could not get coordinates for group destination");
      return null;
    }

    // Build SoloLike for user
    const userLike = {
      destination: userSession.destination,
      startDate: userSession.startDate,
      endDate: userSession.endDate,
      budget: userSession.budget,
      static_attributes: {
        age: userProfileData?.profile?.age,
        interests: userProfileData?.profile?.interests || userSession.interests,
        personality: userProfileData?.profile?.personality,
        location: userProfileData?.profile?.location,
      },
    };

    // Build GroupLike for target
    const groupLike = {
      destination: destinationCoords,
      startDate: groupData.start_date,
      endDate: groupData.end_date,
      averageBudget: groupData.budget, // groups.budget is the average budget
      averageAge: groupData.average_age,
      topInterests: groupData.top_interests || [],
      dominantLanguages: groupData.dominant_languages || [],
      dominantNationalities: groupData.dominant_nationalities || [],
      size: groupData.members_count,
    };

    // Extract features
    return extractCompatibilityFeatures("user_group", userLike, groupLike);
  } catch (error) {
    console.error("Error extracting features for group match:", error);
    return null;
  }
}

