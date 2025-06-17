import Navbar from "@/components/Navbar";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <div className="h-screen flex flex-col items-center justify-center text-center p-6">
        <h1 className="text-4xl font-heading font-medium mb-4">
          Welcome to KOVARI
        </h1>
        <p className="text-lg font-body text-gray-600 mb-6">
          Find your ideal travel companions, co-create trips, and explore
          together.
        </p>
        <a
          href="/profile"
          className="px-6 py-2 border-1 border-border bg-transparent text-foreground rounded-full transition"
        >
          Get Started
        </a>
      </div>
    </>
  );
}
