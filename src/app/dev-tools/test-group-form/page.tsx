"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function TestGroupForm() {
  const router = useRouter();

  const handleTest = async () => {
    const testData = {
      name: "Goa Explorers",
      destination: "Goa",
      start_date: "2025-12-01",
      end_date: "2025-12-07",
      is_public: true,
      description:
        "A test travel group exploring beaches and nightlife in Goa.",
    };

    const res = await fetch("/api/create-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testData),
    });

    if (res.ok) {
      toast.success("✅ Test travel circle created!");
      router.refresh();
    } else {
      const error = await res.text();
      toast.error("❌ Failed: " + error);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 border shadow-md rounded-md">
      <h1 className="text-xl font-bold mb-4">🧪 Test Travel Circle Creation</h1>
      <button
        onClick={handleTest}
        className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Test Create Group
      </button>
    </div>
  );
}
