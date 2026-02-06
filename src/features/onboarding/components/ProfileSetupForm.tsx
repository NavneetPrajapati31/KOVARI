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
  Trash2,
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
import ProfileCropModal from "@/shared/components/profile-crop-modal";
import { uploadFiles } from "@/lib/uploadthing";
import CheckIcon from "@mui/icons-material/Check";
import CelebrationIcon from "@mui/icons-material/Celebration";
import { Avatar, Spinner } from "@heroui/react";
import { COUNTRIES } from "@/shared/utils/countries";

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
      message: "You must be atleast 18 years old",
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
const genderOptions = ["Male", "Female", "Other", "Prefer not to say"];

const languageOptions = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Russian",
  "Chinese (Mandarin)",
  "Japanese",
  "Korean",
  "Arabic",
  "Hindi",
  "Turkish",
  "Dutch",
  "Thai",
  "Vietnamese",
  "Indonesian",
  "Swedish",
  "Polish",
  "Greek",
];

const nationalityOptions = COUNTRIES;

const interestOptions = [
  // Travel & Adventure
  { id: "travel", label: "Travel" },
  { id: "hiking", label: "Hiking" },
  { id: "camping", label: "Camping" },
  { id: "backpacking", label: "Backpacking" },
  { id: "surfing", label: "Surfing" },
  { id: "skiing", label: "Skiing" },
  { id: "rock-climbing", label: "Rock Climbing" },

  // Food & Drink
  { id: "food", label: "Food" },
  { id: "cooking", label: "Cooking" },
  { id: "wine", label: "Wine" },
  { id: "coffee", label: "Coffee" },
  { id: "brunch", label: "Brunch" },

  // Fitness & Wellness
  { id: "fitness", label: "Fitness" },
  { id: "yoga", label: "Yoga" },
  { id: "running", label: "Running" },
  { id: "cycling", label: "Cycling" },
  { id: "dance", label: "Dance" },

  // Sports
  { id: "sports", label: "Sports" },
  { id: "football", label: "Football" },
  { id: "basketball", label: "Basketball" },
  { id: "tennis", label: "Tennis" },

  // Arts & Culture
  { id: "art", label: "Art" },
  { id: "photography", label: "Photography" },
  { id: "museums", label: "Museums" },
  { id: "concerts", label: "Concerts" },
  { id: "festivals", label: "Festivals" },

  // Music
  { id: "music", label: "Music" },
  { id: "live-music", label: "Live Music" },

  // Entertainment
  { id: "movies", label: "Movies" },
  { id: "netflix", label: "Netflix" },
  { id: "podcasts", label: "Podcasts" },

  // Reading & Learning
  { id: "reading", label: "Reading" },
  { id: "books", label: "Books" },

  // Social & Causes
  { id: "volunteering", label: "Volunteering" },

  // Lifestyle
  { id: "fashion", label: "Fashion" },

  // Pets & Animals
  { id: "dogs", label: "Dogs" },
  { id: "cats", label: "Cats" },

  // Nightlife
  { id: "nightlife", label: "Nightlife" },
  { id: "bars", label: "Bars" },
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
  const totalSteps = 6;
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [interestOpen, setInterestOpen] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const languageTriggerRef = useRef<HTMLDivElement>(null);
  const interestTriggerRef = useRef<HTMLDivElement>(null);
  const [languagePopoverWidth, setLanguagePopoverWidth] = useState<
    number | undefined
  >(undefined);
  const [interestPopoverWidth, setInterestPopoverWidth] = useState<
    number | undefined
  >(undefined);
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
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string>("");
  const [cropLoading, setCropLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { syncUser } = useSyncUserToSupabase();

  // Sync user to Supabase when component mounts
  useEffect(() => {
    syncUser();
  }, [syncUser]);

  // Measure trigger widths for popover content matching
  useEffect(() => {
    if (languageOpen && languageTriggerRef.current) {
      setLanguagePopoverWidth(languageTriggerRef.current.offsetWidth);
    }
  }, [languageOpen]);

  useEffect(() => {
    if (interestOpen && interestTriggerRef.current) {
      setInterestPopoverWidth(interestTriggerRef.current.offsetWidth);
    }
  }, [interestOpen]);

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

  const handleAvatarUpload = async (file: File) => {
    const acceptedFormats = ["PNG", "JPG", "JPEG", "WEBP"];
    const maxSizeInMB = 10;

    if (file.size > maxSizeInMB * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSizeInMB}MB`);
      return;
    }

    const fileExtension = file.name.split(".").pop()?.toUpperCase();
    if (!fileExtension || !acceptedFormats.includes(fileExtension)) {
      toast.error(`Only ${acceptedFormats.join(", ")} files are supported`);
      return;
    }

    const tempUrl = URL.createObjectURL(file);
    setTempImageUrl(tempUrl);
    setCropModalOpen(true);
  };

  const handleProfileFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      void handleAvatarUpload(files[0]);
    }
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleProfileCropComplete = async (croppedImageUrl: string) => {
    setCropLoading(true);
    try {
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], "profile-crop.jpg", {
        type: "image/jpeg",
      });

      const uploaded = await uploadFiles("profileImageUploader", {
        files: [file],
      });

      const url = uploaded?.[0]?.url;
      if (!url) {
        throw new Error("No URL returned from upload");
      }

      setProfileImage(url);
      step2Form.setValue("profilePic", url, { shouldValidate: true });
      toast.success("Profile photo updated successfully!");
      setCropModalOpen(false);
    } catch (error) {
      console.error("Cropped image upload error:", error);
      toast.error("Failed to upload profile photo");
    } finally {
      setCropLoading(false);
      if (tempImageUrl) {
        URL.revokeObjectURL(tempImageUrl);
        setTempImageUrl("");
      }
      if (croppedImageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(croppedImageUrl);
      }
    }
  };

  const handleCropModalOpenChange = (open: boolean) => {
    if (!open) {
      setCropModalOpen(false);
      if (tempImageUrl) {
        URL.revokeObjectURL(tempImageUrl);
        setTempImageUrl("");
      }
    } else {
      setCropModalOpen(true);
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
      const defaultTravelData: Step3Data = {
        destinations: "",
        tripFocus: [],
        frequency: "",
      };
      await submitProfileAndPreferences(defaultTravelData);
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
            "Accept-Language": "en",
            "User-Agent": "Kovari/1.0 (onboarding@kovari.app)",
          },
        });
        if (!res.ok) return;
        const data = (await res.json()) as Array<any>;

        const labels = data.map((d) => {
          const addr = d.address || {};
          const city =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.hamlet ||
            addr.suburb ||
            "";
          const region = addr.state || addr.county || "";
          const country = addr.country || "";

          // Simplified label: prefer "City, Country".
          // If no city, fall back to "Region, Country".
          const main = city || region;
          const parts = [main, country].filter(Boolean);
          return parts.join(", ") || (d.display_name as string);
        });

        // De-duplicate by simplified label, preserve order, and keep list short
        const seen = new Set<string>();
        const simplified = [];
        for (const label of labels) {
          if (!label || seen.has(label)) continue;
          seen.add(label);
          simplified.push(label);
          if (simplified.length >= 5) break;
        }

        setLocationSuggestions(simplified);
      } catch {}
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [locationQuery]);

  // Handle step 3 submission
  const onStep3Submit = async (data: Step3Data) => {
    console.log("Step 3 data:", data);
    setStep3Data(data);
    await submitProfileAndPreferences(data);
  };

  // Format date as ISO datetime string at midnight UTC to preserve the selected date
  const formatDateOnly = (date: Date | undefined): string | undefined => {
    if (!date) return undefined;
    // Get the date components in local timezone
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    // Create a new date at midnight UTC using the same year/month/day
    // This preserves the date without timezone shifting
    const utcDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    return utcDate.toISOString();
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
      // Use form values directly if state is not yet updated (React state updates are async)
      const currentStep1Data = step1Data || step1Form.getValues();
      const currentStep2Data = step2Data || step2Form.getValues();
      const completeData = {
        ...currentStep1Data,
        ...currentStep2Data,
        ...data,
      };
      console.log("Complete form data:", completeData);

      // Validate that all required fields are present
      if (
        !completeData.firstName ||
        !completeData.lastName ||
        !completeData.username
      ) {
        throw new Error("Please complete all required fields in step 1");
      }
      if (
        !completeData.location ||
        !completeData.nationality ||
        !completeData.jobType
      ) {
        throw new Error("Please complete all required fields in step 4");
      }
      if (!completeData.languages || completeData.languages.length === 0) {
        throw new Error("Please select at least one language");
      }

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

      // Ensure all required fields have valid values
      const formattedBirthday = formatDateOnly(completeData.birthday);
      if (!formattedBirthday) {
        throw new Error("Birthday is required");
      }

      const profileData = {
        name: `${completeData.firstName} ${completeData.lastName}`,
        username: completeData.username,
        age: Number.isFinite(numericAge) ? numericAge : 18,
        gender: completeData.gender,
        birthday: formattedBirthday,
        bio: completeData.bio || "",
        profile_photo:
          typeof completeData.profilePic === "string" &&
          /^https?:\/\//i.test(completeData.profilePic)
            ? (completeData.profilePic as string)
            : undefined,
        location: completeData.location || "",
        languages:
          Array.isArray(completeData.languages) &&
          completeData.languages.length > 0
            ? completeData.languages
            : [],
        nationality: completeData.nationality || "",
        job: completeData.jobType || "",
        religion: completeData.religion || "",
        smoking: completeData.smoking || "",
        drinking: completeData.drinking || "",
        personality: completeData.personality || "",
        food_preference: completeData.foodPreference || "",
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
          birthday: formatDateOnly(completeData.birthday),
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
          {[1, 2, 3, 4, 5, 6].map((stepNum) => (
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
        <h1 className="text-lg font-bold text-foreground mb-1">
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
                      <Input
                        placeholder="John"
                        className="h-9 text-sm border-input focus:border-primary focus:ring-primary rounded-lg placeholder:text-muted-foreground "
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
                      <Input
                        placeholder="Doe"
                        className="h-9 text-sm border-input focus:border-primary focus:ring-primary rounded-lg placeholder:text-muted-foreground"
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
                    <Input
                      placeholder="your_username"
                      className="h-9 text-sm border-input focus:border-primary focus:ring-primary rounded-lg placeholder:text-muted-foreground w-full"
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
                      <Spinner
                        variant="spinner"
                        size="sm"
                        classNames={{ spinnerBars: "bg-primary" }}
                        className="absolute right-2.5 top-2"
                      />
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
        <h1 className="text-lg font-bold text-foreground mb-1">
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
                  <div className="flex flex-col items-center gap-0 md:gap-4 rounded-xl border border-input px-4 py-4 md:flex-row md:items-center">
                    <div className="h-20 w-20 rounded-full bg-background flex items-center justify-center overflow-hidden md:h-16 md:w-16">
                      {profileImage ? (
                        <Image
                          src={profileImage}
                          alt="Profile"
                          width={80}
                          height={80}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <Avatar
                          src=""
                          showFallback
                          fallback={
                            <svg
                              className="w-full h-full text-gray-400"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <circle cx="12" cy="8" r="4" />
                              <rect x="4" y="14" width="16" height="6" rx="3" />
                            </svg>
                          }
                          className="h-20 w-20 bg-muted"
                        />
                      )}
                    </div>
                    <div className="flex w-full flex-col gap-1 md:w-auto">
                      <div className="flex items-center gap-1 justify-center md:justify-start">
                        <Button
                          type="button"
                          size="sm"
                          className="mt-4 md:mt-0 bg-transparent border border-border hover:bg-gray-200 shadow-none rounded-lg px-3 py-1 text-xs transition-all duration-300 disabled:opacity-50"
                          aria-label="Upload profile photo"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={cropLoading}
                        >
                          {cropLoading ? (
                            <Spinner
                              variant="spinner"
                              size="sm"
                              classNames={{ spinnerBars: "bg-black" }}
                            />
                          ) : (
                            <span className="text-xs text-primary">
                              {profileImage
                                ? "Change profile picture"
                                : "Upload profile picture"}
                            </span>
                          )}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="mt-4 md:mt-0 px-3 py-1 bg-transparent border border-border shadow-none rounded-lg text-destructive hover:bg-gray-200 transition-all duration-300 disabled:opacity-50"
                          aria-label="Remove profile photo"
                          onClick={() => {
                            if (!profileImage || cropLoading) return;
                            setProfileImage(null);
                            field.onChange(null);
                          }}
                          disabled={!profileImage || cropLoading}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp"
                        onChange={handleProfileFileSelect}
                        className="hidden"
                        aria-label="Upload profile photo"
                      />
                      <p className="text-[11px] text-muted-foreground text-center md:text-left hidden md:block">
                        Recommended at least 400×400px. JPG, PNG or WEBP, up to
                        10MB.
                      </p>
                    </div>
                  </div>
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
                    <Textarea
                      placeholder="Tell us about yourself..."
                      className="min-h-[80px] text-sm rounded-lg resize-none placeholder:text-muted-foreground"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          {/* Navigation Buttons */}
          <div className="flex space-x-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              className="flex-1 h-9 text-sm border-input text-muted-foreground hover:bg-muted rounded-lg transition-all"
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
        <h1 className="text-lg font-bold text-foreground mb-1">About you</h1>
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
          <div className="flex space-x-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              className="flex-1 h-9 text-sm border-input text-muted-foreground hover:bg-muted rounded-lg transition-all"
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
        <h1 className="text-lg font-bold text-foreground mb-1">
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
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Search your location"
                      className="h-9 text-sm border-input focus:border-primary focus:ring-primary rounded-lg placeholder:text-muted-foreground"
                      value={locationQuery || field.value || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setLocationQuery(value);
                        field.onChange(value);
                      }}
                    />
                    {locationSuggestions.length > 0 && (
                      <div className="absolute z-20 mt-1 w-full rounded-lg border bg-popover shadow-lg max-h-56 overflow-auto">
                        {locationSuggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm text-muted-foreground hover:bg-gray-100"
                            onClick={() => {
                              field.onChange(suggestion);
                              setLocationQuery(suggestion);
                              setLocationSuggestions([]);
                            }}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </FormControl>
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
                          <div className="flex items-center text-foreground font-medium">
                            {field.value ? (
                              nationalityOptions.find((n) => n === field.value)
                            ) : (
                              <span className="text-muted-foreground font-normal">
                                Select nationality
                              </span>
                            )}
                          </div>
                          <ChevronRight className="ml-2 h-3.5 w-3.5 shrink-0" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full py-2 px-1" align="start">
                      <Command>
                        {/* <CommandInput
                          placeholder="Search nationality..."
                          className="text-sm placeholder:text-muted-foreground"
                        /> */}
                        <CommandList>
                          <CommandGroup className="max-h-64 overflow-auto hide-scrollbar">
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
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="Enter your job type"
                        className="h-9 text-sm border-input focus:border-primary focus:ring-primary rounded-lg placeholder:text-muted-foreground"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
          <div className="flex space-x-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              className="flex-1 h-9 text-sm border-input text-muted-foreground hover:bg-muted rounded-lg transition-all"
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
        <h1 className="text-lg font-bold text-foreground mb-1">
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
                      <div ref={languageTriggerRef}>
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
                                {field.value?.length
                                  ? `${field.value.length} language${field.value.length > 1 ? "s" : ""} selected`
                                  : "Select languages"}
                              </div>
                              <ChevronRight className="ml-2 h-3.5 w-3.5 shrink-0 " />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                      </div>
                      <PopoverContent
                        className="p-0"
                        align="start"
                        style={{
                          width: languagePopoverWidth
                            ? `${languagePopoverWidth}px`
                            : undefined,
                        }}
                      >
                        <Command>
                          <CommandList>
                            <CommandGroup className="max-h-64 w-full overflow-auto hide-scrollbar">
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
                                  <span className="font-medium">
                                    {language}
                                  </span>
                                </div>
                              ))}
                            </CommandGroup>
                          </CommandList>
                          {field.value?.length > 0 && (
                            <div className="border-t p-4">
                              <div className="flex flex-wrap gap-1">
                                {field.value.map((language) => (
                                  <Badge
                                    key={language}
                                    variant="secondary"
                                    className="text-xs bg-primary-light text-primary px-2 py-1"
                                  >
                                    {language}
                                    <button
                                      type="button"
                                      className="ml-1 text-primary rounded-full"
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
                            className="text-xs bg-primary-light text-primary"
                          >
                            {language}
                            <button
                              type="button"
                              className="ml-1 text-primary"
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
                      <div ref={interestTriggerRef}>
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
                                {field.value?.length
                                  ? `${field.value.length} interest${field.value.length > 1 ? "s" : ""} selected`
                                  : "Select interests"}
                              </div>
                              <ChevronRight className="ml-2 h-3.5 w-3.5 shrink-0 " />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                      </div>
                      <PopoverContent
                        className="p-0"
                        align="start"
                        style={{
                          width: interestPopoverWidth
                            ? `${interestPopoverWidth}px`
                            : undefined,
                        }}
                      >
                        <Command>
                          <CommandList>
                            <CommandGroup className="max-h-64 overflow-auto hide-scrollbar">
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
                                  <span className="font-medium">
                                    {interest.label}
                                  </span>
                                </div>
                              ))}
                            </CommandGroup>
                          </CommandList>
                          {field.value?.length > 0 && (
                            <div className="border-t p-4">
                              <div className="flex flex-wrap gap-1">
                                {field.value.map((interestId) => {
                                  const interest = interestOptions.find(
                                    (opt) => opt.id === interestId
                                  );
                                  return interest ? (
                                    <Badge
                                      key={interest.id}
                                      variant="secondary"
                                      className="text-xs bg-primary-light text-primary px-2 py-1"
                                    >
                                      {interest.label}
                                      <button
                                        type="button"
                                        className="ml-1 text-primary rounded-full"
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
                              className="text-xs bg-primary-light text-primary"
                            >
                              {interest.label}
                              <button
                                type="button"
                                className="ml-1 text-primary"
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
          <div className="flex space-x-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              className="flex-1 h-9 text-sm border-input text-muted-foreground hover:bg-muted rounded-lg transition-all"
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
        <h1 className="text-lg font-bold text-foreground mb-1">Lifestyle</h1>
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
          <div className="flex space-x-2 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              className="flex-1 h-9 text-sm border-input text-muted-foreground hover:bg-muted rounded-lg transition-all"
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
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckIcon className="w-6 h-6 text-primary-foreground" />
        </div>
        <h1 className="text-lg font-bold text-foreground mb-1">
          Welcome aboard! 🎉
        </h1>
        <p className="text-sm text-muted-foreground">
          Your profile has been successfully created. You&apos;re all set to get
          started!
        </p>
      </div>

      <Button
        onClick={() => router.replace("/dashboard")}
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
            {step === 8 && <div key="step8">{renderStep4()}</div>}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Profile photo crop modal */}
      <ProfileCropModal
        open={cropModalOpen}
        onOpenChange={handleCropModalOpenChange}
        imageUrl={tempImageUrl}
        onCropComplete={handleProfileCropComplete}
        isLoading={cropLoading}
      />

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-transparent rounded-lg p-6 flex flex-col items-center space-y-4">
            <Spinner
              variant="spinner"
              size="md"
              classNames={{ spinnerBars: "bg-primary-foreground" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
