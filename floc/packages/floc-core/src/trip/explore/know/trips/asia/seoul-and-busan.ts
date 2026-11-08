import type { TripKnow } from "../../know-types";

export const SEOUL_AND_BUSAN: TripKnow = {
  checked: "2026-11-07",
  advice: [
    { country: "South Korea", slug: "south-korea" },
  ],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "train",
          title: "Book the fast train ahead on holidays",
          text: "The fast train from Seoul to Busan takes about **2h 15 to 2h 30**, and the fare is **54,400 won** since 1 September 2026.",
        },
        {
          icon: "plane",
          title: "Fly into Incheon and out of Busan",
          text: "Or the reverse. It saves the **2h 30** train ride back to Seoul. Check flights.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Skip the travel authorisation until 2027",
          text: "UK passports get **90 days** visa-free. The exemption from the Korea electronic travel authorisation runs to **31 December 2026**; check the rule if you fly after that.",
        },
        {
          icon: "passport",
          title: "Fill in the free arrival card",
          text: "Do it online within **72 hours** before you land.",
        },
        {
          icon: "pin",
          title: "Download Naver Map or Kakao Map",
          text: "Google Maps still has no walking or driving directions in Korea.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "train",
          title: "Take the airport express train",
          text: "It reaches Seoul Station in **43 minutes** from Terminal 1 (**51** from Terminal 2) and costs **13,000 won**.",
        },
        {
          icon: "car",
          title: "Budget for a late-night taxi fare",
          text: "A late taxi into the city costs about **50,000 won**.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Buy a T-money card",
          text: "It costs **5,000 won** and works on the subway, buses and taxis. Cashbee cards also work in Busan.",
        },
        {
          icon: "money",
          title: "Carry some cash for short taxi rides",
          text: "Cards are widely used, but drivers often prefer cash.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "car",
          title: "Show taxi drivers the address in Korean",
          text: "English is limited, and insist on the meter. A night surcharge applies from **23:00 to 02:00**.",
        },
        {
          icon: "train",
          title: "Check the direction in Busan stations",
          text: "Changing platforms is often not possible after you tap through.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Seoul",
          tips: [
            {
              title: "Check the palace closing days",
              text: "Gyeongbokgung closes on Tuesdays. Changdeokgung and Changgyeonggung close on Mondays; check the day.",
            },
            {
              title: "Wear a hanbok for free palace entry",
              text: "Free entry in traditional dress is under review, so ask at the gate. Avoid shops that ask for money afterwards.",
            },
            {
              title: "Do not give money to monks near Jogyesa",
              text: "Use the temple box.",
            },
          ],
        },
        {
          place: "Busan",
          tips: [
            {
              title: "Check Jagalchi market before you go",
              text: "It opens daily from about **05:00** and usually closes on the first and third Tuesday, so check the day.",
            },
          ],
        },
      ],
    },
    {
      stage: "Staying well",
      tips: [
        {
          icon: "health",
          title: "Send the health form if you have symptoms",
          text: "Use the QR code or the paper form. The fine can be up to **10 million won**.",
        },
      ],
    },
  ],
};
