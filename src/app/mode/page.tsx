export default function TravelMode() {
  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">How are you traveling?</h2>
      <div className="flex justify-center gap-6">
        <a
          href="/explore"
          className="bg-purple-600 text-white px-6 py-3 rounded"
        >
          Solo Traveler
        </a>
        <a href="/circle" className="bg-teal-600 text-white px-6 py-3 rounded">
          Create Group
        </a>
      </div>
    </div>
  );
}
