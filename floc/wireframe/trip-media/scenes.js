let uid = 0;

const sky = (top, low) => {
  const id = `s${++uid}`;
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${low}"/></linearGradient></defs><rect width="400" height="300" fill="url(#${id})"/>`;
};

const windows = (x, y, w, h, colour) => {
  let out = "";
  for (let r = y + 10; r < y + h - 12; r += 22) for (let c = x + 7; c < x + w - 9; c += 16) out += `<rect x="${c}" y="${r}" width="7" height="12" fill="${colour}"/>`;
  return out;
};

const house = (x, y, w, wall, roof) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${230 - y}" fill="${wall}"/><path d="M${x - 3} ${y}l${w / 2 + 3}-16 ${w / 2 + 3} 16Z" fill="${roof}"/>${windows(x, y, w, 230 - y, "hsl(215 25% 28% / .72)")}`;

const SCENES = {
  tram: () =>
    sky("hsl(203 72% 72%)", "hsl(38 70% 88%)") +
    house(-8, 72, 92, "hsl(42 62% 76%)", "hsl(13 58% 48%)") + house(84, 48, 84, "hsl(350 42% 72%)", "hsl(13 52% 42%)") +
    house(168, 82, 100, "hsl(195 34% 74%)", "hsl(16 58% 50%)") + house(268, 56, 140, "hsl(36 44% 86%)", "hsl(12 55% 44%)") +
    `<rect y="228" width="400" height="72" fill="hsl(30 8% 42%)"/><path d="M0 262h400M0 274h400" stroke="hsl(30 8% 70%)" stroke-width="2"/>` +
    `<rect x="112" y="142" width="178" height="112" rx="12" fill="hsl(47 92% 54%)"/><rect x="112" y="204" width="178" height="50" rx="6" fill="hsl(40 30% 94%)"/><rect x="126" y="158" width="150" height="38" rx="4" fill="hsl(205 35% 30%)"/><path d="M163 158v38M201 158v38M239 158v38" stroke="hsl(47 92% 54%)" stroke-width="4"/><circle cx="150" cy="258" r="11" fill="hsl(220 10% 16%)"/><circle cx="252" cy="258" r="11" fill="hsl(220 10% 16%)"/><path d="M201 142 225 96" stroke="hsl(220 10% 18%)" stroke-width="3"/><path d="M0 96h400" stroke="hsl(220 10% 18%)"/>`,
  tiles: () => {
    let out = `<rect width="400" height="300" fill="hsl(42 45% 92%)"/>`;
    for (let y = -10; y < 300; y += 60) for (let x = -10; x < 400; x += 60) {
      out += `<g transform="translate(${x} ${y})"><rect width="58" height="58" fill="hsl(42 42% 93%)"/><path d="M29 4 42 16 54 29 42 42 29 54 16 42 4 29 16 16Z" fill="hsl(216 68% 34%)"/><circle cx="29" cy="29" r="11" fill="hsl(42 42% 93%)"/><circle cx="29" cy="29" r="5" fill="hsl(44 82% 52%)"/><path d="M0 0h11L0 11ZM58 0v11L47 0ZM0 58v-11L11 58ZM58 58H47L58 47Z" fill="hsl(216 68% 42%)"/></g>`;
    }
    return out;
  },
  roofs: () => {
    let out = sky("hsl(205 76% 70%)", "hsl(190 48% 86%)") + `<rect y="98" width="400" height="60" fill="hsl(198 54% 54%)"/>`;
    [[122, 42], [150, 34], [178, 26]].forEach(([y, step], row) => {
      for (let x = -30 + row * 18; x < 420; x += step * 2) {
        const tone = 10 + ((x + row * 7) % 18);
        out += `<path d="M${x} ${y + 34}l${step}-${step * 0.8} ${step} ${step * 0.8}v150h-${step * 2}Z" fill="hsl(${tone} 58% ${44 + (x % 3) * 4}%)"/><rect x="${x + 8}" y="${y + 34}" width="${step * 2 - 16}" height="130" fill="hsl(38 42% ${80 - row * 5}%)"/>`;
      }
    });
    return out;
  },
  river: () =>
    sky("hsl(211 62% 66%)", "hsl(30 76% 84%)") + `<path d="M0 150q90-36 180-10t220-24v184H0Z" fill="hsl(150 22% 42%)"/><rect y="176" width="400" height="124" fill="hsl(200 48% 44%)"/>` +
    `<path d="M0 118h400" stroke="hsl(12 58% 40%)" stroke-width="7"/><path d="M34 118v84M366 118v84M112 118v70M288 118v70" stroke="hsl(12 58% 40%)" stroke-width="7"/><path d="M34 196Q200 60 366 196" fill="none" stroke="hsl(12 58% 40%)" stroke-width="6"/><path d="M0 232h120M210 252h120M90 274h150" stroke="hsl(198 60% 72%)" stroke-width="3"/>`,
  cliffs: () =>
    sky("hsl(199 82% 68%)", "hsl(190 62% 86%)") + `<rect y="146" width="400" height="154" fill="hsl(183 64% 40%)"/><path d="M0 214q120-22 250 6t150-8v88H0Z" fill="hsl(176 54% 52%)"/>` +
    `<path d="M210 300V132l34-28 52 12 36-32 68 18v198Z" fill="hsl(32 72% 54%)"/><path d="M252 300V170l28-18 36 16 34-22 50 14v140Z" fill="hsl(24 66% 42%)"/><path d="M0 300v-96l40-30 40 22 34 52v52Z" fill="hsl(30 66% 48%)"/><path d="M210 132l34-28 52 12 36-32 68 18v12l-68-14-36 30-52-12-34 28Z" fill="hsl(96 34% 40%)"/>`,
  beach: () => {
    let out = sky("hsl(199 84% 72%)", "hsl(186 68% 88%)") + `<rect y="104" width="400" height="74" fill="hsl(184 66% 44%)"/><path d="M0 178q100-24 210-6t190-8v136H0Z" fill="hsl(42 72% 80%)"/><path d="M0 178q100-24 210-6t190-8" fill="none" stroke="hsl(180 40% 96%)" stroke-width="6"/>`;
    [[70, 226, 4], [164, 250, 354], [282, 214, 26], [340, 262, 200]].forEach(([x, y, hue]) => {
      out += `<path d="M${x} ${y}v34" stroke="hsl(30 18% 34%)" stroke-width="3"/><path d="M${x - 30} ${y + 2}a30 25 0 0 1 60 0Z" fill="hsl(${hue} 72% 58%)"/>`;
    });
    return out;
  },
  sunset: () =>
    sky("hsl(258 38% 40%)", "hsl(28 92% 66%)") + `<circle cx="260" cy="172" r="42" fill="hsl(44 96% 72%)"/><rect y="176" width="400" height="124" fill="hsl(250 30% 28%)"/><path d="M190 196h140M214 214h90M238 232h44" stroke="hsl(36 92% 68%)" stroke-width="4"/><path d="M0 188V132l48 12 34-22 64 42 42 24Z" fill="hsl(258 34% 18%)"/>`,
  boat: () =>
    `<rect width="400" height="300" fill="hsl(186 66% 40%)"/><path d="M0 56q80-20 150 2t250-8M0 132q100 24 200 0t200 8M0 226q90-24 180 4t220-10" fill="none" stroke="hsl(180 56% 66%)" stroke-width="4"/>` +
    `<path d="M100 164h196l-26 44H132Z" fill="hsl(40 40% 96%)"/><path d="M104 170h188l-5 9H110Z" fill="hsl(4 72% 54%)"/><rect x="154" y="128" width="72" height="36" rx="5" fill="hsl(216 44% 28%)"/><path d="M100 212q96 18 200-2" stroke="hsl(186 50% 26%)" stroke-width="7" fill="none"/>`,
  table: () =>
    `<rect width="400" height="300" fill="hsl(28 36% 46%)"/><path d="M0 74h400M0 150h400M0 226h400" stroke="hsl(26 36% 34%)" stroke-width="3"/>` +
    `<circle cx="136" cy="138" r="82" fill="hsl(42 34% 96%)"/><circle cx="136" cy="138" r="60" fill="hsl(24 72% 58%)"/><circle cx="116" cy="118" r="17" fill="hsl(8 66% 46%)"/><circle cx="160" cy="130" r="14" fill="hsl(96 40% 40%)"/><circle cx="130" cy="166" r="15" fill="hsl(42 86% 62%)"/>` +
    `<circle cx="302" cy="84" r="44" fill="hsl(42 34% 96%)"/><circle cx="302" cy="84" r="30" fill="hsl(44 82% 56%)"/><circle cx="312" cy="222" r="34" fill="hsl(350 44% 34%)"/><circle cx="312" cy="222" r="24" fill="hsl(350 54% 24%)"/>`,
  alley: () =>
    sky("hsl(205 72% 76%)", "hsl(205 62% 88%)") + `<path d="M0 0h148l16 300H0Z" fill="hsl(36 52% 76%)"/><path d="M400 0H252l-16 300h164Z" fill="hsl(208 34% 72%)"/><path d="M164 300h72l12-120h-96Z" fill="hsl(30 12% 56%)"/><path d="M148 64Q200 84 252 64M148 112q52 18 104 0" fill="none" stroke="hsl(220 10% 26%)"/><path d="M170 72h18v28h-18ZM214 78h16v24h-16Z" fill="hsl(4 70% 62%)"/><path d="M186 120h22v28h-22Z" fill="hsl(44 90% 64%)"/>` +
    windows(10, 40, 112, 200, "hsl(215 28% 30% / .75)") + windows(280, 34, 110, 220, "hsl(215 28% 30% / .75)"),
  friends: () => {
    let out = sky("hsl(226 44% 52%)", "hsl(26 92% 72%)") + `<circle cx="120" cy="150" r="32" fill="hsl(46 96% 76%)"/><path d="M0 214q120-56 240-20t160-14v120H0Z" fill="hsl(258 32% 22%)"/>`;
    [[176, 178], [214, 170], [252, 176], [292, 186]].forEach(([x, y]) => {
      out += `<circle cx="${x}" cy="${y}" r="10" fill="hsl(258 34% 13%)"/><path d="M${x - 15} ${y + 46}q2-34 15-34t15 34Z" fill="hsl(258 34% 13%)"/>`;
    });
    return out;
  },
};

export const paint = (kind) =>
  `<svg class="pic" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${SCENES[kind]()}</svg>`;

export const SCENE_KINDS = Object.keys(SCENES);
