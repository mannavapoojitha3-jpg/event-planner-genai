interface LandingProps {
  onStart: () => void;
}

const FEATURES = [
  { title: 'Personalised ideas', text: 'Themes, decor, catering and activities shaped by your guests, budget and preferences.' },
  { title: 'Budget estimates', text: 'See allocations against estimated spend, with overspend flagged clearly.' },
  { title: 'Timeline', text: 'A dated checklist of milestones, built back from your event date.' },
  { title: 'Vendor tracker', text: 'Track each vendor role from shortlist to booked.' },
];

export function Landing({ onStart }: LandingProps) {
  return (
    <section className="landing" aria-labelledby="landing-title">
      <div className="landing__hero">
        <p className="eyebrow">Event planning, simplified</p>
        <h1 id="landing-title">Plan your wedding, birthday or community event in minutes</h1>
        <p className="lead">
          Describe your event once. Get a themed plan, a budget breakdown, a timeline and a vendor checklist, then refine
          everything through a simple chat.
        </p>
        <button type="button" className="button button--primary" onClick={onStart}>
          Plan my event
        </button>
        <p className="fineprint">
          Costs shown are planning estimates, not verified market prices. Vendor roles are a checklist only; no real vendors
          are contacted or listed.
        </p>
      </div>
      <ul className="feature-grid" aria-label="What you get">
        {FEATURES.map((feature) => (
          <li key={feature.title} className="feature-card">
            <h2>{feature.title}</h2>
            <p>{feature.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
