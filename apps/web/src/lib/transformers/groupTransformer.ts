import { Transformer } from "@/types/api";

export interface GroupDTO {
  id: string;
  name: string;
  destination: string;
  membersCount: number;
  score: number;
  startDate?: string;
  endDate?: string;
  budget?: number;
  [key: string]: any;
}

export class GroupTransformer implements Transformer<any, GroupDTO> {
  toStandard(g: any): GroupDTO {
    // Handle nested group objects structure from Go Service: { group: { groupId... }, score: ... }
    const groupData = g.group || g;
    const id = groupData.groupId || groupData.id || g.id || g.groupId;
    
    if (!id) {
      throw new Error("Invalid group data: Missing id");
    }

    return {
      id: id,
      name: groupData.name || g.name || "Unnamed Group",
      destination: groupData.destination?.name || groupData.destination || g.destination || "Unknown",
      membersCount: groupData.size || Array.isArray(groupData.members) ? groupData.members.length : (groupData.membersCount || g.membersCount || 0),
      score: typeof g.score === "number" ? g.score : (typeof groupData.score === "number" ? groupData.score : 0),
      startDate: groupData.startDate || g.startDate,
      endDate: groupData.endDate || g.endDate,
      budget: groupData.averageBudget || groupData.budget || g.budget,
      
      // 🛡️ Mobile Compatibility Layer (Aliasing)
      avatar: groupData.cover_image || g.cover_image || "",
      locationDisplay: groupData.destination?.name || groupData.destination || g.destination || "Unknown",
      userId: id, // Mobile MatchUser uses userId as key sometimes

      // Preserve flat structures for the UI component
      privacy: groupData.privacy || g.privacy || "public",
      cover_image: groupData.cover_image || g.cover_image,
      creator: groupData.creator || g.creator,
      
      // Pass the rest gracefully
      ...groupData,
      ...g
    };
  }
}

export const groupTransformer = new GroupTransformer();
