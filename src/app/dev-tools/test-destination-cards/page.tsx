"use client";

import React from "react";
import TopPicksSection from "@/shared/components/TopPicksSection";
import { getAllDestinations } from "@/lib/data/topPicksDestinations";

export default function TestDestinationCardsPage() {
  const allDestinations = getAllDestinations();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Destination Cards Test Page
        </h1>
        
        {/* Single Section */}
        <TopPicksSection 
          destinations={allDestinations}
          className="bg-white rounded-2xl p-8 shadow-lg"
        />

        {/* Test Instructions */}
        <div className="mt-16 bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Instructions:</h2>
          <ul className="space-y-2 text-gray-700">
            <li>• Click on any destination card to navigate to explore page</li>
            <li>• The destination should be pre-filled in the search form</li>
            <li>• Test the heart icon to toggle favorites</li>
            <li>• Check that the cards have proper hover effects</li>
            <li>• Verify the rating and review count display correctly</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
