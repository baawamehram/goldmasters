export default function CompetitionsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container-custom py-12 sm:py-16 lg:py-20">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading mb-8">
          Active Competitions
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Competition cards will be dynamically loaded here */}
          <div className="p-6 sm:p-8 bg-card rounded-xl shadow-card text-center">
            <p className="text-muted-foreground">
              No active competitions at the moment.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Check back soon for new competitions!
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
