import { Transformer } from "@/types/api";
import { profileMapper } from "../mappers/profileMapper";

export interface GroupDTO {
  id: string;
  name: string;
  destination: string;
  memberCount: number;
  score: number;
  startDate?: string;
  endDate?: string;
  budget?: number;
  creator?: any;
  membersCount?: number; // Legacy compat
  [key: string]: any;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

function resolveCoverImage(groupData: any, g: any): string {
  return (
    groupData.cover_image ||
    g.cover_image ||
    groupData.coverImage ||
    g.coverImage ||
    groupData.image ||
    g.image ||
    ""
  ).toString();
}

function resolveSmokingPolicy(groupData: any, g: any): string | null {
  const explicit =
    groupData.smokingPolicy ||
    g.smokingPolicy ||
    groupData.smoking_policy ||
    g.smoking_policy;
  if (explicit) return String(explicit);
  if (groupData.non_smokers === true || g.non_smokers === true) {
    return "Non-smokers preferred";
  }
  return null;
}

function resolveDrinkingPolicy(groupData: any, g: any): string | null {
  const explicit =
    groupData.drinkingPolicy ||
    g.drinkingPolicy ||
    groupData.drinking_policy ||
    g.drinking_policy;
  if (explicit) return String(explicit);
  if (groupData.non_drinkers === true || g.non_drinkers === true) {
    return "Non-drinkers preferred";
  }
  return null;
}

export class GroupTransformer implements Transformer<any, GroupDTO> {
  toStandard(g: any): GroupDTO {
    // 1. Handle double-nesting from Go Service: { group: { groupId... }, score: ... }
    const groupData = g.group || g;

    // 2. Identify strict ID (Contract Authority)
    const id = (groupData.groupId || groupData.id || g.id || g.groupId || "").toString();

    if (!id) {
      throw new Error("Invalid group data: Missing id/groupId");
    }

    // 3. Normalize Creator via profileMapper
    let creator = null;
    if (groupData.creator || g.creator) {
      const rawCreator = groupData.creator || g.creator;
      const creatorUserRow = { id: rawCreator.userId || rawCreator.id, ...rawCreator };
      const creatorDto = profileMapper.fromDb(creatorUserRow, rawCreator);
      creator = {
        userId: creatorDto.id,
        name: creatorDto.displayName,
        username: creatorDto.username,
        avatar: creatorDto.avatar,
        age: creatorDto.age,
        gender: creatorDto.gender,
        location: creatorDto.location,
        bio: creatorDto.bio,
        interests: creatorDto.interests,
        languages: creatorDto.languages,
        nationality: creatorDto.nationality,
        religion: creatorDto.religion,
        profession: creatorDto.profession,
        smoking: creatorDto.smoking,
        drinking: creatorDto.drinking,
        personality: creatorDto.personality,
        foodPreference: creatorDto.foodPreference,
      };
    }

    const coverImage = resolveCoverImage(groupData, g);
    const startDate =
      groupData.startDate ||
      g.startDate ||
      groupData.start_date ||
      g.start_date ||
      null;
    const endDate =
      groupData.endDate ||
      g.endDate ||
      groupData.end_date ||
      g.end_date ||
      null;
    const tags = asStringArray(
      groupData.tags ??
        g.tags ??
        groupData.topInterests ??
        g.topInterests ??
        groupData.top_interests ??
        g.top_interests ??
        groupData.interests ??
        g.interests,
    );
    const languages = asStringArray(
      groupData.languages ??
        g.languages ??
        groupData.dominantLanguages ??
        g.dominantLanguages ??
        groupData.dominant_languages ??
        g.dominant_languages,
    );
    const smokingPolicy = resolveSmokingPolicy(groupData, g);
    const drinkingPolicy = resolveDrinkingPolicy(groupData, g);
    const descriptionRaw = groupData.description ?? g.description;
    const description =
      descriptionRaw == null || descriptionRaw === ""
        ? null
        : String(descriptionRaw);

    // 4. Normalized Output Construction
    return {
      id: id,
      name: (groupData.name || g.name || "Unnamed Group").toString(),
      destination: (groupData.destination?.name || groupData.destination || g.destination || "").toString(),

      // Cover image — canonical + legacy aliases for web/mobile consumers
      coverImage,
      cover_image: coverImage,
      image: coverImage,
      avatar: coverImage,

      description,
      tags,
      languages,
      smokingPolicy,
      drinkingPolicy,
      non_smokers: groupData.non_smokers ?? g.non_smokers ?? null,
      non_drinkers: groupData.non_drinkers ?? g.non_drinkers ?? null,

      // Metadata (Pure Normalization)
      memberCount: Number(groupData.size || groupData.membersCount || g.membersCount || g.size || 0),
      score: typeof g.score === "number" ? g.score : 0,

      // Dates (Strict ISO or Null)
      startDate,
      endDate,
      dateRange:
        startDate || endDate
          ? {
              start: startDate,
              end: endDate,
              isOngoing: !endDate,
            }
          : null,

      // Enrichment Fields (Merge DB values)
      budget: groupData.averageBudget || groupData.budget || g.budget || 0,
      creator,

      // Safe Collections (legacy key retained for older web clients)
      interests: tags,

      // Fallback aliasing for older UI components
      privacy: (groupData.privacy || g.privacy || "public").toString(),
      status: (groupData.status || g.status || "active").toString(),
      locationDisplay: (groupData.destination?.name || groupData.destination || g.destination || "").toString(),
      membersCount: Number(groupData.size || groupData.membersCount || g.membersCount || g.size || 0),
    };
  }
}

export const groupTransformer = new GroupTransformer();
