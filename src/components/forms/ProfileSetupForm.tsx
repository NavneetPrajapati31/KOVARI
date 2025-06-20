"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  UserRound,
  Smartphone,
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandList,
  CommandInput,
  CommandGroup,
  CommandEmpty,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import { ImageUpload } from "@/components/image-upload";
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
    phoneNumber: z
      .string()
      .min(1, { message: "Please enter your phone number" })
      .regex(/^\+?[0-9]{8,15}$/, {
        message: "Please enter a valid phone number",
      }),
    age: z.coerce
      .number()
      .min(18, { message: "You must be at least 18 years old" })
      .max(120),
    gender: z.string().min(1, { message: "Please select your gender" }),
    birthday: z.date({
      required_error: "Your date of birth is required.",
    }),
  })
  .refine(
    (data) => {
      const today = new Date();
      const age = today.getFullYear() - data.birthday.getFullYear();
      const monthDiff = today.getMonth() - data.birthday.getMonth();
      const dayDiff = today.getDate() - data.birthday.getDate();

      const exactAge =
        monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

      return Math.abs(exactAge - data.age) <= 1;
    },
    {
      message: "Birthday must match the entered age",
      path: ["birthday"],
    }
  );

const step2Schema = z.object({
  bio: z
    .string()
    .max(300, { message: "Bio must be less than 300 characters" })
    .optional(),
  profilePic: z.any().optional(),
  nationality: z.string().min(1, { message: "Please select your nationality" }),
  jobType: z.string().min(1, { message: "Please select your job type" }),
  languages: z
    .array(z.string())
    .min(1, { message: "Please select at least one language" }),
  interests: z
    .array(z.string())
    .min(1, { message: "Please select at least one interest" }),
});

const step3Schema = z.object({
  destinations: z.string().min(1, "Please enter at least one destination"),
  from: z.string().min(1, "Start date is required"),
  to: z.string().min(1, "End date is required"),
  mode: z.enum(["solo", "group"]).optional(),
  interests: z.array(z.string()).min(1, "Please select at least one interest"),
  activityDescription: z.string().optional(),
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

const interestsList = [
  "Hiking",
  "Photography",
  "Culture",
  "Food",
  "Music",
  "History",
  "Adventure",
  "Nightlife",
  "Local Tours",
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
  const totalSteps = 5;
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [interestOpen, setInterestOpen] = useState(false);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const [step3Data, setStep3Data] = useState<Step3Data | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"solo" | "group" | null>(
    null
  );
  const [usernameCheckLoading, setUsernameCheckLoading] = useState(false);
  const [usernameCheckError, setUsernameCheckError] = useState<string | null>(
    null
  );
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);

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
      phoneNumber: "",
      age: 18,
      gender: "",
      birthday: undefined,
    },
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      bio: "",
      profilePic: null,
      nationality: "",
      jobType: "",
      languages: [],
      interests: [],
    },
  });

  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      destinations: "",
      from: "",
      to: "",
      mode: undefined,
      interests: [],
      activityDescription: "",
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

  // Handle step 1 submission with async username check
  const onStep1Submit = async (data: Step1Data) => {
    setUsernameCheckError(null);
    const isUnique = await checkUsernameUnique(data.username);
    if (!isUnique) {
      toast.error("Username is already taken");
      return;
    }
    setStep1Data(data);
    setStep(2);
  };

  // Handle step 2 submission
  const onStep2Submit = (data: Step2Data) => {
    console.log("Step 2 data:", data);
    setStep2Data(data);
    setStep(3);
  };

  // Handle step 3 submission
  const onStep3Submit = (data: Step3Data) => {
    console.log("Step 3 data:", data);
    setStep3Data(data);
    setStep(4);
  };

  const onStep4Submit = async () => {
    if (!selectedMode) {
      toast.error("Please select a travel style");
      return;
    }
    if (step3Data) {
      await submitProfileAndPreferences(step3Data);
    } else {
      setStep(5);
    }
  };

  // Original step 3 submission logic moved to a separate function
  const submitProfileAndPreferences = async (data: Step3Data) => {
    try {
      setIsSubmitting(true);
      const completeData = { ...step1Data, ...step2Data, ...data };
      console.log("Complete form data:", completeData);

      // Transform data to match API schema
      const profileData = {
        name: `${completeData.firstName} ${completeData.lastName}`,
        username: completeData.username,
        age: completeData.age,
        gender: completeData.gender,
        birthday: completeData.birthday?.toISOString(),
        bio: completeData.bio || "",
        profile_photo: completeData.profilePic || undefined,
        languages: completeData.languages,
        nationality: completeData.nationality,
        job: completeData.jobType,
      };

      const travelPreferencesData = {
        destinations: completeData.destinations
          ? completeData.destinations.split(",").map((dest) => dest.trim())
          : [],
        start_date: completeData.from,
        end_date: completeData.to,
        interests: completeData.interests,
      };

      if (!user) {
        throw new Error("User not found");
      }

      // Step 1: Update Clerk user profile metadata
      await user.update({
        unsafeMetadata: {
          imageUrl: completeData.profilePic || undefined,
          phoneNumber: completeData.phoneNumber,
          age: completeData.age,
          gender: completeData.gender,
          birthday: completeData.birthday?.toISOString(),
          bio: completeData.bio,
          nationality: completeData.nationality,
          jobType: completeData.jobType,
          languages: completeData.languages,
          interests: completeData.interests,
          travel_preferences: travelPreferencesData,
        },
      });

      // Step 2: Sync user to Supabase
      const syncSuccess = await syncUser();
      if (!syncSuccess) {
        throw new Error("Failed to sync user data");
      }

      // Step 4: Save travel mode
      const travelModeRes = await fetch("/api/travel-mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode: selectedMode }),
      });

      if (!travelModeRes.ok) {
        throw new Error("Failed to save travel mode");
      }

      // Step 5: Submit profile data to API
      const profileRes = await fetch("/api/profile", {
        method: "POST",
        body: JSON.stringify(profileData),
        headers: { "Content-Type": "application/json" },
      });

      if (!profileRes.ok) {
        let errorMsg = "Failed to save profile";
        const contentType = profileRes.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await profileRes.json();
          errorMsg = error.error || errorMsg;
        } else {
          errorMsg = await profileRes.text();
        }
        throw new Error(errorMsg);
      }

      // Step 6: Submit travel preferences data to API
      const preferencesRes = await fetch("/api/travel-preferences", {
        method: "POST",
        body: JSON.stringify(travelPreferencesData),
        headers: { "Content-Type": "application/json" },
      });

      if (!preferencesRes.ok) {
        let errorMsg = "Failed to save travel preferences";
        const contentType = preferencesRes.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await preferencesRes.json();
          errorMsg = error.error || errorMsg;
        } else {
          errorMsg = await preferencesRes.text();
        }
        throw new Error(errorMsg);
      }

      toast.success("Profile saved successfully!");
      setStep(5);
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
          {[1, 2, 3, 4, 5].map((stepNum) => (
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

  // Render step 1 form - Basic Info
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
          onSubmit={step1Form.handleSubmit(onStep1Submit)}
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

          {/* Phone Number */}
          <FormField
            control={step1Form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground">
                  Phone Number
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Smartphone className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="+91 999-999-9999"
                      className="pl-8 h-9 text-sm border-input focus:border-primary focus:ring-primary rounded-lg placeholder:text-muted-foreground"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Age and Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField
              control={step1Form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-muted-foreground">
                    Age
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter your age"
                      className="h-9 text-sm border-input focus:border-primary focus:ring-primary rounded-lg !placeholder:text-muted-foreground"
                      {...field}
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
                      <SelectTrigger className="w-full h-9 text-sm border-input focus:border-primary focus:ring-primary rounded-lg placeholder:text-muted-foreground">
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
          </div>

          {/* Birthday */}
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

  // Render step 2 form - Profile Details
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
          Complete your profile
        </h1>
        <p className="text-sm text-muted-foreground">
          Add details to personalize your experience
        </p>
      </div>

      <Form {...step2Form}>
        <form
          onSubmit={step2Form.handleSubmit(onStep2Submit)}
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

          {/* Nationality and Job Type */}
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
                                  (nationality) => nationality === field.value
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
                          {/* <CommandEmpty className="text-sm text-muted-foreground">
                            No nationality found.
                          </CommandEmpty> */}
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
                              ? jobTypeOptions.find(
                                  (jobType) => jobType === field.value
                                )
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
                          {/* <CommandEmpty className="text-sm text-muted-foreground">
                            No job type found.
                          </CommandEmpty> */}
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

          {/* Languages */}
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
                            ? `${field.value.length} language${
                                field.value.length > 1 ? "s" : ""
                              } selected`
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
                        {/* <CommandEmpty className="text-sm text-muted-foreground">
                          No language found.
                        </CommandEmpty> */}
                        <CommandGroup className="max-h-64 overflow-auto">
                          {languageOptions.map((language) => (
                            <div
                              key={language}
                              className="px-2 py-1.5 text-sm text-muted-foreground rounded-sm cursor-pointer hover:bg-gray-100 flex items-center"
                              onClick={() => {
                                const newValue = field.value?.includes(language)
                                  ? field.value.filter((l) => l !== language)
                                  : [...(field.value || []), language];
                                field.onChange(newValue);
                                // Keep popover open for multiple selections
                                setLanguageOpen(true);
                              }}
                            >
                              {field.value?.includes(language) && (
                                <CheckIcon
                                  fontSize="inherit"
                                  className="mr-2 text-muted-foreground flex-shrink-0"
                                />
                              )}
                              {!field.value?.includes(language) && (
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

          {/* Interests */}
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
                            ? `${field.value.length} interest${
                                field.value.length > 1 ? "s" : ""
                              } selected`
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
                        {/* <CommandEmpty className="text-sm text-muted-foreground">
                          No interest found.
                        </CommandEmpty> */}
                        <CommandGroup className="max-h-64 overflow-auto">
                          {interestOptions.map((interest) => (
                            <div
                              key={interest.id}
                              className="px-2 py-1.5 text-sm text-muted-foreground rounded-sm cursor-pointer hover:bg-gray-100 flex items-center"
                              onClick={() => {
                                const newValue = field.value?.includes(
                                  interest.id
                                )
                                  ? field.value.filter((i) => i !== interest.id)
                                  : [...(field.value || []), interest.id];
                                field.onChange(newValue);
                                // Keep popover open for multiple selections
                                setInterestOpen(true);
                              }}
                            >
                              {field.value?.includes(interest.id) && (
                                <CheckIcon
                                  fontSize="inherit"
                                  className="mr-2 text-muted-foreground flex-shrink-0"
                                />
                              )}
                              {!field.value?.includes(interest.id) && (
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

  // Render step 3 form - Travel Preferences
  const renderStep3 = () => (
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
          onSubmit={step3Form.handleSubmit(onStep3Submit)}
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

          {/* Travel Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField
              control={step3Form.control}
              name="from"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-xs font-medium text-muted-foreground">
                    Start Date
                  </FormLabel>
                  <FormControl>
                    <DatePicker
                      startYear={new Date().getFullYear()}
                      endYear={new Date().getFullYear() + 5}
                      date={field.value ? new Date(field.value) : undefined}
                      onDateChange={(date) =>
                        field.onChange(date?.toISOString())
                      }
                      disabled={{
                        before: new Date(),
                        after: new Date(new Date().getFullYear() + 5, 11, 31),
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={step3Form.control}
              name="to"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-xs font-medium text-muted-foreground">
                    End Date
                  </FormLabel>
                  <FormControl>
                    <DatePicker
                      startYear={new Date().getFullYear()}
                      endYear={new Date().getFullYear() + 5}
                      date={field.value ? new Date(field.value) : undefined}
                      onDateChange={(date) =>
                        field.onChange(date?.toISOString())
                      }
                      disabled={{
                        before: new Date(),
                        after: new Date(new Date().getFullYear() + 5, 11, 31),
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

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
            name="interests"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground">
                  Trip Focus / Activities
                </FormLabel>
                <div className="flex flex-wrap gap-2">
                  {interestsList.map((interest) => (
                    <Badge
                      key={interest}
                      variant={
                        field.value?.includes(interest) ? "default" : "outline"
                      }
                      className="cursor-pointer px-4 py-2 text-xs hover:bg-primary hover:text-white transition-colors"
                      onClick={() => {
                        const newValue = field.value?.includes(interest)
                          ? field.value.filter((h) => h !== interest)
                          : [...(field.value || []), interest];
                        field.onChange(newValue);
                      }}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Activities Description */}
          <FormField
            control={step3Form.control}
            name="activityDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground">
                  Describe what kind of activities you are looking for
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lightbulb className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Textarea
                      placeholder="Tell us about your ideal trip activities (optional)"
                      className="pl-8 min-h-[80px] text-sm border-input focus:border-primary focus:ring-primary rounded-lg resize-none placeholder:text-muted-foreground"
                      {...field}
                    />
                  </div>
                </FormControl>
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

  // Render step 4 - Travel Mode Selection
  const renderStep4 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Choose Your Travel Style
        </h1>
        <p className="text-sm text-muted-foreground">
          Select how you prefer to travel and connect with others
        </p>
      </div>

      <div className="grid grid-cols-1 min-[500px]:grid-cols-2 gap-4">
        {/* Solo Traveler Card */}
        <div
          className={cn(
            "relative h-[16rem] bg-card rounded-xl overflow-hidden group transition-colors cursor-pointer",
            selectedMode === "solo" && "ring-4 ring-primary"
          )}
          onClick={() => setSelectedMode("solo")}
        >
          <div className="absolute inset-0 bg-primary hover:bg-primary-hover transition-all">
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h2 className="text-md font-semibold text-white mb-2">
              Solo Traveler
            </h2>
            <p className="text-xs text-white/90 leading-relaxed mb-4">
              Perfect for independent explorers who love the freedom to discover
              at their own pace.
            </p>
          </div>
        </div>

        {/* Group Travel Card */}
        <div
          className={cn(
            "relative h-[16rem] bg-card rounded-xl overflow-hidden group transition-colors cursor-pointer",
            selectedMode === "group" && "ring-4 ring-primary"
          )}
          onClick={() => setSelectedMode("group")}
        >
          <div className="absolute inset-0 bg-primary hover:bg-primary-hover transition-all">
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h2 className="text-md font-semibold text-white mb-2">
              Group Traveler
            </h2>
            <p className="text-xs text-white/90 leading-relaxed mb-4">
              For groups who want to plan, coordinate, and share amazing
              experiences together.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center pt-3">
        <p className="text-muted-foreground text-xs font-medium">
          Don&apos;t worry, you can always switch between modes or create
          different travel plans later
        </p>
      </div>

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
          type="button"
          onClick={onStep4Submit}
          className="flex-1 h-9 text-sm bg-primary hover:bg-primary-hover text-primary-foreground font-medium rounded-lg transition-all duration-200"
        >
          Continue
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );

  // Render step 5 - Success
  const renderStep5 = () => (
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
        onClick={() => (window.location.href = "/")}
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
          <AnimatePresence mode="wait">
            {step === 1 && <div key="step1">{renderStep1()}</div>}
            {step === 2 && <div key="step2">{renderStep2()}</div>}
            {step === 3 && <div key="step3">{renderStep3()}</div>}
            {step === 4 && <div key="step4">{renderStep4()}</div>}
            {step === 5 && <div key="step5">{renderStep5()}</div>}
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
