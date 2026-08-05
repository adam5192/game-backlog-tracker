import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type CompletedGame = {
  name: string;
  rating: number | null;
  notes: string | null;
};

type BacklogGame = {
  id: string;
  name: string;
  description: string | null;
};

export type Recommendation = {
  userGameId: string;
  reason: string;
};

// now generates several recommendations in ONE api call
export async function getRecommendations(
  completed: CompletedGame[],
  backlog: BacklogGame[],
  count: number = 3,
): Promise<Recommendation[]> {
  if (completed.length === 0 || backlog.length === 0) {
    return [];
  }

  const completedSummary = completed
    .map(
      (g) =>
        `- ${g.name} (rated ${g.rating ?? "unrated"}/10)${g.notes ? `: "${g.notes}"` : ""}`,
    )
    .join("\n");

  const backlogSummary = backlog
    .map(
      (g) =>
        `- [${g.id}] ${g.name}${g.description ? `: ${g.description.slice(0, 150)}` : ""}`,
    )
    .join("\n");

  let message;

  // try up to 2 times in case calude response failts to parse
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const message = await anthropic.messages.create({
        model: "claude-sonnet-5",
        max_tokens: 600,
        messages: [{ role: "user", content: `...same prompt as before...` }],
      });

      const textBlock = message.content.find((block) => block.type === "text");
      if (!textBlock || textBlock.type !== "text") continue; // try again

      const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed)) continue; // try again

      const validIds = new Set(backlog.map((g) => g.id));
      const results = parsed.filter(
        (r): r is Recommendation =>
          typeof r.userGameId === "string" && validIds.has(r.userGameId),
      );

      if (results.length > 0) return results;
    } catch (err) {
      console.error(`Recommendation attempt ${attempt} failed:`, err);
      // either retry or give up after fail 2
    }
  }

  // both attempts failed, return empty array
  return [];
}
