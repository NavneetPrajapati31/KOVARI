'use client';

import { useRouter } from 'next/navigation';
import { useModeStore } from '@/stores/useModeStore';
import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { saveTravelMode } from '@/lib/api/saveMode';

export default function TravelModePage() {
  const router = useRouter();
  const setModeStore = useModeStore((s) => s.setMode);
  const { user, isSignedIn } = useUser();

  const [localMode, setLocalMode] = useState<'solo' | 'group' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = (mode: 'solo' | 'group') => {
    setLocalMode(mode);
    setModeStore(mode); // ✅ Save in Zustand global store
  };

  const handleNext = async () => {
    if (!localMode || !isSignedIn || !user) return;

    setLoading(true);

    // Save to Supabase
    const { error } = await saveTravelMode(user.id, localMode);

    if (error) {
      console.error('Failed to save mode:', error.message);
      setLoading(false);
      return;
    }

    // Navigate
    if (localMode === 'solo') {
      router.push('/explore');
    } else {
      router.push('/group/create');
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">How would you like to travel?</h1>

      <div className="flex flex-col gap-4">
        <button
          onClick={() => handleSelect('solo')}
          className={`p-4 rounded-lg border ${localMode === 'solo' ? 'bg-blue-600 text-white' : 'bg-white'}`}
        >
          I am a Solo Traveler.
        </button>

        <button
          onClick={() => handleSelect('group')}
          className={`p-4 rounded-lg border ${localMode === 'group' ? 'bg-blue-600 text-white' : 'bg-white'}`}
        >
          I want to Create a Travel Circle
        </button>

        <button
          onClick={handleNext}
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={!localMode || loading}
        >
          {loading ? 'Saving...' : 'Next'}
        </button>
      </div>
    </div>
  );
}
