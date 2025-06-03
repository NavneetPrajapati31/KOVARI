"use client";
import { useUser } from "@clerk/nextjs";

export default function ProfileSetup() {
  const { user } = useUser();
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1>Welcome, {user?.firstName || "traveler"} 👋</h1>
      <h2 className="text-2xl font-bold mb-4">Profile Setup</h2>
      <form className="grid gap-4">
        {/* Add Shadcn UI inputs for name, age, gender, photo, interests */}
        <input type="text" placeholder="Name" className="border p-2 rounded" />
        <input type="number" placeholder="Age" className="border p-2 rounded" />
        {/* Add more fields */}
        <button className="bg-green-600 text-white px-4 py-2 rounded">
          Save
        </button>
      </form>
    </div>
  );
}
