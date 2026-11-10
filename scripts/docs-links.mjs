/** The links a skill or agent file makes into docs/, written from the repo root. */
export const docLinks = (text) => [...text.matchAll(/\]\((docs\/[^)\s]+)\)/g)].map((match) => match[1]);
