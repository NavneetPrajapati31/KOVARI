import { Loader2 } from "lucide-react";

export default function Spinner() {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-transparent rounded-lg p-6 flex flex-col items-center space-y-4">
        <Loader2 className="h-11 w-11 animate-spin text-white" />
        {/* <p className="text-sm text-white">Saving your profile...</p> */}
      </div>
    </div>
  );
}
