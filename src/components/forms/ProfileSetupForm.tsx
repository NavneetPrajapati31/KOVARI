"use client";

import React, { useState, useEffect } from "react";
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
  CloudUpload,
  Lightbulb,
  CircleCheckBig,
  ChevronLeft,
  ChevronRight,
  ScanFace,
  X,
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
  FormDescription,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandList,
  CommandInput,
  CommandItem,
  CommandGroup,
  CommandEmpty,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import ProfileImageUpload from "@/components/UploadButton";

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
    .max(500, { message: "Bio must be less than 500 characters" })
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

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

// Sample data for dropdowns
const genderOptions = ["Male", "Female", "Prefer not to say"];
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

export default function ProfileSetupForm() {
  const { user } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 2;
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [interestOpen, setInterestOpen] = useState(false);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Handle step 1 submission
  const onStep1Submit = (data: Step1Data) => {
    console.log("Step 1 data:", data);
    setStep1Data(data);
    setStep(2);
  };

  // Handle step 2 submission
  const onStep2Submit = async (data: Step2Data) => {
    try {
      setIsSubmitting(true);
      console.log("Step 2 data:", data);
      const completeData = { ...step1Data, ...data };
      console.log("Complete form data:", completeData);

      // Transform data to match API schema
      const apiData = {
        name: `${completeData.firstName} ${completeData.lastName}`,
        age: completeData.age,
        gender: completeData.gender,
        birthday: completeData.birthday?.toISOString(),
        bio: completeData.bio || "",
        profile_photo: completeData.profilePic || undefined,
        languages: completeData.languages,
        nationality: completeData.nationality,
        job: completeData.jobType,
      };

      // Update Clerk user profile
      if (user) {
        // First update the metadata
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
          },
        });

        // Then update the name
        await user.update({
          unsafeMetadata: {
            firstName: completeData.firstName,
            lastName: completeData.lastName,
          },
        });

        // Ensure user is synced to Supabase before submitting profile
        const syncSuccess = await syncUser();
        if (!syncSuccess) {
          toast.error("Failed to sync user data. Please try again.");
          return;
        }

        // Submit to our API
        const res = await fetch("/api/profile", {
          method: "POST",
          body: JSON.stringify(apiData),
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to save profile");
        }

        toast.success("Profile saved successfully!");
        setStep(3);
      }
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
          <span className="text-xs font-medium text-slate-600">
            Step {step} of {totalSteps}
          </span>
        </div>
        <div className="flex space-x-1">
          {[1, 2].map((stepNum) => (
            <div key={stepNum} className="flex-1">
              <div
                className={`h-1.5 rounded-full ${
                  stepNum <= step ? "bg-[#1877F2]" : "bg-slate-200"
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
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          Let&apos;s get started
        </h1>
        <p className="text-sm text-slate-600">
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
                  <FormLabel className="text-xs font-medium text-slate-700">
                    First Name
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <UserRound className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-600" />
                      <Input
                        placeholder="John"
                        className="pl-8 h-9 text-sm border-gray-600 focus:border-[#1877F2] focus:ring-[#1877F2] rounded-lg placeholder:text-gray-600"
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
                  <FormLabel className="text-xs font-medium text-slate-700">
                    Last Name
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <UserRound className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-600" />
                      <Input
                        placeholder="Doe"
                        className="pl-8 h-9 text-sm border-gray-600 focus:border-[#1877F2] focus:ring-[#1877F2] rounded-lg placeholder:text-gray-600"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* Phone Number */}
          <FormField
            control={step1Form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-slate-700">
                  Phone Number
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Smartphone className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-600" />
                    <Input
                      placeholder="+91 999-999-9999"
                      className="pl-8 h-9 text-sm border-gray-600 focus:border-[#1877F2] focus:ring-[#1877F2] rounded-lg placeholder:text-gray-600"
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
                  <FormLabel className="text-xs font-medium text-gray-600">
                    Age
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="18"
                      className="h-9 text-sm border-gray-600 focus:border-[#1877F2] focus:ring-[#1877F2] rounded-lg placeholder:text-gray-600"
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
                  <FormLabel className="text-xs font-medium text-gray-600">
                    Gender
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full h-9 text-sm border-gray-600 focus:border-[#1877F2] focus:ring-[#1877F2] rounded-lg placeholder:text-gray-600">
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
                <FormLabel className="text-xs font-medium text-gray-600">
                  Date of Birth
                </FormLabel>
                <FormControl>
                  <DatePicker
                    startYear={2000}
                    endYear={new Date().getFullYear()}
                    date={field.value}
                    onDateChange={field.onChange}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="!mt-6 w-full h-9 text-sm bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium rounded-lg transition-all duration-200"
          >
            Continue
            <ChevronRight className=" h-3.5 w-3.5" />
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
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          Complete your profile
        </h1>
        <p className="text-sm text-slate-600">
          Add details to personalize your experience
        </p>
      </div>

      <Form {...step2Form}>
        <form
          onSubmit={step2Form.handleSubmit(onStep2Submit)}
          className="space-y-4"
        >
          {/* Profile Picture */}
          <div className="flex flex-col items-center space-y-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 border-2 border-white">
                {profileImage ? (
                  <Image
                    src={profileImage}
                    alt="Profile"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ScanFace className="w-6 h-6 text-slate-400" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1">
                <ProfileImageUpload
                  onUpload={(url) => {
                    console.log("Received image URL:", url);
                    setProfileImage(url);
                    step2Form.setValue("profilePic", url);
                    console.log("Profile image state updated:", url);
                  }}
                />
              </div>
            </div>
            <p className="text-xs text-slate-500">Upload profile picture</p>
          </div>

          {/* Bio */}
          <FormField
            control={step2Form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-slate-700">
                  Bio (Optional)
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lightbulb className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-600" />
                    <Textarea
                      placeholder="Tell us about yourself..."
                      className="pl-8 min-h-[80px] text-sm border-gray-600 focus:border-[#1877F2] focus:ring-[#1877F2] rounded-lg resize-none placeholder:text-gray-600"
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
                <FormItem>
                  <FormLabel className="text-xs font-medium text-gray-600">
                    Nationality
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full h-9 text-sm border-gray-600 focus:border-[#1877F2] focus:ring-[#1877F2] rounded-lg">
                        <Earth className="mr-2 h-3.5 w-3.5 text-gray-600" />
                        <SelectValue placeholder="Select nationality" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {nationalityOptions.map((nationality) => (
                        <SelectItem
                          key={nationality}
                          value={nationality}
                          className="text-sm"
                        >
                          {nationality}
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
              name="jobType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-gray-600">
                    Job Type
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full h-9 text-sm border-gray-600 focus:border-[#1877F2] focus:ring-[#1877F2] rounded-lg">
                        <Building2 className="mr-2 h-3.5 w-3.5 text-gray-600" />
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {jobTypeOptions.map((jobType) => (
                        <SelectItem
                          key={jobType}
                          value={jobType}
                          className="text-sm"
                        >
                          {jobType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <FormLabel className="text-xs font-medium text-slate-700">
                  Languages
                </FormLabel>
                <Popover open={languageOpen} onOpenChange={setLanguageOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "bg-white w-full h-9 text-sm font-thin justify-between border-gray-600 focus:border-[#1877F2] focus:ring-[#1877F2] rounded-lg",
                          !field.value?.length &&
                            "text-gray-600 hover:bg-transparent hover:text-gray-600"
                        )}
                      >
                        <div className="flex items-center">
                          <MessageSquareText className="mr-2 h-3.5 w-3.5 text-gray-600" />
                          {field.value?.length
                            ? `${field.value.length} language${
                                field.value.length > 1 ? "s" : ""
                              }`
                            : "Select languages"}
                        </div>
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search languages..."
                        className="text-sm placeholder:text-gray-600"
                      />
                      <CommandList>
                        <CommandEmpty className="text-sm text-gray-600">
                          No language found.
                        </CommandEmpty>
                        <CommandGroup className="max-h-48 overflow-auto">
                          {languageOptions.map((language) => (
                            <CommandItem
                              key={language}
                              className="text-sm !text-gray-600"
                              onSelect={() => {
                                const newValue = field.value?.includes(language)
                                  ? field.value.filter((l) => l !== language)
                                  : [...(field.value || []), language];
                                field.onChange(newValue);
                              }}
                            >
                              <Checkbox
                                checked={field.value?.includes(language)}
                                className="mr-2 h-3.5 w-3.5"
                              />
                              {language}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {field.value?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {field.value.map((language) => (
                      <Badge
                        key={language}
                        variant="secondary"
                        className="text-xs bg-[#E7F3FF] text-[#1877F2] hover:bg-[#DBE7F2]"
                      >
                        {language}
                        <button
                          type="button"
                          className="ml-1 text-[#1877F2] hover:text-[#166FE5]"
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
                <FormLabel className="text-xs font-medium text-slate-700">
                  Interests
                </FormLabel>
                <Popover open={interestOpen} onOpenChange={setInterestOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "bg-white w-full h-9 text-sm font-thin justify-between border-gray-600 focus:border-[#1877F2] focus:ring-[#1877F2] rounded-lg",
                          !field.value?.length &&
                            "text-gray-600  hover:bg-transparent hover:text-gray-600"
                        )}
                      >
                        {field.value?.length
                          ? `${field.value.length} interest${
                              field.value.length > 1 ? "s" : ""
                            }`
                          : "Select interests"}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search interests..."
                        className="text-sm  placeholder:text-gray-600"
                      />
                      <CommandList>
                        <CommandEmpty className="text-sm text-gray-600">
                          No interest found.
                        </CommandEmpty>
                        <CommandGroup className="max-h-48 overflow-auto">
                          {interestOptions.map((interest) => (
                            <CommandItem
                              key={interest.id}
                              className="text-sm  !text-gray-600"
                              onSelect={() => {
                                const newValue = field.value?.includes(
                                  interest.id
                                )
                                  ? field.value.filter((i) => i !== interest.id)
                                  : [...(field.value || []), interest.id];
                                field.onChange(newValue);
                              }}
                            >
                              <Checkbox
                                checked={field.value?.includes(interest.id)}
                                className="mr-2 h-3.5 w-3.5"
                              />
                              {interest.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
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
                          className="text-xs bg-[#E7F3FF] text-[#1877F2] hover:bg-[#DBE7F2]"
                        >
                          {interest.label}
                          <button
                            type="button"
                            className="ml-1 text-[#1877F2] hover:text-[#166FE5]"
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
          <div className="flex space-x-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              className="bg-white flex-1 h-9 text-sm border-gray-600 text-gray-600 hover:bg-gray-600 hover:text-white rounded-lg"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 h-9 text-sm bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium rounded-lg transition-all duration-200"
            >
              Complete
              <ChevronRight className=" h-3.5 w-3.5" />
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );

  // Success step
  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center py-8"
    >
      <div className="w-16 h-16 bg-[#1877F2] rounded-full flex items-center justify-center mx-auto mb-4">
        <CircleCheckBig className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        Welcome aboard! 🎉
      </h2>
      <p className="text-sm text-slate-600 mb-6 max-w-sm mx-auto">
        Your profile has been successfully created. You&apos;re all set to get
        started!
      </p>
      <Button
        onClick={() => (window.location.href = "/dashboard")}
        className="h-9 px-6 text-sm bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium rounded-lg transition-all duration-200"
      >
        Get Started
      </Button>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-md mx-auto">
        <Card className="border-transparent bg-white shadow-none gap-3">
          <CardHeader>
            <ProgressIndicator />
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-6">
            <AnimatePresence mode="wait">
              {step === 1 && <div key="step1">{renderStep1()}</div>}
              {step === 2 && <div key="step2">{renderStep2()}</div>}
              {step === 3 && <div key="step3">{renderStep3()}</div>}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
