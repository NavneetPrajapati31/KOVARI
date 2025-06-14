"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function TestModeSelection() {
  const router = useRouter();

  const handleSubmit = async (selectedMode: "solo" | "group") => {
    const res = await fetch("/api/travel-mode", {
      method: "POST",
      body: JSON.stringify({ mode: selectedMode }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      toast.success(`Travel mode '${selectedMode}' saved!`);

      if (selectedMode === "group") {
        router.push("/create-group");
      } else {
        router.push("/explore");
      }
    } else {
      const error = await res.text();
      toast.error("Failed to save mode: " + error);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 space-y-4 p-6 border rounded shadow">
      <h1 className="text-xl font-bold mb-4">🧪 Test Travel Mode Selection</h1>
      <p className="text-muted-foreground mb-6">
        This form lets you test saving your travel mode to Supabase.
      </p>
      <div className="space-y-3">
        <button
          onClick={() => handleSubmit("solo")}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
        >
          Continue as Solo Traveler
        </button>
        <button
          onClick={() => handleSubmit("group")}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
        >
          Create a Travel Circle
        </button>
      </div>
    </div>
  );
}
