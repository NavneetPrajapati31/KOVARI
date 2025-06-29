import { z } from "zod";

export const profileEditSchema = z.object({
  avatar: z
    .string()
    .refine((val) => val === "" || z.string().url().safeParse(val).success, {
      message: "Avatar must be a valid URL or empty",
    })
    .optional(),
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(50, { message: "Name must be less than 50 characters" }),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters" })
    .max(32, { message: "Username must be less than 32 characters" })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: "Username can only contain letters, numbers, and underscores",
    }),
  age: z
    .number()
    .min(18, { message: "You must be at least 18 years old" })
    .max(120, { message: "Invalid age" }),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"], {
    required_error: "Please select your gender",
  }),
  nationality: z
    .string()
    .min(2, { message: "Nationality must be at least 2 characters" })
    .max(50, { message: "Nationality must be less than 50 characters" }),
  profession: z
    .string()
    .min(2, { message: "Profession must be at least 2 characters" })
    .max(50, { message: "Profession must be less than 50 characters" })
    .optional(),
  interests: z
    .array(z.string())
    .min(1, { message: "Please select at least one interest" })
    .optional(),
  languages: z
    .array(z.string())
    .min(1, { message: "Please select at least one language" })
    .optional(),
  bio: z
    .string()
    .max(300, { message: "Bio must be less than 300 characters" })
    .optional(),
});

export type ProfileEditForm = z.infer<typeof profileEditSchema>;
