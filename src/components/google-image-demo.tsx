"use client";

import React, { useState } from "react";
import { fetchGoogleTouristImageUrl } from "../lib/fetchGoogleImage";

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "";
const GOOGLE_CSE_ID = process.env.NEXT_PUBLIC_GOOGLE_CSE_ID || "";

export const GoogleImageDemo: React.FC = () => {
  const [destination, setDestination] = useState("");
  const [country, setCountry] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchImage = async () => {
    setIsLoading(true);
    setError(null);
    setImageUrl(null);
    try {
      const url = await fetchGoogleTouristImageUrl(
        destination,
        country,
        GOOGLE_API_KEY,
        GOOGLE_CSE_ID
      );
      if (!url) {
        setError(
          "No tourist place image found for this destination and country."
        );
      } else {
        setImageUrl(url);
      }
    } catch (e) {
      setError("Failed to fetch image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
      <h2 className="text-xl font-semibold mb-4">
        Google Tourist Place Image Finder
      </h2>
      <div className="mb-4">
        <label
          htmlFor="destination-google"
          className="block text-sm font-medium mb-1"
        >
          Destination
        </label>
        <input
          id="destination-google"
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
          placeholder="e.g. Paris"
          aria-label="Destination"
        />
      </div>
      <div className="mb-4">
        <label
          htmlFor="country-google"
          className="block text-sm font-medium mb-1"
        >
          Country
        </label>
        <input
          id="country-google"
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
          placeholder="e.g. France"
          aria-label="Country"
        />
      </div>
      <button
        type="button"
        onClick={handleFetchImage}
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 focus:outline-none focus:ring"
        disabled={isLoading || !destination || !country}
        aria-label="Fetch Image"
      >
        {isLoading ? "Loading..." : "Fetch Image"}
      </button>
      {error && (
        <div className="mt-4 text-red-600 text-sm" role="alert">
          {error}
        </div>
      )}
      {imageUrl && !error && (
        <div className="mt-6 flex flex-col items-center">
          <img
            src={imageUrl}
            alt={`Tourist place in ${destination}, ${country}`}
            className="w-64 h-64 object-cover rounded shadow"
            width={256}
            height={256}
          />
          <span className="mt-2 text-xs text-gray-500">
            Powered by Google Images
          </span>
        </div>
      )}
    </section>
  );
};

export default GoogleImageDemo;
