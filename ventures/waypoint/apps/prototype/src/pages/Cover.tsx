import { go } from "../ui";

// ADR 0011: the landing page teaches by walking one real trip, in the app's
// own furniture. Nothing here is a marketing device that doesn't exist inside.

export function Cover() {
  return (
    <main className="page">
      <div className="sheet">
        <span className="tape l" />
        <span className="tape r" />
        <section className="cover">
          <span className="typed">A notebook nine people can write in at once</span>
          <h1>
            Start the trip as <u>notes</u>. Finish it as a plan.
          </h1>
          <p className="lede">
            Everyone scribbles: a place, a price, the week they can't do, the pub someone swears by. Waypoint keeps it
            on one page and quietly turns it into dates, a route and a bill everyone agrees on.
          </p>
          <div className="cta">
            <button className="pen lg" onClick={() => go("#/trips")}>
              Open the book
            </button>
            <button className="pen plain lg" onClick={() => go("#/t/nc500/route")}>
              Read someone else's
            </button>
          </div>
          <p className="scrawl">— started 14 Feb, still arguing about Croatia</p>
          <svg className="doodle" viewBox="0 0 200 150" fill="none" aria-hidden="true">
            <path
              d="M18 122 C 46 96, 62 118, 86 92 C 108 68, 128 84, 150 52"
              stroke="var(--pen)"
              strokeWidth="1.6"
              strokeDasharray="5 4"
              strokeLinecap="round"
            />
            <circle cx="18" cy="122" r="4" fill="var(--pen)" />
            <circle cx="86" cy="92" r="4" fill="var(--pen)" />
            <circle cx="150" cy="52" r="5" fill="none" stroke="var(--red)" strokeWidth="2" />
            <path d="M150 52 l 12 -18 l 5 9 l 10 -3" stroke="var(--red)" strokeWidth="1.4" strokeLinecap="round" />
            <text x="118" y="34" fontFamily="Caveat, cursive" fontSize="17" fill="var(--red)">
              here?
            </text>
          </svg>
        </section>
        <div className="chapters">
          <div>
            <span className="typed">One</span>
            <h3>Everyone writes</h3>
            <p>Places, prices, links, the week you can't do. Join by link — no account to vote.</p>
          </div>
          <div>
            <span className="typed">Two</span>
            <h3>The book decides</h3>
            <p>Votes tally themselves. A block is one mark, it's visible, and it needs a reason.</p>
          </div>
          <div>
            <span className="typed">Three</span>
            <h3>It draws the route</h3>
            <p>Stops become a line with nights, drives and beds against them.</p>
          </div>
          <div>
            <span className="typed">Four</span>
            <h3>The money settles</h3>
            <p>A shared ledger, not a payment app. It works out who pays whom, in as few transfers as it can.</p>
          </div>
        </div>
      </div>
      <p className="colophon">
        Prototype of the ADR 0010 MVP cut, in the Paper visual direction. Data lives in your browser and nowhere else.
      </p>
    </main>
  );
}
