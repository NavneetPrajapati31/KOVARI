import { z } from "zod";

export const profileEditSchema = z.object({
  avatar: z.string().url().optional(),
  name: z.string().min(2, "Name is required"),
  username: z.string().min(3, "Username is required"),
  age: z.number().min(13, "Minimum age is 13").max(120, "Invalid age"),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]),
  nationality: z.string().min(2, "Nationality is required"),
  profession: z.string().optional(),
  interests: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
});

export type ProfileEditForm = z.infer<typeof profileEditSchema>;
