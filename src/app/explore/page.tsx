export default function ExplorePage() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">
        Explore Travelers & Groups
      </h2>
      {/* TODO: Add filters + card grid here */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="border p-4 rounded shadow">Traveler Card 1</div>
        <div className="border p-4 rounded shadow">Group Card 2</div>
      </div>
    </div>
  );
}
