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
    if (!g || !g.id) {
      throw new Error("Invalid group data: Missing id");
    }

    return {
      id: g.id,
      name: g.name || "Unnamed Group",
      destination: g.destination || "Unknown",
      membersCount: Array.isArray(g.members) ? g.members.length : (g.membersCount || 0),
      score: typeof g.score === "number" ? g.score : 0,
      startDate: g.startDate,
      endDate: g.endDate,
      budget: g.budget,
      ...g // Preserve other fields for now to match raw fidelity where possible
    };
  }
}

export const groupTransformer = new GroupTransformer();
