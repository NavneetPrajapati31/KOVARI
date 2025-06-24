import { z } from "zod";

export const groupFormSchema = z.object({
  groupName: z.string().min(1, "Group name is required"),
  destination: z.string().min(1, "Destination is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  visibility: z.enum(["public", "private"] as const),
  description: z.string().max(500, "Description must be less than 500 characters"),
}).refine((data) => {
  if (!data.startDate || !data.endDate) return true;
  return new Date(data.startDate) < new Date(data.endDate);
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});
