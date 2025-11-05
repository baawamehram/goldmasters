export default function JudgementRoundPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-primary/10 via-white to-brand-accent/10 py-10 px-4">
      <div className="container-custom max-w-4xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold font-heading text-brand-primary">Phase 1 Judgement Round</h1>
          <p className="text-muted-foreground">
            Use this space to manage review activities after Phase 1 closes. You can extend this page with scorecards, reviewer assignments, or any other workflows needed for the judging panel.
          </p>
        </header>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Next Steps</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
            <li>Review participant submissions and shortlist finalists.</li>
            <li>Upload judging notes or attach supporting documents.</li>
            <li>Coordinate with the panel before opening Phase 2.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
