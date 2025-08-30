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
  onComment: (matchId: string, attribute: string, comment: string) => Promise<void>;
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
    <div className="flex-1 bg-background overflow-hidden">
      {/* Loading Overlay */}
      {searchLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-card h-screen">
          <Spinner variant="spinner" size="md" color="primary" />
        </div>
      )}

      {/* Error Display */}
      {searchError && (
        <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex-shrink-0">
          <p className="text-red-600 text-sm">{searchError}</p>
        </div>
      )}

      {/* Results Display */}
      {matchedGroups.length > 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
          {/* Navigation arrows */}
          {matchedGroups.length > 1 && (
            <>
              <button
                onClick={onPreviousGroup}
                disabled={currentGroupIndex === 0}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-background/40 backdrop-blur-sm border border-gray-200/50 rounded-full p-3 hover:bg-background/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                aria-label="Previous match"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                onClick={onNextGroup}
                disabled={currentGroupIndex === matchedGroups.length - 1}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-background/40 backdrop-blur-sm border border-gray-200/50 rounded-full p-3 hover:bg-background/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                aria-label="Next match"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </>
          )}
          
          {/* Conditional Match Card */}
          <MatchCardComponent />
          
          {/* Match counter */}
          {matchedGroups.length > 1 && (
            <div className="flex items-center gap-2 mt-6 text-sm text-gray-600">
              <span className="font-medium">{currentGroupIndex + 1}</span>
              <span>of</span>
              <span className="font-medium">{matchedGroups.length}</span>
              <span>{activeTab === 0 ? "travelers" : "groups"}</span>
            </div>
          )}
        </div>
      ) : (
        /* No Results or Initial State */
        <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-hidden">
          {lastSearchData ? (
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No matches found</h3>
              <p className="text-gray-600 mb-6 max-w-md">
                Try adjusting your search criteria or dates to find more {activeTab === 0 ? "travel companions" : "travel groups"}.
              </p>
              <div className="bg-background rounded-lg p-4 text-sm text-gray-600">
                <p><strong>Destination:</strong> {lastSearchData.destination}</p>
                <p><strong>Budget:</strong> ₹{lastSearchData.budget.toLocaleString()}</p>
                <p><strong>Dates:</strong> {lastSearchData.startDate.toLocaleDateString()} - {lastSearchData.endDate.toLocaleDateString()}</p>
                <p><strong>Mode:</strong> {activeTab === 0 ? "Solo Travel" : "Group Travel"}</p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Start your search</h3>
              <p className="text-gray-600 max-w-md">
                Enter your travel details in the sidebar to find compatible {activeTab === 0 ? "travel companions" : "travel groups"}.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
