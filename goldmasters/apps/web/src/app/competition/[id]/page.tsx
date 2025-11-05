interface CompetitionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CompetitionPage({ params }: CompetitionPageProps) {
  const { id } = await params;

  // TODO: Fetch competition data from API
  // For now, we'll show a placeholder

  return (
    <main className="min-h-screen bg-background">
      <div className="container-custom py-12 sm:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Competition Header */}
          <div className="bg-card rounded-2xl shadow-card p-6 sm:p-8 mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-heading mb-4">
              Competition #{id}
            </h1>
            <p className="text-muted-foreground mb-6">
              Password-protected competition. Enter the password to participate.
            </p>
            
            {/* Competition Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-brand-primary">55</div>
                <div className="text-sm text-muted-foreground">Total Tickets</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-brand-accent">12</div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-brand-secondary">3</div>
                <div className="text-sm text-muted-foreground">Markers/Ticket</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold">₹500</div>
                <div className="text-sm text-muted-foreground">Per Ticket</div>
              </div>
            </div>
          </div>

          {/* Competition Image Preview */}
          <div className="bg-card rounded-2xl shadow-card p-6 sm:p-8 mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">
              Competition Image
            </h2>
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Image will be displayed here</p>
            </div>
          </div>

          {/* Enter Competition CTA */}
          <div className="bg-gradient-to-r from-brand-primary to-brand-accent rounded-2xl shadow-card p-6 sm:p-8 text-center text-white">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Ready to Play?
            </h2>
            <p className="mb-6 opacity-90">
              Enter the competition password to start placing your markers
            </p>
            <button className="btn-touch px-8 py-4 bg-white text-brand-primary font-semibold rounded-lg hover:bg-white/90 transition-all">
              Enter Competition
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
