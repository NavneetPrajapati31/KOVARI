import { z } from "zod";

export const ProfileResponseSchema = z.object({
  id: z.string(),
  avatar: z.string().default(""),
  name: z.string().default(""),
  username: z.string().default(""),
  age: z.number().default(0),
  gender: z.string().default("Prefer not to say"),
  nationality: z.string().default(""),
  profession: z.string().default(""),
  interests: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  bio: z.string().default(""),
  birthday: z.string().default(""),
  location: z.string().default(""),
  location_details: z.record(z.string(), z.any()).default({}),
  religion: z.string().default(""),
  smoking: z.string().default(""),
  drinking: z.string().default(""),
  personality: z.string().default(""),
  foodPreference: z.string().default(""),
  verified: z.boolean().default(false),
  destinations: z.array(z.string()).default([]),
  tripFocus: z.array(z.string()).default([]),
  travelFrequency: z.string().default(""),
  followers: z.number().default(0),
  following: z.number().default(0),
  onboardingCompleted: z.boolean().default(false),
  email: z.string().default(""),
});

export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

