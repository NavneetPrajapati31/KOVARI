"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  UserRound,
  Building2,
  Earth,
  MessageSquareText,
  Lightbulb,
  CircleCheckBig,
  ChevronLeft,
  ChevronRight,
  ScanFace,
  X,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { useSyncUserToSupabase } from "@/lib/syncUserToSupabase";

// Import UI components
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
  Command,
  CommandList,
  CommandInput,
  CommandGroup,
  CommandEmpty,
} from "@/shared/components/ui/command";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/utils";
import { DatePicker } from "@/shared/components/ui/date-picker";
import { ImageUpload } from "@/shared/components/image-upload";
import CheckIcon from "@mui/icons-material/Check";
import CelebrationIcon from "@mui/icons-material/Celebration";

// Define schemas for each step
const step1Schema = z
  .object({
    firstName: z
      .string()
      .min(2, { message: "First name must be at least 2 characters" })
      .max(50, { message: "First name must be less than 50 characters" }),
    lastName: z
      .string()
      .min(2, { message: "Last name must be at least 2 characters" })
      .max(50, { message: "Last name must be less than 50 characters" }),
    username: z
      .string()
      .min(3, { message: "Username must be at least 3 characters" })
      .max(32, { message: "Username must be less than 32 characters" })
      .regex(/^[a-zA-Z0-9_]+$/, {
        message: "Username can only contain letters, numbers, and underscores",
      }),
    gender: z.string().min(1, { message: "Please select your gender" }),
    birthday: z.date({
      required_error: "Your date of birth is required.",
    }),
  })
  .refine(
    (data) => {
      const today = new Date();
      let age = today.getFullYear() - data.birthday.getFullYear();
      const monthDiff = today.getMonth() - data.birthday.getMonth();
      const dayDiff = today.getDate() - data.birthday.getDate();
      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
      return age >= 18 && age <= 100;
    },
    {
      message: "You must be between 18 and 100 years old",
      path: ["birthday"],
    }
  );

const step2Schema = z.object({
  bio: z
    .string()
    .max(300, { message: "Bio must be less than 300 characters" })
    .optional(),
  profilePic: z.any().optional(),
  location: z.string().min(1, { message: "Please select your location" }),
  nationality: z.string().min(1, { message: "Please select your nationality" }),
  jobType: z.string().min(1, { message: "Please select your job type" }),
  languages: z
    .array(z.string())
    .min(1, { message: "Please select at least one language" }),
  interests: z
    .array(z.string())
    .min(1, { message: "Please select at least one interest" }),
  religion: z.string().min(1, { message: "Please select your religion" }),
  smoking: z.string().min(1, { message: "Please select smoking preference" }),
  drinking: z.string().min(1, { message: "Please select drinking preference" }),
  personality: z
    .string()
    .min(1, { message: "Please select your personality type" }),
  foodPreference: z
    .string()
    .min(1, { message: "Please select food preference" }),
});

const step3Schema = z.object({
  destinations: z.string().min(1, "Please enter at least one destination"),
  tripFocus: z
    .array(z.string())
    .min(1, "Please select at least one trip focus"),
  frequency: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

// Sample data for dropdowns
const genderOptions = ["Male", "Female", "Other"];

const languageOptions = [
  "English",
  "Spanish",
  "French",
  "German",
  "Chinese",
  "Japanese",
  "Korean",
  "Arabic",
  "Russian",
  "Portuguese",
  "Hindi",
  "Italian",
];

const nationalityOptions = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Japan",
  "China",
  "India",
  "Brazil",
  "Mexico",
  "Spain",
  "Italy",
];

const jobTypeOptions = [
  "Full-time",
  "Part-time",
  "Freelance",
  "Contract",
  "Internship",
  "Student",
];

const interestOptions = [
  { id: "1", label: "Technology" },
  { id: "2", label: "Travel" },
  { id: "3", label: "Food" },
  { id: "4", label: "Sports" },
  { id: "5", label: "Music" },
  { id: "6", label: "Art" },
  { id: "7", label: "Reading" },
  { id: "8", label: "Photography" },
  { id: "9", label: "Gaming" },
  { id: "10", label: "Fitness" },
];

const religionOptions = [
  "Christianity",
  "Islam",
  "Hinduism",
  "Buddhism",
  "Judaism",
  "Sikhism",
  "Atheist",
  "Agnostic",
  "Other",
  "Prefer not to say",
];

const smokingOptions = [
  "Non-smoker",
  "Occasionally",
  "Regularly",
  "Prefer not to say",
];

const drinkingOptions = [
  "Non-drinker",
  "Socially",
  "Regularly",
  "Prefer not to say",
];

const personalityOptions = [
  "Introvert",
  "Extrovert",
  "Ambivert",
  "Prefer not to say",
];

const foodPreferenceOptions = [
  "Vegetarian",
  "Vegan",
  "Non-vegetarian",
  "Pescatarian",
  "Halal",
  "Kosher",
  "No preference",
];

const tripFocusList = [
  "Hiking",
  "Photography",
  "Culture",
  "Food",
  "Music",
  "History",
  "Adventure",
  "Nightlife",
  "Local Tours",
  "Beach",
  "Shopping",
];

const tripFrequencies = [
  "Once a year",
  "Every 6 months",
  "Monthly",
  "Digital nomad",
];

export default function ProfileSetupForm() {
  const { user } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 7;
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [interestOpen, setInterestOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const [step3Data, setStep3Data] = useState<Step3Data | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameCheckLoading, setUsernameCheckLoading] = useState(false);
  const [usernameCheckError, setUsernameCheckError] = useState<string | null>(
    null
  );
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);
  const [syncUserError, setSyncUserError] = useState<string | null>(null);

  const { syncUser } = useSyncUserToSupabase();

  // Sync user to Supabase when component mounts
  useEffect(() => {
    syncUser();
  }, [syncUser]);

  // Initialize forms for each step
  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      gender: "",
      birthday: undefined,
    },
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      bio: "",
      profilePic: null,
      location: "",
      nationality: "",
      jobType: "",
      languages: [],
      interests: [],
      religion: "",
      smoking: "",
      drinking: "",
      personality: "",
      foodPreference: "",
    },
  });

  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      destinations: "",
      tripFocus: [],
      frequency: "",
    },
  });

  // Async username uniqueness check
  const checkUsernameUnique = async (username: string) => {
    setUsernameCheckError(null);
    if (!username || username.length < 3) return true;
    setUsernameCheckLoading(true);
    try {
      const res = await fetch("/api/check-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!data.available) {
        setUsernameCheckError("Username is already taken");
        return false;
      }
      setUsernameCheckError(null);
      return true;
    } catch (e) {
      setUsernameCheckError("Could not check username");
      return false;
    } finally {
      setUsernameCheckLoading(false);
    }
  };

  // Step-scoped next navigation with partial validation
  const handleNext = async () => {
    if (step === 1) {
      const valid = await step1Form.trigger(
        ["firstName", "lastName", "username"],
        { shouldFocus: true }
      );
      if (!valid) return;
      const username = step1Form.getValues("username");
      const isUnique = await checkUsernameUnique(username);
      if (!isUnique) {
        toast.error("Username is already taken");
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      const valid = await step2Form.trigger(["profilePic", "bio"], {
        shouldFocus: true,
      });
      if (!valid) return;
      setStep(3);
      return;
    }
    if (step === 3) {
      const valid = await step1Form.trigger(["gender", "birthday"], {
        shouldFocus: true,
      });
      if (!valid) return;
      setStep1Data(step1Form.getValues());
      setStep(4);
      return;
    }
    if (step === 4) {
      const valid = await step2Form.trigger(
        ["location", "nationality", "jobType"],
        { shouldFocus: true }
      );
      if (!valid) return;
      setStep(5);
      return;
    }
    if (step === 5) {
      const valid = await step2Form.trigger(["languages", "interests"], {
        shouldFocus: true,
      });
      if (!valid) return;
      setStep(6);
      return;
    }
    if (step === 6) {
      const valid = await step2Form.trigger(
        ["religion", "smoking", "drinking", "personality", "foodPreference"],
        { shouldFocus: true }
      );
      if (!valid) return;
      setStep2Data(step2Form.getValues());
      setStep(7);
      return;
    }
    if (step === 7) {
      const valid = await step3Form.trigger(
        ["destinations", "tripFocus", "frequency"],
        { shouldFocus: true }
      );
      if (!valid) return;
      const data = step3Form.getValues();
      await onStep3Submit(data);
      return;
    }
  };

  // Handle step 2 submission
  const onStep2Submit = (data: Step2Data) => {
    console.log("Step 2 data:", data);
    setStep2Data(data);
    setStep(3);
  };

  // Location autocomplete (OpenStreetMap Nominatim)
  useEffect(() => {
    const controller = new AbortController();
    const query = locationQuery.trim();
    if (!query) {
      setLocationSuggestions([]);
      return () => controller.abort();
    }
    const timeout = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&addressdetails=1&limit=5`;
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "User-Agent": "Kovari/1.0 (onboarding@kovari.app)",
          },
        });
        if (!res.ok) return;
        const data = (await res.json()) as Array<any>;
        const labels = data.map((d) => d.display_name as string);
        setLocationSuggestions(labels);
      } catch {}
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [locationQuery]);

  const handleUseMyLocation = async () => {
    if (!navigator.geolocation) return;
    try {
      setIsLocating(true);
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const { latitude, longitude } = pos.coords;
              const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
              const res = await fetch(url, {
                headers: {
                  Accept: "application/json",
                  "User-Agent": "Kovari/1.0 (onboarding@kovari.app)",
                },
              });
              const data = await res.json();
              const name = (data?.display_name as string) || "";
              if (name) {
                step2Form.setValue("location", name, { shouldValidate: true });
                setLocationQuery("");
                setLocationSuggestions([]);
              }
            } catch {}
            resolve();
          },
          () => resolve(),
          { enableHighAccuracy: true, timeout: 8000 }
        );
      });
    } finally {
      setIsLocating(false);
    }
  };

  // Handle step 3 submission
  const onStep3Submit = async (data: Step3Data) => {
    console.log("Step 3 data:", data);
    setStep3Data(data);
    await submitProfileAndPreferences(data);
  };

  // Original step 3 submission logic moved to a separate function
  const submitProfileAndPreferences = async (data: Step3Data) => {
    const readErrorMessage = async (res: Response) => {
      const tryFormatZod = (payload: any) => {
        const err = payload?.error ?? payload;
        if (err && typeof err === "object" && err.fieldErrors) {
          const fieldEntries = Object.entries(
            err.fieldErrors as Record<string, string[]>
          )
            .filter(([, v]) => Array.isArray(v) && v.length > 0)
            .slice(0, 5)
            .map(([k, v]) => `${k}: ${v[0]}`);
          if (fieldEntries.length)
            return `Validation failed - ${fieldEntries.join(", ")}`;
        }
        return null;
      };
      try {
        const json = await res.clone().json();
        if (json && typeof json === "object") {
          const zodMsg = tryFormatZod(json);
          if (zodMsg) return zodMsg;
          const errorVal = (json as any).error;
          if (typeof errorVal === "string") return errorVal;
          if (errorVal && typeof errorVal === "object")
            return JSON.stringify(errorVal);
          if (typeof (json as any).message === "string")
            return (json as any).message;
          return JSON.stringify(json);
        }
      } catch {}
      try {
        const text = await res.text();
        if (text) return text;
      } catch {}
      return `${res.status} ${res.statusText}`;
    };
    try {
      setIsSubmitting(true);
      setSyncUserError(null);
      const completeData = { ...step1Data, ...step2Data, ...data };
      console.log("Complete form data:", completeData);

      // Transform data to match API schema
      const interestsLabels = (completeData.interests || [])
        .map((id) => interestOptions.find((opt) => opt.id === id)?.label)
        .filter(Boolean) as string[];
      const computeAge = (dob?: Date) => {
        if (!dob) return 18;
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
        if (!Number.isFinite(age) || age < 0) return 18;
        return age;
      };
      const numericAge = computeAge(completeData.birthday as Date | undefined);
      const profileData = {
        name: `${completeData.firstName} ${completeData.lastName}`,
        username: completeData.username,
        age: Number.isFinite(numericAge) ? numericAge : 18,
        gender: completeData.gender,
        birthday: completeData.birthday?.toISOString(),
        bio: completeData.bio || "",
        profile_photo:
          typeof completeData.profilePic === "string" &&
          /^https?:\/\//i.test(completeData.profilePic)
            ? (completeData.profilePic as string)
            : undefined,
        location: completeData.location,
        languages: completeData.languages,
        nationality: completeData.nationality,
        job: completeData.jobType,
        religion: completeData.religion,
        smoking: completeData.smoking,
        drinking: completeData.drinking,
        personality: completeData.personality,
        food_preference: completeData.foodPreference,
        interests: interestsLabels,
      };

      const travelPreferencesData = {
        destinations: completeData.destinations
          ? completeData.destinations.split(",").map((dest) => dest.trim())
          : [],
        trip_focus: completeData.tripFocus,
        frequency: completeData.frequency,
      };

      if (!user) {
        throw new Error("User not found");
      }

      // Step 1: Update Clerk user profile metadata
      await user.update({
        unsafeMetadata: {
          imageUrl: completeData.profilePic || undefined,
          age: numericAge,
          gender: completeData.gender,
          birthday: completeData.birthday?.toISOString(),
          bio: completeData.bio,
          nationality: completeData.nationality,
          jobType: completeData.jobType,
          location: completeData.location,
          languages: completeData.languages,
          interests: interestsLabels,
          religion: completeData.religion,
          smoking: completeData.smoking,
          drinking: completeData.drinking,
          personality: completeData.personality,
          foodPreference: completeData.foodPreference,
          travel_preferences: travelPreferencesData,
        },
      });

      // Step 2: Sync user to Supabase
      const syncSuccess = await syncUser();
      if (!syncSuccess) {
        setSyncUserError(
          "Failed to sync your account to our database. Please check your connection and try again."
        );
        toast.error(
          "Failed to sync your account to our database. Please try again."
        );
        setIsSubmitting(false);
        return;
      }

      // Step 3: Submit profile data to API
      const profileRes = await fetch("/api/profile", {
        method: "POST",
        body: JSON.stringify(profileData),
        headers: { "Content-Type": "application/json" },
      });

      if (!profileRes.ok) {
        const errorMsg = await readErrorMessage(profileRes);
        throw new Error(`Profile (${profileRes.status}): ${errorMsg}`);
      }

      // Step 4: Submit travel preferences data to API
      const preferencesRes = await fetch("/api/travel-preferences", {
        method: "POST",
        body: JSON.stringify(travelPreferencesData),
        headers: { "Content-Type": "application/json" },
      });

      if (!preferencesRes.ok) {
        const errorMsg = await readErrorMessage(preferencesRes);
        throw new Error(`Preferences (${preferencesRes.status}): ${errorMsg}`);
      }

      toast.success("Profile saved successfully!");
      setStep(8);
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(error.message || "Failed to save profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Go back to previous step
  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Progress indicator component
  const ProgressIndicator = () =>
    step <= totalSteps ? (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">
            Step {step} of {totalSteps}
          </span>
        </div>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5, 6, 7].map((stepNum) => (
            <div key={stepNum} className="flex-1">
              <div
                className={`h-1.5 rounded-full ${
                  stepNum <= step ? "bg-primary" : "bg-gray-300"
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    ) : null;

  // Step 1 - Identity
  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Let&apos;s get started
        </h1>
        <p className="text-sm text-muted-foreground">
          Tell us about yourself to create your profile
        </p>
      </div>

      <Form {...step1Form}>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await handleNext();
          }}
          className="space-y-4"
        >
          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField
              control={step1Form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-muted-foreground">
                    First Name
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <UserRound className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="John"
                        className="pl-8 h-9 text-sm border-input focus:border-primary focus:ring-primary rounded-lg placeholder:text-muted-foreground "
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={step1Form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-muted-foreground">
                    Last Name
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <UserRound className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Doe"
                        className="pl-8 h-9 text-sm border-input focus:border-primary focus:ring-primary rounded-lg placeholder:text-muted-foreground"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* Username Field */}
          <FormField
            control={step1Form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground">
                  Username
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <UserRound className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="your_username"
                      className="pl-8 h-9 text-sm border-input focus:border-primary focus:ring-primary rounded-lg placeholder:text-muted-foreground w-full"
                      autoComplete="username"
                      {...field}
                      onBlur={async (e) => {
                        field.onBlur?.();
                        if (field.value) await checkUsernameUnique(field.value);
                      }}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (field.value)
                            await checkUsernameUnique(field.value);
                        }
                      }}
                    />
                    {usernameCheckLoading && (
                      <Loader2 className="absolute right-2.5 top-2 h-5 w-5 animate-spin text-muted-foreground/5" />
                    )}
                  </div>
                </FormControl>
                <FormMessage className="text-xs">
                  {usernameCheckError}
                </FormMessage>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="!mt-5 w-full h-9 text-sm bg-primary hover:bg-primary-hover text-primary-foreground font-medium rounded-lg transition-all duration-200"
          >
            Continue
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </form>
      </Form>
    </motion.div>
  );

  // Step 2 - Media & Bio
  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Profile picture
        </h1>
        <p className="text-sm text-muted-foreground">
          Add a photo and short bio
        </p>
      </div>

      <Form {...step2Form}>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await handleNext();
          }}
          className="space-y-4"
        >
          {/* Profile Picture */}
          <FormField
            control={step2Form.control}
            name="profilePic"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground">
                  Profile Picture
                </FormLabel>
                <FormControl>
                  <ImageUpload
                    onImageUpload={(url) => {
                      setProfileImage(url as string);
                      field.onChange(url);
                    }}
                    onImageRemove={() => {
                      setProfileImage(null);
                      field.onChange(null);
                    }}
                    label=""
                    maxSizeInMB={10}
                    acceptedFormats={["PNG", "JPG", "JPEG", "WEBP"]}
                    avatar
                  />
                </FormControl>
                {/* <FormMessage className="text-xs">
                  Upload profile picture
                </FormMessage> */}
              </FormItem>
            )}
          />

          {/* Bio */}
          <FormField
            control={step2Form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground">
                  Bio (Optional)
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lightbulb className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Textarea
                      placeholder="Tell us about yourself..."
                      className="pl-8 min-h-[80px] text-sm border-input focus:border-primary focus:ring-primary rounded-lg resize-none placeholder:text-muted-foreground"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          {/* Navigation Buttons */}
          <div className="flex space-x-4 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              className="bg-white flex-1 h-9 text-sm border-input text-muted-foreground hover:bg-black hover:text-white rounded-lg transition-all"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 h-9 text-sm bg-primary hover:bg-primary-hover text-primary-foreground font-medium rounded-lg transition-all duration-200"
            >
              Continue
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );

  // Step 3 - Demographics (gender, birthday)
  const renderDemographics = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">About you</h1>
        <p className="text-sm text-muted-foreground">Gender and birthday</p>
      </div>

      <Form {...step1Form}>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await handleNext();
          }}
          className="space-y-4"
        >
          <FormField
            control={step1Form.control}
            name="birthday"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-xs font-medium text-muted-foreground">
                  Date of Birth
                </FormLabel>
                <FormControl>
                  <DatePicker
                    startYear={1950}
                    endYear={new Date().getFullYear()}
                    date={field.value}
                    onDateChange={field.onChange}
                    disabled={{
                      before: new Date(1900, 0, 1),
                      after: new Date(),
                    }}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={step1Form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground">
                  Gender
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full h-9 text-sm border-border focus:border-primary focus:ring-primary rounded-lg placeholder:text-muted-foreground">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {genderOptions.map((gender) => (
                      <SelectItem
                        key={gender}
                        value={gender}
                        className="text-sm"
                      >
                        {gender}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <div className="flex space-x-4 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              className="bg-white flex-1 h-9 text-sm border-input text-muted-foreground hover:bg-black hover:text-white rounded-lg transition-all"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 h-9 text-sm bg-primary hover:bg-primary-hover text-primary-foreground font-medium rounded-lg transition-all duration-200"
            >
              Continue
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );

  // Step 4 - Location / Nationality / Job
  const renderLocation = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Where are you based?
        </h1>
        <p className="text-sm text-muted-foreground">
          Location, nationality and job type
        </p>
      </div>
      <Form {...step2Form}>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await handleNext();
          }}
          className="space-y-4"
        >
          <FormField
            control={step2Form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground">
                  Location
                </FormLabel>
                <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "bg-white w-full h-9 text-sm font-normal justify-between border-input focus:border-primary focus:ring-primary rounded-lg",
                          !field.value &&
                            "text-muted-foreground hover:bg-transparent hover:text-muted-foreground"
                        )}
                      >
                        <div className="flex items-center text-muted-foreground">
                          <Earth className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                          {field.value || "Select location"}
                        </div>
                        <ChevronRight className="ml-2 h-3.5 w-3.5 shrink-0 " />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <div className="p-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Search city, state, country..."
                          className="h-9 text-sm border-input focus:border-primary focus:ring-primary rounded-lg"
                          value={locationQuery}
                          onChange={(e) => setLocationQuery(e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="h-9 text-xs"
                          onClick={handleUseMyLocation}
                          disabled={isLocating}
                          aria-label="Use my current location"
                        >
                          {isLocating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ScanFace className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                      <div className="mt-2 max-h-56 overflow-auto rounded-md border">
                        {locationSuggestions.length === 0 ? (
                          <div className="p-2 text-xs text-muted-foreground">
                            Start typing to search locations
                          </div>
                        ) : (
                          locationSuggestions.map((suggestion) => (
                            <div
                              key={suggestion}
                              className="px-2 py-1.5 text-sm text-muted-foreground cursor-pointer hover:bg-gray-100"
                              onClick={() => {
                                field.onChange(suggestion);
                                setLocationOpen(false);
                                setLocationQuery("");
                                setLocationSuggestions([]);
                              }}
                            >
                              {suggestion}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField
              control={step2Form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-xs font-medium text-muted-foreground">
                    Nationality
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "bg-white w-full h-9 text-sm font-normal justify-between border-input focus:border-primary focus:ring-primary rounded-lg",
                            !field.value &&
                              "text-muted-foreground hover:bg-transparent hover:text-muted-foreground"
                          )}
                        >
                          <div className="flex items-center text-muted-foreground">
                            <Earth className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                            {field.value
                              ? nationalityOptions.find(
                                  (n) => n === field.value
                                )
                              : "Select nationality"}
                          </div>
                          <ChevronRight className="ml-2 h-3.5 w-3.5 shrink-0" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search nationality..."
                          className="text-sm placeholder:text-muted-foreground"
                        />
                        <CommandList>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {nationalityOptions.map((nationality) => (
                              <div
                                key={nationality}
                                className="px-2 py-1.5 text-sm text-muted-foreground rounded-sm cursor-pointer hover:bg-gray-100 flex items-center"
                                onClick={() => {
                                  field.onChange(nationality);
                                }}
                              >
                                {nationality === field.value && (
                                  <CheckIcon
                                    fontSize="inherit"
                                    className="mr-2 text-muted-foreground flex-shrink-0"
                                  />
                                )}
                                {nationality !== field.value && (
                                  <div className="mr-2 h-3.5 w-3.5 flex-shrink-0" />
                                )}
                                {nationality}
                              </div>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={step2Form.control}
              name="jobType"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-xs font-medium text-muted-foreground">
                    Job Type
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "bg-white w-full h-9 text-sm font-normal justify-between border-input focus:border-primary focus:ring-primary rounded-lg",
                            !field.value &&
                              "text-muted-foreground hover:bg-transparent hover:text-muted-foreground"
                          )}
                        >
                          <div className="flex items-center text-muted-foreground">
                            <Building2 className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                            {field.value
                              ? jobTypeOptions.find((j) => j === field.value)
                              : "Select job type"}
                          </div>
                          <ChevronRight className="ml-2 h-3.5 w-3.5 shrink-0" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search job type..."
                          className="text-sm placeholder:text-muted-foreground"
                        />
                        <CommandList>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {jobTypeOptions.map((jobType) => (
                              <div
                                key={jobType}
                                className="px-2 py-1.5 text-sm text-muted-foreground rounded-sm cursor-pointer hover:bg-gray-100 flex items-center"
                                onClick={() => {
                                  field.onChange(jobType);
                                }}
                              >
                                {jobType === field.value && (
                                  <CheckIcon
                                    fontSize="inherit"
                                    className="mr-2 text-muted-foreground flex-shrink-0"
                                  />
                                )}
                                {jobType !== field.value && (
                                  <div className="mr-2 h-3.5 w-3.5 flex-shrink-0" />
                                )}
                                {jobType}
                              </div>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
          <div className="flex space-x-4 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              className="bg-white flex-1 h-9 text-sm border-input text-muted-foreground hover:bg-black hover:text-white rounded-lg transition-all"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 h-9 text-sm bg-primary hover:bg-primary-hover text-primary-foreground font-medium rounded-lg transition-all duration-200"
            >
              Continue
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );

  // Step 5 - Languages & Interests
  const renderLanguages = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Languages & interests
        </h1>
        <p className="text-sm text-muted-foreground">
          Tell us what you speak and like
        </p>
      </div>
      <Form {...step2Form}>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await handleNext();
          }}
          className="space-y-4"
        >
          {/* Languages */}
          {(() => {
            return (
              <FormField
                control={step2Form.control}
                name="languages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-muted-foreground">
                      Languages
                    </FormLabel>
                    <Popover open={languageOpen} onOpenChange={setLanguageOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "bg-white w-full h-9 text-sm font-normal justify-between border-input focus:border-primary focus:ring-primary rounded-lg",
                              !field.value?.length &&
                                "text-muted-foreground hover:bg-transparent hover:text-muted-foreground"
                            )}
                          >
                            <div className="flex items-center text-muted-foreground">
                              <MessageSquareText className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                              {field.value?.length
                                ? `${field.value.length} language${field.value.length > 1 ? "s" : ""} selected`
                                : "Select languages"}
                            </div>
                            <ChevronRight className="ml-2 h-3.5 w-3.5 shrink-0 " />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Search languages..."
                            className="text-sm placeholder:text-muted-foreground"
                          />
                          <CommandList>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {languageOptions.map((language) => (
                                <div
                                  key={language}
                                  className="px-2 py-1.5 text-sm text-muted-foreground rounded-sm cursor-pointer hover:bg-gray-100 flex items-center"
                                  onClick={() => {
                                    const newValue = field.value?.includes(
                                      language
                                    )
                                      ? field.value.filter(
                                          (l) => l !== language
                                        )
                                      : [...(field.value || []), language];
                                    field.onChange(newValue);
                                    setLanguageOpen(true);
                                  }}
                                >
                                  {field.value?.includes(language) ? (
                                    <CheckIcon
                                      fontSize="inherit"
                                      className="mr-2 text-muted-foreground flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="mr-2 h-3.5 w-3.5 flex-shrink-0" />
                                  )}
                                  <span>{language}</span>
                                </div>
                              ))}
                            </CommandGroup>
                          </CommandList>
                          {field.value?.length > 0 && (
                            <div className="border-t p-2">
                              <div className="flex flex-wrap gap-1">
                                {field.value.map((language) => (
                                  <Badge
                                    key={language}
                                    variant="secondary"
                                    className="text-xs bg-primary text-white px-2 py-1"
                                  >
                                    {language}
                                    <button
                                      type="button"
                                      className="ml-1 text-white rounded-full"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        field.onChange(
                                          field.value.filter(
                                            (l) => l !== language
                                          )
                                        );
                                      }}
                                      title={`Remove ${language}`}
                                    >
                                      <X className="h-2.5 w-2.5" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="border-t p-2 flex justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs bg-white border-input hover:text-foreground"
                              onClick={() => setLanguageOpen(false)}
                            >
                              Done
                            </Button>
                          </div>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {field.value?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {field.value.map((language) => (
                          <Badge
                            key={language}
                            variant="secondary"
                            className="text-xs bg-primary text-white"
                          >
                            {language}
                            <button
                              type="button"
                              className="ml-1 text-white"
                              onClick={() => {
                                field.onChange(
                                  field.value.filter((l) => l !== language)
                                );
                              }}
                              title={`Remove ${language}`}
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            );
          })()}
          {/* Interests */}
          {(() => {
            return (
              <FormField
                control={step2Form.control}
                name="interests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-muted-foreground">
                      Interests
                    </FormLabel>
                    <Popover open={interestOpen} onOpenChange={setInterestOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "bg-white w-full h-9 text-sm font-normal justify-between border-input focus:border-primary focus:ring-primary rounded-lg",
                              !field.value?.length &&
                                "text-muted-foreground hover:bg-transparent hover:text-muted-foreground"
                            )}
                          >
                            <div className="flex items-center text-muted-foreground">
                              <Lightbulb className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                              {field.value?.length
                                ? `${field.value.length} interest${field.value.length > 1 ? "s" : ""} selected`
                                : "Select interests"}
                            </div>
                            <ChevronRight className="ml-2 h-3.5 w-3.5 shrink-0 " />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Search interests..."
                            className="text-sm placeholder:text-muted-foreground"
                          />
                          <CommandList>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {interestOptions.map((interest) => (
                                <div
                                  key={interest.id}
                                  className="px-2 py-1.5 text-sm text-muted-foreground rounded-sm cursor-pointer hover:bg-gray-100 flex items-center"
                                  onClick={() => {
                                    const newValue = field.value?.includes(
                                      interest.id
                                    )
                                      ? field.value.filter(
                                          (i) => i !== interest.id
                                        )
                                      : [...(field.value || []), interest.id];
                                    field.onChange(newValue);
                                    setInterestOpen(true);
                                  }}
                                >
                                  {field.value?.includes(interest.id) ? (
                                    <CheckIcon
                                      fontSize="inherit"
                                      className="mr-2 text-muted-foreground flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="mr-2 h-3.5 w-3.5 flex-shrink-0" />
                                  )}
                                  <span>{interest.label}</span>
                                </div>
                              ))}
                            </CommandGroup>
                          </CommandList>
                          {field.value?.length > 0 && (
                            <div className="border-t p-2">
                              <div className="flex flex-wrap gap-1">
                                {field.value.map((interestId) => {
                                  const interest = interestOptions.find(
                                    (opt) => opt.id === interestId
                                  );
                                  return interest ? (
                                    <Badge
                                      key={interest.id}
                                      variant="secondary"
                                      className="text-xs bg-primary text-white px-2 py-1"
                                    >
                                      {interest.label}
                                      <button
                                        type="button"
                                        className="ml-1 text-white rounded-full"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          field.onChange(
                                            field.value.filter(
                                              (i) => i !== interestId
                                            )
                                          );
                                        }}
                                        title={`Remove ${interest.label}`}
                                      >
                                        <X className="h-2.5 w-2.5" />
                                      </button>
                                    </Badge>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}
                          <div className="border-t p-2 flex justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs bg-white border-input hover:text-foreground"
                              onClick={() => setInterestOpen(false)}
                            >
                              Done
                            </Button>
                          </div>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {field.value?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {field.value.map((interestId) => {
                          const interest = interestOptions.find(
                            (opt) => opt.id === interestId
                          );
                          return interest ? (
                            <Badge
                              key={interest.id}
                              variant="secondary"
                              className="text-xs bg-primary text-white"
                            >
                              {interest.label}
                              <button
                                type="button"
                                className="ml-1 text-white"
                                onClick={() => {
                                  field.onChange(
                                    field.value.filter((i) => i !== interestId)
                                  );
                                }}
                                title={`Remove ${interest.label}`}
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            );
          })()}
          <div className="flex space-x-4 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              className="bg-white flex-1 h-9 text-sm border-input text-muted-foreground hover:bg-black hover:text-white rounded-lg transition-all"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 h-9 text-sm bg-primary hover:bg-primary-hover text-primary-foreground font-medium rounded-lg transition-all duration-200"
            >
              Continue
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );

  // Step 6 - Lifestyle
  const renderLifestyle = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">Lifestyle</h1>
        <p className="text-sm text-muted-foreground">
          Religion, preferences and personality
        </p>
      </div>
      <Form {...step2Form}>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await handleNext();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField
              control={step2Form.control}
              name="religion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-muted-foreground">
                    Religion
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full h-9 text-sm border-input focus:border-primary focus:ring-primary rounded-lg">
                        <SelectValue placeholder="Select religion" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {religionOptions.map((religion) => (
                        <SelectItem
                          key={religion}
                          value={religion}
                          className="text-sm"
                        >
                          {religion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={step2Form.control}
              name="personality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-muted-foreground">
                    Personality
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full h-9 text-sm border-input focus:border-primary focus:ring-primary rounded-lg">
                        <SelectValue placeholder="Select personality" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {personalityOptions.map((p) => (
                        <SelectItem key={p} value={p} className="text-sm">
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField
              control={step2Form.control}
              name="smoking"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-muted-foreground">
                    Smoking
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full h-9 text-sm border-input focus:border-primary focus:ring-primary rounded-lg">
                        <SelectValue placeholder="Select preference" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {smokingOptions.map((option) => (
                        <SelectItem
                          key={option}
                          value={option}
                          className="text-sm"
                        >
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={step2Form.control}
              name="drinking"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-muted-foreground">
                    Drinking
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full h-9 text-sm border-input focus:border-primary focus:ring-primary rounded-lg">
                        <SelectValue placeholder="Select preference" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {drinkingOptions.map((option) => (
                        <SelectItem
                          key={option}
                          value={option}
                          className="text-sm"
                        >
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={step2Form.control}
            name="foodPreference"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground">
                  Food Preference
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full h-9 text-sm border-input focus:border-primary focus:ring-primary rounded-lg">
                      <SelectValue placeholder="Select food preference" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {foodPreferenceOptions.map((option) => (
                      <SelectItem
                        key={option}
                        value={option}
                        className="text-sm"
                      >
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <div className="flex space-x-4 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              className="bg-white flex-1 h-9 text-sm border-input text-muted-foreground hover:bg-black hover:text-white rounded-lg transition-all"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 h-9 text-sm bg-primary hover:bg-primary-hover text-primary-foreground font-medium rounded-lg transition-all duration-200"
            >
              Continue
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );

  // Step 7 - Travel Preferences
  const renderTravel = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Travel Preferences
        </h1>
        <p className="text-sm text-muted-foreground">
          Customize your upcoming travel experience
        </p>
      </div>

      <Form {...step3Form}>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await handleNext();
          }}
          className="space-y-4"
        >
          {/* Preferred Destinations */}
          <FormField
            control={step3Form.control}
            name="destinations"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground">
                  Preferred Destinations
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Earth className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Dream destinations on your bucket list"
                      className="pl-8 h-9 text-sm border-input focus:border-primary focus:ring-primary rounded-lg placeholder:text-muted-foreground"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Travel Mode */}
          {/* <FormField
            control={step3Form.control}
            name="mode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground">
                  Travel Style
                </FormLabel>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={field.value === "solo" ? "default" : "outline"}
                    className="h-9 text-sm"
                    onClick={() => field.onChange("solo")}
                  >
                    Solo
                  </Button>
                  <Button
                    type="button"
                    variant={field.value === "group" ? "default" : "outline"}
                    className="h-9 text-sm"
                    onClick={() => field.onChange("group")}
                  >
                    Group
                  </Button>
                </div>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          /> */}

          {/* Trip Focus / Activities */}
          <FormField
            control={step3Form.control}
            name="tripFocus"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground">
                  Trip Focus
                </FormLabel>
                <div className="flex flex-wrap gap-2">
                  {tripFocusList.map((focus) => (
                    <Badge
                      key={focus}
                      variant={
                        field.value?.includes(focus) ? "default" : "outline"
                      }
                      className="cursor-pointer px-4 py-2 text-xs hover:bg-primary hover:text-white transition-colors"
                      onClick={() => {
                        const newValue = field.value?.includes(focus)
                          ? field.value.filter((h) => h !== focus)
                          : [...(field.value || []), focus];
                        field.onChange(newValue);
                      }}
                    >
                      {focus}
                    </Badge>
                  ))}
                </div>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Trip Frequency */}
          <FormField
            control={step3Form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground">
                  How often do you travel?
                </FormLabel>
                <div className="flex flex-wrap gap-2">
                  {tripFrequencies.map((freq) => (
                    <Badge
                      key={freq}
                      variant={field.value === freq ? "default" : "outline"}
                      className="cursor-pointer px-4 py-2 text-xs hover:bg-primary hover:text-white transition-colors"
                      onClick={() => field.onChange(freq)}
                    >
                      {freq}
                    </Badge>
                  ))}
                </div>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Navigation Buttons */}
          <div className="flex space-x-4 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              className="bg-white flex-1 h-9 text-sm border-input text-muted-foreground hover:bg-black hover:text-white rounded-lg transition-all"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 h-9 text-sm bg-primary hover:bg-primary-hover text-primary-foreground font-medium rounded-lg transition-all duration-200"
            >
              Continue
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );

  // Render step 4 - Success
  const renderStep4 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckIcon className="w-8 h-8 text-primary-foreground" />
          {/* <CelebrationIcon className="w-8 h-8 text-primary-foreground" /> */}
          {/* <CircleCheckBig /> */}
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Welcome aboard! 🎉
        </h1>
        <p className="text-sm text-muted-foreground">
          Your profile has been successfully created. You&apos;re all set to get
          started!
        </p>
      </div>

      <Button
        onClick={() => router.push("/dashboard")}
        className="w-full h-9 text-sm bg-primary hover:bg-primary-hover text-primary-foreground font-medium rounded-lg transition-all duration-200"
      >
        Get Started
      </Button>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-6 custom-autofill-white">
      <Card className="w-full max-w-xl border-border bg-card shadow-none gap-3 px-2">
        <CardHeader>
          <ProgressIndicator />
        </CardHeader>
        <CardContent className="px-4 md:px-6 pb-6">
          {syncUserError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm flex flex-col items-center">
              <span>{syncUserError}</span>
              <Button
                className="mt-2"
                onClick={async () => {
                  setSyncUserError(null);
                  setIsSubmitting(true);
                  const syncSuccess = await syncUser();
                  setIsSubmitting(false);
                  if (!syncSuccess) {
                    setSyncUserError(
                      "Failed to sync your account to our database. Please try again."
                    );
                  } else {
                    toast.success("Account synced! Please continue.");
                  }
                }}
              >
                Retry Sync
              </Button>
            </div>
          )}
          <AnimatePresence mode="wait">
            {step === 1 && <div key="step1">{renderStep1()}</div>}
            {step === 2 && <div key="step2">{renderStep2()}</div>}
            {step === 3 && <div key="step3">{renderDemographics()}</div>}
            {step === 4 && <div key="step4">{renderLocation()}</div>}
            {step === 5 && <div key="step5">{renderLanguages()}</div>}
            {step === 6 && <div key="step6">{renderLifestyle()}</div>}
            {step === 7 && <div key="step7">{renderTravel()}</div>}
            {step === 8 && <div key="step8">{renderStep4()}</div>}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-transparent rounded-lg p-6 flex flex-col items-center space-y-4">
            <Loader2 className="h-11 w-11 animate-spin text-white" />
            {/* <p className="text-sm text-white">Saving your profile...</p> */}
          </div>
        </div>
      )}
    </div>
  );
}
