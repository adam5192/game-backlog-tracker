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

  try {
    message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: `You are helping someone decide what game to play next from their backlog, based on their play history.

        Games they've completed and rated:
        ${completedSummary}

        Their backlog to choose from (format: [id] name: description):
        ${backlogSummary}

        Pick ${Math.min(count, backlog.length)} DIFFERENT games from the backlog that best fit their taste, ranked best-first. Write each reason addressing the person directly as "you"/"your" (not "they"/"their"). Respond with ONLY valid JSON, no other text, in this exact shape:
        [{"userGameId": "<id from backlog list>", "reason": "<1-2 sentences, addressed to the person as 'you'>"}, ...]`,
        },
      ],
    });
  } catch (err) {
    console.error("Anthropic API call failed:", err);
    return [];
  }

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") return [];

  try {
    const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) return [];

    const validIds = new Set(backlog.map((g) => g.id));
    // filter out any hallucinated ids
    return parsed.filter(
      (r): r is Recommendation =>
        typeof r.userGameId === "string" && validIds.has(r.userGameId),
    );
  } catch {
    return [];
  }
}
