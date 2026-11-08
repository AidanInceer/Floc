import type { TripKnow } from "../../know-types";

export const PERU_SACRED_VALLEY: TripKnow = {
  checked: "2026-11-07",
  advice: [{ country: "Peru", slug: "peru" }],
  stages: [
    {
      stage: "Before you book",
      tips: [
        {
          icon: "ticket",
          title: "Buy Machu Picchu tickets first",
          text: "Buy them only on the official site, **2 to 3 months** ahead for June to October. Slots run every hour from **06:00 to 15:00**, with **30 minutes** of grace. Tickets are non-refundable and the name must match your passport.",
          link: { label: "Buy Machu Picchu tickets", href: "https://tuboleto.cultura.pe" },
        },
        {
          icon: "ticket",
          title: "Check the daily limit the week you go",
          text: "In 2026 the limit is **4,500** a day, or **5,600** in high season (from 19 June) and on holidays. Check the Machu Picchu site the week you go.",
          link: { label: "Machu Picchu official site", href: "https://machupicchu.gob.pe" },
        },
        {
          icon: "weather",
          title: "Go between May and September",
          text: "These are the dry months, busiest from June to August. April and October are quieter with some rain. Inti Raymi on 24 June fills Cusco.",
        },
        {
          icon: "plane",
          title: "Sleep in Lima before a long-haul flight",
          text: "Do not link a Juliaca flight to a same-day flight home. One delay loses your seat.",
        },
      ],
    },
    {
      stage: "Before you fly",
      tips: [
        {
          icon: "passport",
          title: "Check your passport has 6 months left",
          text: "UK passports need no visa. You can stay up to **90 days** in any **180**. The passport must be valid **6 months** after you arrive.",
        },
        {
          icon: "money",
          title: "Pay the Lima airport fee online if you connect",
          text: "The UK government says passengers connecting through Lima pay a separate airport use fee from 7 December.",
        },
      ],
    },
    {
      stage: "Landing",
      tips: [
        {
          icon: "car",
          title: "Allow extra time from Lima airport",
          text: "Rush-hour traffic can add a lot. Landing by **13:00** makes the **14:00** ride to Miraflores realistic.",
        },
      ],
    },
    {
      stage: "Money",
      tips: [
        {
          icon: "money",
          title: "Carry soles in coins and small notes",
          text: "You need them for markets, buses and toilets. Maras, Rainbow Mountain and many small sites take cash only.",
        },
        {
          icon: "money",
          title: "Take out cash in Cusco",
          text: "Cash machines are rare in the small valley towns.",
        },
        {
          icon: "ticket",
          title: "Buy the Cusco sites ticket in person",
          text: "The full ticket is **130 soles** for **10 days** and 16 sites. A part ticket is **70 soles**. Buy at a site or at the office at Avenida El Sol 103 (**08:00 to 18:00**), with your passport. It is not sold online.",
        },
      ],
    },
    {
      stage: "On the road",
      tips: [
        {
          icon: "train",
          title: "Allow 4h 30 for the train from Cusco",
          text: "It takes **3h 30 to 4h 30** and can include a bus to Pachar. It stops at Poroy, outside central Cusco, so take a taxi in. From Ollantaytambo to Machu Picchu is about **1h 30**.",
        },
        {
          icon: "train",
          title: "Book the train early and check bags",
          text: "Rules differ by service. Book train seats early for June to October.",
        },
        {
          icon: "car",
          title: "Take a tourist coach to Puno",
          text: "Direct buses take **7 to 9 hours**. The coach takes **9 to 10 hours** with stops at Andahuaylillas, Raqchi and the La Raya pass at **4,438 m**. Entry fees at the stops are extra, and you arrive at about **17:00**.",
        },
        {
          icon: "car",
          title: "Ask the fare before you get in",
          text: "Local buses and shared vans link Cusco, Pisac, Urubamba and Ollantaytambo.",
        },
      ],
    },
    {
      stage: "At the stops",
      stops: [
        {
          place: "Cusco",
          tips: [
            {
              title: "Ask whether your ticket covers Qorikancha",
              text: "Ask at the ticket desk, because cover can differ. Saqsaywaman is on the part ticket you can rely on.",
            },
          ],
        },
        {
          place: "Sacred Valley",
          tips: [
            {
              title: "Time Pisac for a Sunday",
              text: "The big market is on Sunday. Tuesday and Thursday are smaller.",
            },
            {
              title: "Pay for Maras at the site",
              text: "It costs **10 soles** and is not on the Cusco ticket. You may only see the salt pans from a viewpoint. Moray is on a part ticket of **70 soles**.",
            },
          ],
        },
        {
          place: "Aguas Calientes",
          tips: [
            {
              title: "Queue for the first bus at 05:00",
              text: "It starts at about **05:30** and takes **25 to 30 min**. That gets you to a **06:00** slot.",
            },
            {
              title: "Pack small for the citadel",
              text: "Bags are limited to **40 x 35 x 20 cm**. No food, tripods, drones or selfie sticks. The visit is one way, with no re-entry, and takes up to **4 hours**. Toilets are outside the gate.",
            },
          ],
        },
        {
          place: "Puno",
          tips: [
            {
              title: "Go to the Uros islands early",
              text: "They are busy, with rows of tour boats. Taquile is quieter. The full-day trip is back in Puno at about **17:00**.",
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
          title: "Take it easy for the first 24 hours",
          text: "Cusco is about **3,400 m** and Puno about **3,800 m**. Drink water, go light on alcohol and eat little at night. Coca tea helps some people.",
        },
        {
          icon: "health",
          title: "Ask a doctor about altitude tablets",
          text: "Ask about acetazolamide before you go if you have had altitude trouble.",
        },
        {
          icon: "walk",
          title: "Leave Rainbow Mountain until late in the trip",
          text: "The top is about **5,000 m** or more. Pickup is **03:30 to 05:00**, and the fee is **25 to 30 soles** in cash. It is the hardest day.",
        },
        {
          icon: "health",
          title: "Check vaccine advice before you go",
          text: "Malaria risk is low or none on this route.",
        },
      ],
    },
    {
      stage: "Every day",
      tips: [
        {
          icon: "chat",
          title: "Ask before photographing people in traditional dress",
          text: "A few soles is the custom. Hola, gracias and por favor go a long way.",
        },
      ],
    },
  ],
};
