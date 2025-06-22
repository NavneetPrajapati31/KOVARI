"use client";

import React, { useState } from "react";
import { fetchPexelsSquareImageUrl } from "../lib/fetchPexelsImage";

const PEXELS_API_KEY = process.env.NEXT_PUBLIC_PEXELS_API_KEY || "";

export const PexelsImageDemo: React.FC = () => {
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
      const url = await fetchPexelsSquareImageUrl(
        destination,
        country,
        PEXELS_API_KEY
      );
      if (!url) {
        setError("No image found for this destination and country.");
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
        Pexels Destination Image Finder
      </h2>
      <div className="mb-4">
        <label htmlFor="destination" className="block text-sm font-medium mb-1">
          Destination
        </label>
        <input
          id="destination"
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
          placeholder="e.g. Paris"
          aria-label="Destination"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="country" className="block text-sm font-medium mb-1">
          Country
        </label>
        <input
          id="country"
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
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring"
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
            alt={`Square view of ${destination}, ${country}`}
            className="w-64 h-64 object-cover rounded shadow"
            width={256}
            height={256}
          />
          <span className="mt-2 text-xs text-gray-500">Powered by Pexels</span>
        </div>
      )}
    </section>
  );
};

export default PexelsImageDemo;
