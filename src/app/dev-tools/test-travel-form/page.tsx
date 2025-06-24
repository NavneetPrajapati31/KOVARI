"use client";

import { useState } from "react";

export default function TestTravelForm() {
  const [loading, setLoading] = useState(false);

  const testSubmit = async () => {
    setLoading(true);
    const res = await fetch("/api/travel-preferences", {
      method: "POST",
      body: JSON.stringify({
        destinations: ["Goa", "Rishikesh"],
        start_date: "2025-12-01",
        end_date: "2025-12-10",
        interests: ["Adventure", "Culture"],
      }),
      headers: { "Content-Type": "application/json" },
    });

    const result = await res.text();
    console.log("API Result:", result);
    setLoading(false);
  };

  return (
    <button
      onClick={testSubmit}
      className="px-4 py-2 bg-blue-500 text-white rounded"
    >
      {loading ? "Saving..." : "Test Travel API"}
    </button>
  );
}
