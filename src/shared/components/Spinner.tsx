import { Spinner as HerouiSpinner } from "@heroui/react";

export default function Spinner() {
  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
      <div className="bg-transparent rounded-lg p-6 flex flex-col items-center space-y-4">
        <HerouiSpinner variant="spinner" size="md" color="primary" />
        {/* <p className="text-sm text-white">Saving your profile...</p> */}
      </div>
    </div>
  );
}
