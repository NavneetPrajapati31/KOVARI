import { z } from "zod";

export const ProfileResponseSchema = z.object({
  id: z.string(),
  avatar: z.string(),
  name: z.string(),
  username: z.string(),
  age: z.number(),
  gender: z.string(),
  nationality: z.string(),
  profession: z.string(),
  interests: z.array(z.string()),
  languages: z.array(z.string()),
  bio: z.string(),
  birthday: z.string(),
  location: z.string(),
  location_details: z.record(z.string(), z.any()),
  religion: z.string(),
  smoking: z.string(),
  drinking: z.string(),
  personality: z.string(),
  foodPreference: z.string(),
  verified: z.boolean(),
  destinations: z.array(z.string()),
  tripFocus: z.array(z.string()),
  travelFrequency: z.string(),
  followers: z.number(),
  following: z.number(),
  onboardingCompleted: z.boolean(),
});

export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

