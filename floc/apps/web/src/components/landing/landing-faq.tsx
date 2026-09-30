import type { FaqItem } from "@/lib/landing/faq";
import { Card, cx } from "@/components/system/ui";
import { FaqObject } from "./faq-object";

const skins: Record<string,string> = {
  free: "landing-faq-free",
  account: "landing-faq-account",
  booking: "landing-faq-booking",
  money: "landing-faq-money",
  pro: "landing-faq-pro",
};

export function LandingFaq({ items }: { items: FaqItem[] }) {
  if (!items.length) return null;

  return (
    <div className="landing-faq-ground">
      <div className="landing-faq-wrap">
        <div className="landing-faq-intro">
          <h2 className="band-title" id="landing-faq-heading">Before you ask</h2>
          <p>The same Sicily trip.<br />A few things cleared up.</p>
        </div>
        <div className="landing-faq-scene" data-count={items.length} role="group" aria-labelledby="landing-faq-heading">
          <div className="landing-faq-route" aria-hidden="true" />
          {items.map((item) => (
            <Card key={item.key} as="article" className={cx("landing-faq-object rounded-[20px] border-rule-strong bg-sheet! shadow-raised",skins[item.key])}>
              <FaqObject kind={item.key} />
              <details className="landing-faq-detail">
                <summary><span>{item.question}</span><span className="landing-faq-plus" aria-hidden="true">+</span></summary>
                <p>{item.answer}</p>
              </details>
            </Card>
          ))}
        </div>
        <span className="landing-faq-example">Illustrative trip · answers describe the current product</span>
      </div>
    </div>
  );
}
