// src/app/onboarding/preferences/page.tsx
'use client';

import { useState } from 'react';

const tripFocusOptions = [
  'Hiking',
  'Trekking',
  'Photography',
  'Nightlife',
  'Food',
  'Culture',
  'Museums',
  'Shopping',
  'Local Tours',
  'Adventure'
];

const dietaryOptions = ['Vegetarian', 'Vegan', 'Non-Veg', 'Jain', 'No Alcohol', 'Gluten-Free'];

export default function TravelPreferencesPage() {
  const [destinations, setDestinations] = useState('');
  const [dates, setDates] = useState({ from: '', to: '' });
  const [mode, setMode] = useState<'solo' | 'group' | null>(null);
  const [tripFocus, setTripFocus] = useState<string[]>([]);
  const [dietary, setDietary] = useState<string[]>([]);

  const toggleItem = (
    item: string,
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setList((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  return (
    <div className="min-h-screen bg-[#F6ECD9] text-[#004831] px-6 py-12">
      <div className="max-w-xl mx-auto bg-[#E1DBCA] p-8 rounded-xl shadow-md">
        <h1 className="text-3xl font-serif font-bold mb-2 text-center">Travel Preferences</h1>
        <p className="text-[#5C6249] text-center mb-6">Customize your upcoming travel experience</p>

        {/* Preferred Destinations */}
        <label className="block mb-2 font-medium">Preferred Destinations</label>
        <input
          type="text"
          placeholder="e.g., Bali, Tokyo, Paris"
          value={destinations}
          onChange={(e) => setDestinations(e.target.value)}
          className="w-full border border-[#B2A890] bg-[#F6ECD9] text-[#004831] px-4 py-2 rounded mb-4"
        />

        {/* Travel Dates */}
        <label className="block mb-2 font-medium">Preferred Dates</label>
        <div className="flex gap-4 mb-4">
          <input
            type="date"
            value={dates.from}
            onChange={(e) => setDates({ ...dates, from: e.target.value })}
            className="flex-1 border border-[#B2A890] bg-[#F6ECD9] px-4 py-2 rounded"
          />
          <input
            type="date"
            value={dates.to}
            onChange={(e) => setDates({ ...dates, to: e.target.value })}
            className="flex-1 border border-[#B2A890] bg-[#F6ECD9] px-4 py-2 rounded"
          />
        </div>

        {/* Travel Mode */}
        <label className="block mb-2 font-medium">Travel Style</label>
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setMode('solo')}
            className={`flex-1 px-4 py-2 rounded border border-[#004831] transition ${
              mode === 'solo' ? 'bg-[#004831] text-white' : 'bg-[#F6ECD9]'
            }`}
          >
            Solo
          </button>
          <button
            onClick={() => setMode('group')}
            className={`flex-1 px-4 py-2 rounded border border-[#004831] transition ${
              mode === 'group' ? 'bg-[#004831] text-white' : 'bg-[#F6ECD9]'
            }`}
          >
            Group
          </button>
        </div>

        {/* Trip Focus (Merged Interests & Activities) */}
        <label className="block mb-2 font-medium">Trip Focus</label>
        <div className="flex flex-wrap gap-3 mb-6">
          {tripFocusOptions.map((item) => (
            <button
              key={item}
              onClick={() => toggleItem(item, setTripFocus)}
              className={`px-3 py-1 rounded-full border border-[#B2A890] text-sm transition ${
                tripFocus.includes(item)
                  ? 'bg-[#9BA186] text-white'
                  : 'bg-[#ECEABE] text-[#3D3C2C] hover:bg-[#D6D1BC]'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Dietary Preferences */}
        <label className="block mb-2 font-medium">Dietary Preferences</label>
        <div className="flex flex-wrap gap-3 mb-6">
          {dietaryOptions.map((diet) => (
            <button
              key={diet}
              onClick={() => toggleItem(diet, setDietary)}
              className={`px-3 py-1 rounded-full border border-[#B2A890] text-sm transition ${
                dietary.includes(diet)
                  ? 'bg-[#9BA186] text-white'
                  : 'bg-[#ECEABE] text-[#3D3C2C] hover:bg-[#D6D1BC]'
              }`}
            >
              {diet}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button className="px-4 py-2 border border-[#004831] rounded text-[#004831] hover:bg-[#ECEABE]">Back</button>
          <button className="px-4 py-2 bg-[#004831] text-white rounded hover:bg-[#003527]">Continue</button>
        </div>
      </div>
    </div>
  );
}