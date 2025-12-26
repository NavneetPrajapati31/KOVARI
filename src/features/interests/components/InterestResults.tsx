
import React, { useState } from "react";
import { InterestCard } from "@/features/interests/components/InterestCard";
import type { Interest } from "@/features/interests/components/InterestCard";

interface InterestResultsProps {
  interests: Interest[];
  onAccept?: (interestId: string) => void;
  onDecline?: (interestId: string) => void;
  isLoading?: boolean;
}

const InterestResults: React.FC<InterestResultsProps> = ({
  interests,
  onAccept,
  onDecline,
  isLoading: externalLoading = false,
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="text-center text-red-500 py-8" role="alert">
        Failed to load interests. Please try again.
      </div>
    );
  }

  if (!interests || interests.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No interests found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 justify-items-start">
      {interests.map((interest) => (
        <InterestCard
          key={interest.id}
          interest={interest}
          onAccept={() => onAccept?.(interest.id)}
          onDecline={() => onDecline?.(interest.id)}
        />
      ))}
    </div>
  );
};

export type { Interest };
export default InterestResults;
