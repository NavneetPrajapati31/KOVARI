import { Transformer } from "@/types/api";

export interface GroupDTO {
  id: string;
  name: string;
  destination: string;
  memberCount: number;
  score: number;
  startDate?: string;
  endDate?: string;
  budget?: number;
  membersCount?: number; // Legacy compat
  [key: string]: any;
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

    // 3. Normalized Output Construction
    return {
      id: id,
      name: (groupData.name || g.name || "Unnamed Group").toString(),
      destination: (groupData.destination?.name || groupData.destination || g.destination || "").toString(),
      
      // Aesthetics & UI Layer
      image: (groupData.cover_image || g.cover_image || groupData.image || "").toString(),
      avatar: (groupData.cover_image || g.cover_image || "").toString(), // Mobile compat
      
      // Metadata (Pure Normalization)
      memberCount: Number(groupData.size || groupData.membersCount || g.membersCount || g.size || 0),
      score: typeof g.score === "number" ? g.score : 0,
      
      // Dates (Strict ISO or Null)
      startDate: groupData.startDate || g.startDate || null,
      endDate: groupData.endDate || g.endDate || null,
      
      // Enrichment Fields (Merge DB values)
      budget: groupData.averageBudget || groupData.budget || g.budget || 0,
      creator: groupData.creator || g.creator || null,
      
      // Safe Collections
      interests: Array.isArray(groupData.topInterests || groupData.interests || g.interests) 
        ? (groupData.topInterests || groupData.interests || g.interests) 
        : [],
      
      // Fallback aliasing for older UI components
      privacy: (groupData.privacy || g.privacy || "public").toString(),
      status: (groupData.status || g.status || "active").toString(),
      locationDisplay: (groupData.destination?.name || groupData.destination || g.destination || "").toString(),
      membersCount: Number(groupData.size || groupData.membersCount || g.membersCount || g.size || 0), // Legacy compat
    };
  }
}

export const groupTransformer = new GroupTransformer();
