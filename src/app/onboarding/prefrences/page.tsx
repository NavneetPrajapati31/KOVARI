// src/app/onboarding/preferences/page.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const interestsList = [
  'Hiking',
  'Photography',
  'Culture',
  'Food',
  'Music',
  'History',
  'Adventure',
  'Nightlife',
  'Local Tours'
];

const tripFrequencies = [
  'Once a year',
  'Every 6 months',
  'Monthly',
  'Digital nomad'
];

const preferencesSchema = z.object({
  destinations: z.string().min(1, 'Please enter at least one destination'),
  from: z.string().min(1, 'Start date is required'),
  to: z.string().min(1, 'End date is required'),
  mode: z.enum(['solo', 'group'], { required_error: 'Please select a travel style' }),
  hobbies: z.array(z.string()).min(1, 'Please select at least one interest'),
  activityDescription: z.string().optional(),
  frequency: z.string().optional(),
});

type PreferencesForm = z.infer<typeof preferencesSchema>;

export default function TravelPreferencesPage() {
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PreferencesForm>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      destinations: '',
      from: '',
      to: '',
      mode: undefined,
      hobbies: [],
      activityDescription: '',
      frequency: '',
    },
  });

  const onSubmit = (data: PreferencesForm) => {
    console.log('Submitted:', data);
  };

  const handleHobbyToggle = (hobby: string) => {
    const current = watch('hobbies');
    const updated = current.includes(hobby)
      ? current.filter((h) => h !== hobby)
      : [...current, hobby];
    setValue('hobbies', updated);
    setSelectedHobbies(updated);
  };

  return (
    <div className="min-h-screen bg-[#F6ECD9] text-[#004831] px-6 py-12">
      <div className="max-w-xl mx-auto bg-[#E1DBCA] p-8 rounded-xl shadow-md">
        <h1 className="text-3xl font-serif font-bold mb-2 text-center">Travel Preferences</h1>
        <p className="text-[#5C6249] text-center mb-6">Customize your upcoming travel experience</p>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Preferred Destinations */}
          <label className="block mb-2 font-medium">Preferred Destinations</label>
          <input
            type="text"
            placeholder="e.g., Bali, Tokyo, Paris"
            {...register('destinations')}
            className="w-full border border-[#B2A890] bg-[#F6ECD9] text-[#004831] px-4 py-2 rounded mb-1"
          />
          {errors.destinations && <p className="text-sm text-red-600 mb-4">{errors.destinations.message}</p>}

          {/* Travel Dates */}
          <label className="block mb-2 font-medium">Preferred Dates</label>
          <div className="flex gap-4 mb-1">
            <input
              type="date"
              {...register('from')}
              className="flex-1 border border-[#B2A890] bg-[#F6ECD9] px-4 py-2 rounded"
            />
            <input
              type="date"
              {...register('to')}
              className="flex-1 border border-[#B2A890] bg-[#F6ECD9] px-4 py-2 rounded"
            />
          </div>
          {(errors.from || errors.to) && (
            <p className="text-sm text-red-600 mb-4">
              {errors.from?.message || errors.to?.message}
            </p>
          )}

          {/* Travel Mode */}
          <label className="block mb-2 font-medium">Travel Style</label>
          <div className="flex gap-4 mb-1">
            <button
              type="button"
              onClick={() => setValue('mode', 'solo')}
              className={`flex-1 px-4 py-2 rounded border border-[#004831] transition ${
                watch('mode') === 'solo' ? 'bg-[#004831] text-white' : 'bg-[#F6ECD9]'
              }`}
            >
              Solo
            </button>
            <button
              type="button"
              onClick={() => setValue('mode', 'group')}
              className={`flex-1 px-4 py-2 rounded border border-[#004831] transition ${
                watch('mode') === 'group' ? 'bg-[#004831] text-white' : 'bg-[#F6ECD9]'
              }`}
            >
              Group
            </button>
          </div>
          {errors.mode && <p className="text-sm text-red-600 mb-4">{errors.mode.message}</p>}

          {/* Trip Focus / Activities */}
          <label className="block mb-2 font-medium">Trip Focus / Activities</label>
          <div className="flex flex-wrap gap-3 mb-4">
            {interestsList.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => handleHobbyToggle(label)}
                className={`px-3 py-1 rounded-full text-sm border transition ${
                  selectedHobbies.includes(label)
                    ? 'bg-[#9BA186] text-white border-[#9BA186]'
                    : 'text-[#3D3C2C] border-[#004831] hover:bg-[#D6D1BC]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {errors.hobbies && <p className="text-sm text-red-600 mb-4">{errors.hobbies.message}</p>}

          {/* Activities Description */}
          <label className="block mb-2 font-medium">Describe what kind of activities you are looking for</label>
          <textarea
            rows={3}
            {...register('activityDescription')}
            placeholder="Tell us about your ideal trip activities (optional)"
            className="w-full border border-[#B2A890] bg-[#F6ECD9] text-[#004831] px-4 py-2 rounded mb-4"
          />

          {/* Trip Frequency */}
          <label className="block mb-2 font-medium">How often do you travel?</label>
          <div className="grid gap-2 mb-4">
            {tripFrequencies.map((freq) => (
              <label key={freq} className="flex items-center gap-2">
                <input
                  type="radio"
                  value={freq}
                  {...register('frequency')}
                  className="accent-[#004831]"
                />
                <span className="text-sm text-[#004831]">{freq}</span>
              </label>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <button type="button" className="px-4 py-2 border border-[#004831] rounded text-[#004831] hover:bg-[#ECEABE]">Back</button>
            <button type="submit" className="px-4 py-2 bg-[#004831] text-white rounded hover:bg-[#003527]">Continue</button>
          </div>
        </form>
      </div>
    </div>
  );
}