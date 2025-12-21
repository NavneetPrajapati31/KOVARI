"use client";

import { useEffect } from "react";
import { SoloMatchCard } from "./SoloMatchCard";
import { GroupMatchCard } from "./GroupMatchCard";
import { Spinner } from "@heroui/react";
import { Users } from "lucide-react";

import { SearchData } from "../types";

interface ResultsDisplayProps {
  activeTab: number;
  matchedGroups: any[];
  currentGroupIndex: number;
  searchLoading: boolean;
  searchError: string | null;
  lastSearchData: SearchData | null;
  onPreviousGroup: () => void;
  onNextGroup: () => void;
  onConnect: (matchId: string) => Promise<void>;
  onSuperLike: (matchId: string) => Promise<void>;
  onPass: (matchId: string) => Promise<void>;
  onComment: (
    matchId: string,
    attribute: string,
    comment: string
  ) => Promise<void>;
  onViewProfile: (userId: string) => void;
  onJoinGroup: (groupId: string) => Promise<void>;
  onRequestJoin: (groupId: string) => Promise<void>;
  onPassGroup: (groupId: string) => Promise<void>;
  onViewGroup: (groupId: string) => void;
}

export const ResultsDisplay = ({
  activeTab,
  matchedGroups,
  currentGroupIndex,
  searchLoading,
  searchError,
  lastSearchData,
  onPreviousGroup,
  onNextGroup,
  onConnect,
  onSuperLike,
  onPass,
  onComment,
  onViewProfile,
  onJoinGroup,
  onRequestJoin,
  onPassGroup,
  onViewGroup,
}: ResultsDisplayProps) => {
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        onPreviousGroup();
      } else if (event.key === "ArrowRight") {
        onNextGroup();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onPreviousGroup, onNextGroup]);

  // Conditional Match Card Component
  const MatchCardComponent = () => {
    if (activeTab === 0) {
      return (
        <SoloMatchCard
          key={matchedGroups[currentGroupIndex]?.id}
          match={matchedGroups[currentGroupIndex]}
          onConnect={onConnect}
          onSuperLike={onSuperLike}
          onPass={onPass}
          onComment={onComment}
          onViewProfile={onViewProfile}
        />
      );
    } else {
      return (
        <GroupMatchCard
          key={matchedGroups[currentGroupIndex]?.id}
          group={matchedGroups[currentGroupIndex]}
          onJoinGroupAction={onJoinGroup}
          onRequestJoinAction={onRequestJoin}
          onPassAction={onPassGroup}
          onViewGroupAction={onViewGroup}
        />
      );
    }
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Loading Overlay */}
      {searchLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl">
          <div className="flex flex-col items-center gap-4">
            <Spinner variant="spinner" size="lg" color="primary" />
            <p className="text-gray-600 font-medium">Finding matches...</p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {searchError && (
        <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex-shrink-0 shadow-sm">
          <p className="text-red-700 text-sm font-medium">{searchError}</p>
        </div>
      )}

      {/* Results Display */}
      {matchedGroups.length > 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 lg:p-12 relative overflow-hidden">
          {/* Navigation arrows */}
          {matchedGroups.length > 1 && (
            <>
              <button
                onClick={onPreviousGroup}
                disabled={currentGroupIndex === 0}
                className="absolute left-4 md:left-6 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 backdrop-blur-md border border-gray-200 rounded-full p-3 md:p-4 hover:bg-white hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:scale-105"
                aria-label="Previous match"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-700"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                onClick={onNextGroup}
                disabled={currentGroupIndex === matchedGroups.length - 1}
                className="absolute right-4 md:right-6 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 backdrop-blur-md border border-gray-200 rounded-full p-3 md:p-4 hover:bg-white hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:scale-105"
                aria-label="Next match"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-700"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </>
          )}

          {/* Conditional Match Card */}
          <div className="w-full max-w-4xl">
            <MatchCardComponent />
          </div>

          {/* Match counter */}
          {matchedGroups.length > 1 && (
            <div className="flex items-center gap-2 mt-8 px-4 py-2 bg-gray-50 rounded-full text-sm text-gray-600">
              <span className="font-semibold text-gray-900">
                {currentGroupIndex + 1}
              </span>
              <span className="text-gray-400">of</span>
              <span className="font-semibold text-gray-900">
                {matchedGroups.length}
              </span>
              <span className="text-gray-500">
                {activeTab === 0 ? "travelers" : "groups"}
              </span>
            </div>
          )}
        </div>
      ) : (
        /* No Results or Initial State */
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 lg:p-12 overflow-hidden">
          {lastSearchData ? (
            <div className="text-center max-w-2xl">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No matches found
              </h3>
              <p className="text-gray-600 mb-8 text-lg">
                Try adjusting your search criteria or dates to find more{" "}
                {activeTab === 0 ? "travel companions" : "travel groups"}.
              </p>
              <div className="bg-gray-50 rounded-xl p-6 text-left space-y-3 border border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">
                    Destination
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {lastSearchData.destination}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">
                    Budget
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    ₹{lastSearchData.budget.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">
                    Dates
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {lastSearchData.startDate.toLocaleDateString()} -{" "}
                    {lastSearchData.endDate.toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">
                    Mode
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {activeTab === 0 ? "Solo Travel" : "Group Travel"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center max-w-xl">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Users className="w-12 h-12 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Start your search
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Enter your travel details in the sidebar to find compatible{" "}
                {activeTab === 0 ? "travel companions" : "travel groups"}.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
