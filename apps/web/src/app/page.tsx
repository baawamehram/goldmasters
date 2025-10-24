import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-primary/5 via-white to-brand-accent/5">
      {/* Hero Section */}
      <section className="container-custom py-12 sm:py-16 lg:py-24">
        <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-heading text-brand-dark">
            Welcome to{" "}
            <span className="text-gradient">Wishmasters</span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl px-4">
            Private, invite-only Spot-the-Ball competitions. Test your precision and win amazing prizes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link
              href="/competitions"
              className="btn-touch px-8 py-4 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-primary/90 transition-all hover:shadow-card-hover"
            >
              View Competitions
            </Link>
            <Link
              href="/admin"
              className="btn-touch px-8 py-4 border-2 border-brand-primary text-brand-primary font-semibold rounded-lg hover:bg-brand-primary/5 transition-all"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container-custom py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 sm:p-8 bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-3 font-heading">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

const features = [
  {
    icon: "🎯",
    title: "Skill-Based Competition",
    description: "Place your markers with precision. Closest to the judged position wins.",
  },
  {
    icon: "🔒",
    title: "Private & Secure",
    description: "Invite-only competitions with password-protected access.",
  },
  {
    icon: "🎫",
    title: "Limited Tickets",
    description: "Each competition has a limited number of tickets. First come, first served.",
  },
  {
    icon: "👨‍⚖️",
    title: "Fair Judging",
    description: "External judges determine the winning coordinates transparently.",
  },
  {
    icon: "🏆",
    title: "Win Prizes",
    description: "Top positions win exciting prizes. Full results published after judging.",
  },
  {
    icon: "📊",
    title: "Audit Trail",
    description: "Complete transparency with full audit logs and result verification.",
  },
];

