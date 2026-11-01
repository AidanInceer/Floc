export type AssistantKey = "chatgpt" | "claude" | "grok" | "lechat" | "perplexity";
export type Assistant = { key: AssistantKey; name: string; by: string; ask: string };

// Only assistants that open with the brief from the link; one that needs a paste is left out.
export const ASSISTANTS: readonly Assistant[] = [
  { key: "chatgpt", name: "ChatGPT", by: "OpenAI", ask: "https://chatgpt.com/?q=" },
  { key: "claude", name: "Claude", by: "Anthropic", ask: "https://claude.ai/new?q=" },
  { key: "grok", name: "Grok", by: "xAI", ask: "https://grok.com/?q=" },
  { key: "lechat", name: "Le Chat", by: "Mistral", ask: "https://chat.mistral.ai/chat?q=" },
  { key: "perplexity", name: "Perplexity", by: "Perplexity", ask: "https://www.perplexity.ai/search?q=" },
];

export const BRIEF_MAX = 1200;

/** The whole message an assistant gets: where Floc is, the group's own guidance, and a plan in Floc's day-first shape (rule 3). */
export function briefFor(origin: string, guidance: string): string {
  const own = guidance.trim().slice(0, BRIEF_MAX);
  return [
    own ? `Plan a trip with Floc (${origin}) based on the following guidance:` : `Plan a trip with Floc (${origin}).`,
    own,
    "Lay it out day by day, with where we sleep each night, so we can add it to our Floc trip.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function askHref(assistant: Assistant, brief: string): string {
  return assistant.ask + encodeURIComponent(brief);
}
