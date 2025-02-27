import { DateTime } from "@/components/modules/DateTime";

export default function Home() {
  return (
    <div className="container mx-auto p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your personal dashboard
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* DateTime Module */}
        <div className="h-[200px]">
          <DateTime />
        </div>

        {/* Add more modules here */}
      </div>
    </div>
  );
}
