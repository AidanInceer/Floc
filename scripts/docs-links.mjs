export const docLinks = (text) => [...text.matchAll(/\]\((docs\/[^)\s]+)\)/g)].map((match) => match[1]);
