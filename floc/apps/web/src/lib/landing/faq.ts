export type FaqItem = { key: string; question: string; answer: string };

/** `monthly` is Stripe's formatted price; null when it cannot be read, so Pro sells without a figure. */
export function landingFaq({ sellingPro, monthly }: { sellingPro: boolean; monthly: string | null }): FaqItem[] {
  const pro: FaqItem = {
    key: "pro",
    question: "What does Pro add?",
    answer:
      "The weather on your dates, a packing list built from the forecast and the plan, booking searches filled in with your place and dates, and more room for tickets. One person on Pro opens it for the whole trip" +
      (monthly ? `, for ${monthly} a month.` : "."),
  };
  return [
    {
      key: "free",
      question: "Is Floc free?",
      answer: sellingPro
        ? "Yes. The vote, the dates, the route, the money and the packing are free for everyone in the trip. Pro adds a few extras on top."
        : "Yes. The vote, the dates, the route, the money and the packing are free for everyone in the trip.",
    },
    {
      key: "account",
      question: "Does everyone need an account?",
      answer:
        "Not to look. The invite link shows the plan before anyone signs up. To vote, add a cost or claim the speaker, each person makes a free account.",
    },
    {
      key: "booking",
      question: "Can I book through Floc?",
      answer:
        "No. Floc links out to flight and stay searches; you book where you like, then keep the booking on the trip so the group can see it.",
    },
    {
      key: "money",
      question: "Does money go through Floc?",
      answer:
        "No. Floc works out who owes who. You pay each other however you usually do, then record it and the balances clear.",
    },
    ...(sellingPro ? [pro] : []),
  ];
}
