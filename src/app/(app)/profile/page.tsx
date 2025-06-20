"use client";

import InvitationResults, { Invitation } from "@/components/InvitationResults";
import { Button } from "@/components/ui/button";

// Dummy data for invitations
const DUMMY_INVITATIONS = [
  {
    id: "i1",
    groupName: "Bali Adventure Squad",
    creator: {
      name: "Sarah Johnson",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      initials: "SJ",
    },
    destination: "Bali, Indonesia",
    dates: "July 15 - July 30, 2024",
    description:
      "Join us for an unforgettable adventure in Bali! fsdafnd fdsfmafndsa fas fdsa fsafjasnfa,",
    teamMembers: [
      {
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
        initials: "MC",
        color: "bg-blue-400",
      },
      {
        avatar: "https://randomuser.me/api/portraits/women/68.jpg",
        initials: "EW",
        color: "bg-pink-400",
      },
    ],
    acceptedCount: 2,
    expiresInDays: 5,
    inviteDate: "2024-06-01",
  },
  {
    id: "i2",
    groupName: "Tokyo Foodies",
    creator: {
      name: "Michael Chen",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      initials: "MC",
    },
    destination: "Tokyo, Japan",
    dates: "August 1 - August 15, 2024",
    description: "Explore Tokyo's culinary scene with fellow food lovers!",
    teamMembers: [
      {
        avatar: "https://randomuser.me/api/portraits/women/44.jpg",
        initials: "SJ",
        color: "bg-green-400",
      },
      {
        avatar: "https://randomuser.me/api/portraits/men/75.jpg",
        initials: "DK",
        color: "bg-yellow-400",
      },
    ],
    acceptedCount: 3,
    expiresInDays: 3,
    inviteDate: "2024-06-03",
  },
  {
    id: "i3",
    groupName: "Barcelona Art Lovers",
    creator: {
      name: "Emma Wilson",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg",
      initials: "EW",
    },
    destination: "Barcelona, Spain",
    dates: "September 5 - September 20, 2024",
    description: "Discover Barcelona's art and culture with us!",
    teamMembers: [
      {
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
        initials: "MC",
        color: "bg-blue-400",
      },
      {
        avatar: "https://randomuser.me/api/portraits/women/44.jpg",
        initials: "SJ",
        color: "bg-pink-400",
      },
    ],
    acceptedCount: 4,
    expiresInDays: 7,
    inviteDate: "2024-06-05",
  },
  {
    id: "i4",
    groupName: "Thailand Backpackers",
    creator: {
      name: "David Kim",
      avatar: "https://randomuser.me/api/portraits/men/75.jpg",
      initials: "DK",
    },
    destination: "Bangkok, Thailand",
    dates: "October 10 - October 25, 2024",
    description: "Backpack through Thailand with a fun group!",
    teamMembers: [
      {
        avatar: "https://randomuser.me/api/portraits/women/68.jpg",
        initials: "EW",
        color: "bg-purple-400",
      },
      {
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
        initials: "MC",
        color: "bg-blue-400",
      },
    ],
    acceptedCount: 1,
    expiresInDays: 10,
    inviteDate: "2024-06-07",
  },
  {
    id: "i5",
    groupName: "Sydney Surf Crew",
    creator: {
      name: "Liam Brown",
      avatar: "https://randomuser.me/api/portraits/men/23.jpg",
      initials: "LB",
    },
    destination: "Sydney, Australia",
    dates: "December 1 - December 15, 2024",
    description: "Catch the best waves and enjoy the sun in Sydney!",
    teamMembers: [
      {
        avatar: "https://randomuser.me/api/portraits/women/44.jpg",
        initials: "SJ",
        color: "bg-orange-400",
      },
      {
        avatar: "https://randomuser.me/api/portraits/men/75.jpg",
        initials: "DK",
        color: "bg-yellow-400",
      },
    ],
    acceptedCount: 2,
    expiresInDays: 15,
    inviteDate: "2024-06-10",
  },
];

export default function ProfilePage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* Invitations Tab */}
      <div className="w-full flex flex-row items-center gap-2 px-4 py-6">
        <Button
          className="text-primary bg-primary-light font-semibold rounded-2xl shadow-sm hover:bg-primary-light hover:text-primary border-1 border-primary  focus:outline-none focus:ring-2 focus:ring-primary"
          tabIndex={0}
          aria-label="Invitations Tab"
        >
          Invitations
        </Button>
      </div>
      {/* Invitations Results Grid */}
      <div className="w-full flex-1 px-4">
        <InvitationResults invitations={DUMMY_INVITATIONS} />
      </div>
    </div>
  );
}
