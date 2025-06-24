"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Globe,
  Lock,
  Users,
  Shield,
  MapPin,
  Calendar,
  Camera,
  AlertTriangle,
  Eye,
  EyeOff,
  Heart,
  Star,
  Zap,
  Settings,
  UserCheck,
  MessageCircle,
  Bell,
  Flag,
  Phone,
  Mail,
  ChevronRight,
} from "lucide-react";
import { ImageUpload } from "@/components/image-upload";
import { DatePicker } from "@heroui/react";
import { CalendarDate } from "@internationalized/date";

// Enhanced schema for travel group editing
const editGroupSchema = z
  .object({
    // Basic Information
    groupName: z
      .string()
      .min(3, "Group name must be at least 3 characters")
      .max(50, "Group name must be less than 50 characters"),
    description: z
      .string()
      .max(500, "Description must be less than 500 characters")
      .optional(),
    destination: z.string().min(1, "Destination is required"),

    // Travel Details
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    travelStyle: z.enum([
      "adventure",
      "cultural",
      "relaxation",
      "budget",
      "luxury",
      "mixed",
    ]),
    groupSize: z.enum(["2-4", "5-7", "8-10"]),

    // Privacy & Visibility
    visibility: z.enum(["public", "private", "invite-only"]),
    allowJoinRequests: z.boolean(),
    requireApproval: z.boolean(),

    // Safety & Trust
    safetyFeatures: z.object({
      emergencyContacts: z.boolean(),
      locationSharing: z.boolean(),
      panicButton: z.boolean(),
      memberVerification: z.boolean(),
      reportSystem: z.boolean(),
    }),

    // Communication
    communicationSettings: z.object({
      allowDirectMessages: z.boolean(),
      groupChatEnabled: z.boolean(),
      notificationsEnabled: z.boolean(),
      messageModeration: z.boolean(),
    }),

    // Travel Preferences
    interests: z.array(z.string()).min(1, "Select at least one interest"),
    budgetRange: z.enum(["budget", "moderate", "luxury", "flexible"]),
    accommodationType: z.enum([
      "hostel",
      "hotel",
      "airbnb",
      "camping",
      "mixed",
    ]),

    // Advanced Settings
    coverImage: z.string().optional(),
    tags: z.array(z.string()).max(10, "Maximum 10 tags allowed"),
    rules: z
      .string()
      .max(1000, "Rules must be less than 1000 characters")
      .optional(),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      return new Date(data.startDate) < new Date(data.endDate);
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

type EditGroupForm = z.infer<typeof editGroupSchema>;

const INTERESTS_OPTIONS = [
  "Hiking",
  "Photography",
  "Culture",
  "Food",
  "Music",
  "History",
  "Adventure",
  "Nightlife",
  "Local Tours",
  "Museums",
  "Shopping",
  "Beach",
  "Mountains",
  "City Life",
  "Nature",
  "Art",
  "Architecture",
  "Cooking",
  "Dancing",
  "Sports",
  "Wellness",
  "Technology",
];

const TAG_OPTIONS = [
  "Backpackers",
  "Digital Nomads",
  "Solo Travelers",
  "Couples",
  "Families",
  "Students",
  "Professionals",
  "Adventure Seekers",
  "Culture Enthusiasts",
  "Food Lovers",
  "Photography",
  "Budget Travel",
  "Luxury Travel",
  "Eco-Friendly",
  "Accessible Travel",
];

// Utility functions for CalendarDate <-> Date
function dateToCalendarDate(date?: Date): CalendarDate | null {
  if (!date) return null;
  return new CalendarDate(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  );
}
function calendarDateToDate(cd: CalendarDate | null | undefined): Date | null {
  if (!cd) return null;
  return new Date(Date.UTC(cd.year, cd.month - 1, cd.day));
}

export default function EditPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState("basic");
  const [submittingSection, setSubmittingSection] = useState<string | null>(
    null
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<EditGroupForm>({
    resolver: zodResolver(editGroupSchema),
    defaultValues: {
      groupName: "",
      description: "",
      destination: "",
      startDate: "",
      endDate: "",
      travelStyle: "mixed",
      groupSize: "5-7",
      visibility: "public",
      allowJoinRequests: true,
      requireApproval: true,
      safetyFeatures: {
        emergencyContacts: true,
        locationSharing: false,
        panicButton: true,
        memberVerification: true,
        reportSystem: true,
      },
      communicationSettings: {
        allowDirectMessages: true,
        groupChatEnabled: true,
        notificationsEnabled: true,
        messageModeration: true,
      },
      interests: [],
      budgetRange: "moderate",
      accommodationType: "mixed",
      tags: [],
      rules: "",
    },
  });

  const watchedValues = watch();
  const descriptionLength = watchedValues.description?.length || 0;

  const handleInterestToggle = (interest: string) => {
    const current = watchedValues.interests || [];
    const updated = current.includes(interest)
      ? current.filter((i) => i !== interest)
      : [...current, interest];
    setValue("interests", updated);
    setSelectedInterests(updated);
  };

  const handleTagToggle = (tag: string) => {
    const current = watchedValues.tags || [];
    const updated = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    setValue("tags", updated);
    setSelectedTags(updated);
  };

  const handleSectionSubmit = async (sectionId: string) => {
    setSubmittingSection(sectionId);
    try {
      // Extract only the fields relevant to this section
      const sectionData = getSectionData(sectionId, watchedValues);

      // TODO: Implement API call to update specific section
      console.log(`Updating ${sectionId} section:`, sectionData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Show success feedback
      console.log(`${sectionId} section updated successfully`);
    } catch (error) {
      console.error(`Error updating ${sectionId} section:`, error);
    } finally {
      setSubmittingSection(null);
    }
  };

  const getSectionData = (sectionId: string, formData: EditGroupForm) => {
    switch (sectionId) {
      case "basic":
        return {
          groupName: formData.groupName,
          description: formData.description,
          destination: formData.destination,
          coverImage: formData.coverImage,
        };
      case "travel":
        return {
          startDate: formData.startDate,
          endDate: formData.endDate,
          travelStyle: formData.travelStyle,
          groupSize: formData.groupSize,
          budgetRange: formData.budgetRange,
          accommodationType: formData.accommodationType,
        };
      case "privacy":
        return {
          visibility: formData.visibility,
          allowJoinRequests: formData.allowJoinRequests,
          requireApproval: formData.requireApproval,
          safetyFeatures: formData.safetyFeatures,
        };
      case "communication":
        return {
          communicationSettings: formData.communicationSettings,
        };
      case "preferences":
        return {
          interests: formData.interests,
          tags: formData.tags,
        };
      case "advanced":
        return {
          rules: formData.rules,
        };
      default:
        return {};
    }
  };

  const onSubmit = async (data: EditGroupForm) => {
    setIsSubmitting(true);
    try {
      // TODO: Implement API call to update group
      console.log("Updated group data:", data);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Error updating group:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sections = [
    { id: "basic", label: "Basic Info", icon: Settings },
    { id: "travel", label: "Travel Details", icon: MapPin },
    { id: "privacy", label: "Privacy & Safety", icon: Shield },
    { id: "communication", label: "Communication", icon: MessageCircle },
    { id: "preferences", label: "Preferences", icon: Heart },
    { id: "advanced", label: "Advanced", icon: Zap },
  ];

  return (
    <div className="w-full mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">
            Edit Group Settings
          </h1>
          <Badge variant="outline" className="text-xs">
            {watchedValues.visibility === "public" ? "Public" : "Private"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Customize your group's information, privacy, and travel preferences.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1 border-b">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-t-md transition-all duration-200 ${
                activeSection === section.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon className="h-3 w-3" />
              {section.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information Section */}
        {activeSection === "basic" && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Basic Information
              </CardTitle>
              <CardDescription className="text-xs">
                Update your group's name, description, and cover image.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="group-name" className="text-xs font-medium">
                  Group Name *
                </Label>
                <Input
                  id="group-name"
                  {...register("groupName")}
                  placeholder="Enter a memorable group name"
                  className={`h-9 text-sm ${
                    errors.groupName ? "border-destructive" : ""
                  }`}
                />
                {errors.groupName && (
                  <p className="text-xs text-destructive">
                    {errors.groupName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination" className="text-xs font-medium">
                  Destination *
                </Label>
                <Input
                  id="destination"
                  {...register("destination")}
                  placeholder="e.g., Tokyo, Japan"
                  className={`h-9 text-sm ${
                    errors.destination ? "border-destructive" : ""
                  }`}
                />
                {errors.destination && (
                  <p className="text-xs text-destructive">
                    {errors.destination.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-medium">
                  Description
                </Label>
                <div className="relative">
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Tell people what your group is about..."
                    className={`min-h-[100px] text-sm resize-none ${
                      errors.description ? "border-destructive" : ""
                    }`}
                    maxLength={500}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                    {descriptionLength}/500
                  </div>
                </div>
                {errors.description && (
                  <p className="text-xs text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Cover Image</Label>
                {/* <div className="flex items-center justify-center w-full h-24 border border-dashed border-muted-foreground/25 rounded-md hover:border-muted-foreground/50 transition-colors cursor-pointer">
                  <div className="text-center">
                    <Camera className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">
                      Click to upload cover image
                    </p>
                  </div>
                </div> */}
                <ImageUpload hideLabel avatar />
              </div>
            </CardContent>
            <CardContent className="pt-0">
              <Button
                type="button"
                onClick={() => handleSectionSubmit("basic")}
                disabled={submittingSection === "basic"}
                className="w-full h-9 text-sm"
              >
                {submittingSection === "basic"
                  ? "Saving..."
                  : "Save Basic Info"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Travel Details Section */}
        {activeSection === "travel" && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Travel Details
              </CardTitle>
              <CardDescription className="text-xs">
                Set your travel dates, style, and group size preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="w-full flex flex-col gap-1 space-y-2">
                  <Label className="text-xs font-medium">Start Date *</Label>
                  <DatePicker
                    value={dateToCalendarDate(
                      watchedValues.startDate
                        ? new Date(watchedValues.startDate)
                        : undefined
                    )}
                    onChange={(cd) => {
                      setValue(
                        "startDate",
                        cd ? calendarDateToDate(cd)?.toISOString() ?? "" : ""
                      );
                    }}
                  />
                  {errors.startDate && (
                    <p className="text-xs text-destructive">
                      {errors.startDate.message}
                    </p>
                  )}
                </div>
                <div className="w-full flex flex-col gap-1 space-y-2">
                  <Label className="text-xs font-medium">End Date *</Label>
                  <DatePicker
                    value={dateToCalendarDate(
                      watchedValues.endDate
                        ? new Date(watchedValues.endDate)
                        : undefined
                    )}
                    onChange={(cd) => {
                      setValue(
                        "endDate",
                        cd ? calendarDateToDate(cd)?.toISOString() ?? "" : ""
                      );
                    }}
                  />
                  {errors.endDate && (
                    <p className="text-xs text-destructive">
                      {errors.endDate.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="w-full space-y-2">
                  <Label htmlFor="travel-style" className="text-xs font-medium">
                    Travel Style
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("travelStyle", value as any)
                    }
                    defaultValue={watchedValues.travelStyle}
                  >
                    <SelectTrigger className="h-9 text-sm w-full">
                      <SelectValue placeholder="Select travel style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adventure">Adventure</SelectItem>
                      <SelectItem value="cultural">Cultural</SelectItem>
                      <SelectItem value="relaxation">Relaxation</SelectItem>
                      <SelectItem value="budget">Budget</SelectItem>
                      <SelectItem value="luxury">Luxury</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full space-y-2">
                  <Label htmlFor="group-size" className="text-xs font-medium">
                    Preferred Group Size
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("groupSize", value as any)
                    }
                    defaultValue={watchedValues.groupSize}
                  >
                    <SelectTrigger className="h-9 text-sm w-full">
                      <SelectValue placeholder="Select group size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2-4">2-4 people</SelectItem>
                      <SelectItem value="5-7">5-7 people</SelectItem>
                      <SelectItem value="8-10">8-10 people</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="w-full space-y-2">
                  <Label htmlFor="budget-range" className="text-xs font-medium">
                    Budget Range
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("budgetRange", value as any)
                    }
                    defaultValue={watchedValues.budgetRange}
                  >
                    <SelectTrigger className="h-9 text-sm w-full">
                      <SelectValue placeholder="Select budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget">Budget ($)</SelectItem>
                      <SelectItem value="moderate">Moderate ($$)</SelectItem>
                      <SelectItem value="luxury">Luxury ($$$)</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full space-y-2">
                  <Label
                    htmlFor="accommodation-type"
                    className="text-xs font-medium"
                  >
                    Accommodation Type
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("accommodationType", value as any)
                    }
                    defaultValue={watchedValues.accommodationType}
                  >
                    <SelectTrigger className="h-9 text-sm w-full">
                      <SelectValue placeholder="Select accommodation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hostel">Hostel</SelectItem>
                      <SelectItem value="hotel">Hotel</SelectItem>
                      <SelectItem value="airbnb">Airbnb</SelectItem>
                      <SelectItem value="camping">Camping</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardContent className="pt-0">
              <Button
                type="button"
                onClick={() => handleSectionSubmit("travel")}
                disabled={submittingSection === "travel"}
                className="w-full h-9 text-sm"
              >
                {submittingSection === "travel"
                  ? "Saving..."
                  : "Save Travel Details"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Privacy & Safety Section */}
        {activeSection === "privacy" && (
          <div className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Privacy & Visibility
                </CardTitle>
                <CardDescription className="text-xs">
                  Control who can see and join your group.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="visibility" className="text-xs font-medium">
                    Group Visibility
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("visibility", value as any)
                    }
                    defaultValue={watchedValues.visibility}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <Globe className="h-3 w-3" />
                          Public - Anyone can find and join
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center gap-2">
                          <Lock className="h-3 w-3" />
                          Private - Invitation only
                        </div>
                      </SelectItem>
                      <SelectItem value="invite-only">
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          Invite-only - Members can invite others
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2 border-t pt-4">
                  <div className="space-y-1 flex-1">
                    <Label className="text-xs font-medium">Group Privacy</Label>
                    <p className="text-xs text-muted-foreground">
                      {watchedValues.visibility === "public"
                        ? "Your group is visible to everyone"
                        : "Your group is private and invitation-only"}
                    </p>
                  </div>
                  <Switch
                    checked={watchedValues.visibility === "public"}
                    onCheckedChange={(checked) =>
                      setValue("visibility", checked ? "public" : "private")
                    }
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
                    <div className="space-y-1 flex-1">
                      <Label className="text-xs font-medium">
                        Allow Join Requests
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Let people request to join your group
                      </p>
                    </div>
                    <Switch
                      checked={watchedValues.allowJoinRequests}
                      onCheckedChange={(checked) =>
                        setValue("allowJoinRequests", checked)
                      }
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
                    <div className="space-y-1 flex-1">
                      <Label className="text-xs font-medium">
                        Require Approval
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Manually approve new members
                      </p>
                    </div>
                    <Switch
                      checked={watchedValues.requireApproval}
                      onCheckedChange={(checked) =>
                        setValue("requireApproval", checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
              <CardContent className="pt-0">
                <Button
                  type="button"
                  onClick={() => handleSectionSubmit("privacy")}
                  disabled={submittingSection === "privacy"}
                  className="w-full h-9 text-sm"
                >
                  {submittingSection === "privacy"
                    ? "Saving..."
                    : "Save Privacy Settings"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-l-destructive/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Safety Features
                </CardTitle>
                <CardDescription className="text-xs">
                  Enable safety features to protect group members.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    key: "emergencyContacts",
                    label: "Emergency Contacts",
                    description: "Allow members to share emergency contacts",
                  },
                  {
                    key: "locationSharing",
                    label: "Location Sharing",
                    description:
                      "Enable real-time location sharing during trips",
                  },
                  {
                    key: "panicButton",
                    label: "Panic Button",
                    description: "Quick emergency alert system",
                  },
                  {
                    key: "memberVerification",
                    label: "Member Verification",
                    description:
                      "Require identity verification for new members",
                  },
                  {
                    key: "reportSystem",
                    label: "Report System",
                    description: "Allow members to report issues",
                  },
                ].map((feature) => (
                  <div
                    key={feature.key}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2"
                  >
                    <div className="space-y-1 flex-1">
                      <Label className="text-xs font-medium">
                        {feature.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                    <Switch
                      checked={
                        watchedValues.safetyFeatures[
                          feature.key as keyof typeof watchedValues.safetyFeatures
                        ]
                      }
                      onCheckedChange={(checked) =>
                        setValue(
                          `safetyFeatures.${feature.key}` as any,
                          checked
                        )
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Communication Section */}
        {activeSection === "communication" && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Communication Settings
              </CardTitle>
              <CardDescription className="text-xs">
                Control how members can communicate within the group.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  key: "groupChatEnabled",
                  label: "Group Chat",
                  description: "Enable group chat functionality",
                },
                {
                  key: "allowDirectMessages",
                  label: "Direct Messages",
                  description: "Allow members to message each other privately",
                },
                {
                  key: "notificationsEnabled",
                  label: "Notifications",
                  description: "Send notifications for group updates",
                },
                {
                  key: "messageModeration",
                  label: "Message Moderation",
                  description: "Review messages before they're posted",
                },
              ].map((setting) => (
                <div
                  key={setting.key}
                  className="flex items-center justify-between py-2"
                >
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">
                      {setting.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {setting.description}
                    </p>
                  </div>
                  <Switch
                    checked={
                      watchedValues.communicationSettings[
                        setting.key as keyof typeof watchedValues.communicationSettings
                      ]
                    }
                    onCheckedChange={(checked) =>
                      setValue(
                        `communicationSettings.${setting.key}` as any,
                        checked
                      )
                    }
                  />
                </div>
              ))}
            </CardContent>
            <CardContent className="pt-0">
              <Button
                type="button"
                onClick={() => handleSectionSubmit("communication")}
                disabled={submittingSection === "communication"}
                className="w-full h-9 text-sm"
              >
                {submittingSection === "communication"
                  ? "Saving..."
                  : "Save Communication Settings"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Preferences Section */}
        {activeSection === "preferences" && (
          <div className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Travel Interests
                </CardTitle>
                <CardDescription className="text-xs">
                  Select interests that match your group's travel style.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">
                    Select Interests *
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS_OPTIONS.map((interest) => (
                      <Badge
                        key={interest}
                        variant={
                          selectedInterests.includes(interest)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer hover:bg-primary/80 text-xs px-2 py-1"
                        onClick={() => handleInterestToggle(interest)}
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                  {errors.interests && (
                    <p className="text-xs text-destructive">
                      {errors.interests.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Group Tags
                </CardTitle>
                <CardDescription className="text-xs">
                  Add tags to help others find your group.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Select Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {TAG_OPTIONS.map((tag) => (
                      <Badge
                        key={tag}
                        variant={
                          selectedTags.includes(tag) ? "default" : "outline"
                        }
                        className="cursor-pointer hover:bg-primary/80 text-xs px-2 py-1"
                        onClick={() => handleTagToggle(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  {errors.tags && (
                    <p className="text-xs text-destructive">
                      {errors.tags.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            <CardContent className="pt-0">
              <Button
                type="button"
                onClick={() => handleSectionSubmit("preferences")}
                disabled={submittingSection === "preferences"}
                className="w-full h-9 text-sm"
              >
                {submittingSection === "preferences"
                  ? "Saving..."
                  : "Save Preferences"}
              </Button>
            </CardContent>
          </div>
        )}

        {/* Advanced Section */}
        {activeSection === "advanced" && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Advanced Settings
              </CardTitle>
              <CardDescription className="text-xs">
                Additional group rules and advanced configurations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rules" className="text-xs font-medium">
                  Group Rules
                </Label>
                <Textarea
                  id="rules"
                  {...register("rules")}
                  placeholder="Set clear rules for group members..."
                  className="min-h-[100px] text-sm resize-none"
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground">
                  Establish guidelines for behavior, expectations, and group
                  dynamics.
                </p>
                {errors.rules && (
                  <p className="text-xs text-destructive">
                    {errors.rules.message}
                  </p>
                )}
              </div>
            </CardContent>
            <CardContent className="pt-0">
              <Button
                type="button"
                onClick={() => handleSectionSubmit("advanced")}
                disabled={submittingSection === "advanced"}
                className="w-full h-9 text-sm"
              >
                {submittingSection === "advanced"
                  ? "Saving..."
                  : "Save Advanced Settings"}
              </Button>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}
