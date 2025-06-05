"use client";

import type React from "react";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  User,
  Phone,
  Calendar,
  Briefcase,
  Globe,
  Languages,
  Upload,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

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
import { cn } from "@/lib/utils";

// Define schemas for each step
const step1Schema = z.object({
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
  birthday: z.string().min(1, { message: "Please enter your birthday" }),
});

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

// Define form data types
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
  const [step, setStep] = useState(1);
  const totalSteps = 2;
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);

  // Initialize forms for each step
  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      age: 18,
      gender: "",
      birthday: "",
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
  const onStep2Submit = (data: Step2Data) => {
    console.log("Step 2 data:", data);
    console.log("Complete form data:", { ...step1Data, ...data });
    // Here you would typically submit to your backend
    setStep(3); // Move to success step or next flow
  };

  // Handle profile image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setProfileImage(e.target.result as string);
          step2Form.setValue("profilePic", file);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Go back to previous step
  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Render step 1 form - Basic Info
  const renderStep1 = () => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Progress Indicator */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-600">
            Step {step} of {totalSteps}
          </div>
          <div className="flex space-x-2">
            {[1, 2].map((stepNum) => (
              <div key={stepNum} className="flex-1">
                <div
                  className={`h-1 rounded-full ${
                    stepNum <= step ? "bg-indigo-600" : "bg-gray-200"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Form Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Basic Information
          </h1>
          <p className="text-sm text-gray-500">
            Let&apos;s start with your basic details
          </p>
        </div>

        {/* Form Fields */}
        <Form {...step1Form}>
          <form
            onSubmit={step1Form.handleSubmit(onStep1Submit)}
            className="space-y-5"
          >
            <div className="space-y-4">
              {/* First Name and Last Name Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <FormField
                    control={step1Form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <FormControl>
                            <Input
                              placeholder="John"
                              className="pl-10 h-9 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage className="text-xs mt-1" />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <FormField
                    control={step1Form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <FormControl>
                            <Input
                              placeholder="Smith"
                              className="pl-10 h-9 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage className="text-xs mt-1" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <FormField
                  control={step1Form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <FormControl>
                          <Input
                            placeholder="+82 - (xxx) - xxx - xxxx"
                            className="pl-10 h-9 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage className="text-xs mt-1" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Age and Gender Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age
                  </label>
                  <FormField
                    control={step1Form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="25"
                            className="h-9 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs mt-1" />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <FormField
                    control={step1Form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-9 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 py-4">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {genderOptions.map((gender) => (
                              <SelectItem key={gender} value={gender}>
                                {gender}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs mt-1" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Birthday */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Birthday
                </label>
                <FormField
                  control={step1Form.control}
                  name="birthday"
                  render={({ field }) => (
                    <FormItem>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <FormControl>
                          <Input
                            type="date"
                            className="pl-10 h-9 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage className="text-xs mt-1" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Next Button */}
            <Button
              type="submit"
              className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200 mt-6"
            >
              Next
            </Button>
          </form>
        </Form>

        {/* Login Link */}
        {/* <div className="text-center text-sm">
          <span className="text-gray-600">Already have an account? </span>
          <Link
            href="/sign-in"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Login
          </Link>
        </div> */}
      </motion.div>
    );
  };

  // Render step 2 form - Profile Details
  const renderStep2 = () => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Progress Indicator */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-600">
            Step {step} of {totalSteps}
          </div>
          <div className="flex space-x-2">
            {[1, 2].map((stepNum) => (
              <div key={stepNum} className="flex-1">
                <div
                  className={`h-1 rounded-full ${
                    stepNum <= step ? "bg-indigo-600" : "bg-gray-200"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Form Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Profile Details
          </h1>
          <p className="text-sm text-gray-500">Tell us more about yourself</p>
        </div>

        {/* Form Fields */}
        <Form {...step2Form}>
          <form
            onSubmit={step2Form.handleSubmit(onStep2Submit)}
            className="space-y-5"
          >
            <div className="space-y-4">
              {/* Profile Picture Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                    {profileImage ? (
                      <Image
                        src={profileImage || "/placeholder.svg"}
                        alt="Profile"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      id="profile-pic"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <label
                      htmlFor="profile-pic"
                      className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-medium text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photo
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG or GIF. Max 2MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <FormField
                  control={step2Form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <div className="relative">
                        <Info className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about yourself..."
                            className="pl-10 min-h-[100px] border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage className="text-xs mt-1" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Nationality and Job Type Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nationality
                  </label>
                  <FormField
                    control={step2Form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <div className="relative">
                          <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <SelectTrigger className="pl-10 h-12 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                                <SelectValue placeholder="Select nationality" />
                              </SelectTrigger>
                              <SelectContent>
                                {nationalityOptions.map((nationality) => (
                                  <SelectItem
                                    key={nationality}
                                    value={nationality}
                                  >
                                    {nationality}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </div>
                        <FormMessage className="text-xs mt-1" />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Type
                  </label>
                  <FormField
                    control={step2Form.control}
                    name="jobType"
                    render={({ field }) => (
                      <FormItem>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <SelectTrigger className="pl-10 h-12 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                                <SelectValue placeholder="Select job type" />
                              </SelectTrigger>
                              <SelectContent>
                                {jobTypeOptions.map((jobType) => (
                                  <SelectItem key={jobType} value={jobType}>
                                    {jobType}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </div>
                        <FormMessage className="text-xs mt-1" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Languages
                </label>
                <FormField
                  control={step2Form.control}
                  name="languages"
                  render={({ field }) => (
                    <FormItem>
                      <div className="relative">
                        <Languages className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <FormControl>
                          <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className={cn(
                                  "w-full justify-between pl-10 h-12 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500",
                                  !Array.isArray(field.value) ||
                                    (field.value.length === 0 &&
                                      "text-muted-foreground")
                                )}
                              >
                                {Array.isArray(field.value) &&
                                field.value.length > 0
                                  ? `${field.value.length} selected`
                                  : "Select languages"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                              <Command>
                                <CommandInput placeholder="Search languages..." />
                                <CommandList>
                                  <CommandEmpty>
                                    No language found.
                                  </CommandEmpty>
                                  <CommandGroup className="max-h-64 overflow-auto">
                                    {languageOptions.map((language) => (
                                      <CommandItem
                                        key={language}
                                        onSelect={() => {
                                          const newValue = field.value.includes(
                                            language
                                          )
                                            ? field.value.filter(
                                                (l) => l !== language
                                              )
                                            : [...field.value, language];
                                          step2Form.setValue(
                                            "languages",
                                            newValue
                                          );
                                        }}
                                      >
                                        <Checkbox
                                          checked={field.value.includes(
                                            language
                                          )}
                                          className="mr-2"
                                        />
                                        {language}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </FormControl>
                      </div>
                      {Array.isArray(field.value) && field.value.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {field.value.map((language: string) => (
                            <Badge
                              key={language}
                              variant="secondary"
                              className="text-xs"
                            >
                              {language}
                              <button
                                type="button"
                                className="ml-1 hover:text-destructive"
                                onClick={() => {
                                  step2Form.setValue(
                                    "languages",
                                    Array.isArray(field.value)
                                      ? field.value.filter(
                                          (l: string) => l !== language
                                        )
                                      : []
                                  );
                                }}
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      <FormMessage className="text-xs mt-1" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Interests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interests
                </label>
                <FormField
                  control={step2Form.control}
                  name="interests"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-2 gap-2">
                        {interestOptions.map((interest) => (
                          <FormField
                            key={interest.id}
                            control={step2Form.control}
                            name="interests"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={interest.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(
                                        interest.id
                                      )}
                                      onCheckedChange={(checked) => {
                                        const currentValue = Array.isArray(
                                          field.value
                                        )
                                          ? field.value
                                          : [];
                                        return checked
                                          ? field.onChange([
                                              ...currentValue,
                                              interest.id,
                                            ])
                                          : field.onChange(
                                              currentValue.filter(
                                                (value) => value !== interest.id
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {interest.label}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage className="text-xs mt-1" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex space-x-4 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Complete
              </Button>
            </div>
          </form>
        </Form>
      </motion.div>
    );
  };

  // Success step
  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="py-12 text-center"
    >
      <h3 className="text-2xl font-bold text-gray-900 mb-4">
        Welcome to KOVARI! 🎉
      </h3>
      <p className="text-gray-600 mb-6">
        Your profile has been successfully created.
      </p>
      <Button
        onClick={() => (window.location.href = "/dashboard")}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg"
      >
        Get Started
      </Button>
    </motion.div>
  );

  return (
    <div className="min-h-screen flex w-full">
      {/* Left Side - Form */}
      <div className="w-1/2 bg-white flex items-center justify-center p-8 overflow-y-auto max-h-screen">
        <div className="w-full max-w-md py-8">
          <AnimatePresence mode="wait">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Side - Blue Gradient Card */}
      <div className="w-1/2 bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center">
        {/* This is where you can add your image */}
        <div className="text-center text-white/20">
          {/* Placeholder for future image */}
          <div className="w-64 h-64 border-2 border-dashed border-white/30 rounded-lg flex items-center justify-center">
            <span className="text-sm">Image placeholder</span>
          </div>
        </div>
      </div>
    </div>
  );
}
