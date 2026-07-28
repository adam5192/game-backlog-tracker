import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// trimmed-down game info to feed to the model
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

type Recommendation = {
  userGameId: string;
  reason: string;
};

export async function getRecommendation(
  completed: CompletedGame[],
  backlog: BacklogGame[],
): Promise<Recommendation | null> {
  // not enough detail to make a meaningful recommendation, so dont show anything
  if (completed.length === 0 || backlog.length === 0) {
    return null;
  }

  // build the prompt as plain text with rating history, notes, backlog
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

  const message = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `You are helping someone decide what game to play next from their backlog, based on their play history.

        Games they've completed and rated:
        ${completedSummary}

        Their backlog to choose from (format: [id] name: description):
        ${backlogSummary}

        Pick exactly ONE game from the backlog that best fits their taste based on their rating history. Respond with ONLY valid JSON, no other text, in this exact shape:
        {"userGameId": "<the id in brackets from the backlog list>", "reason": "<a short, specific, 1-2 sentence explanation referencing their actual play history>"}`,
      },
    ],
  });

  // claude response comes back as an array of content blocks
  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;

  try {
    // strip possible markdown code fences just in case
    const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    // validate the model actually picked a real backlog id
    const validIds = new Set(backlog.map((g) => g.id));
    if (!validIds.has(parsed.userGameId)) return null;

    return { userGameId: parsed.userGameId, reason: parsed.reason };
  } catch {
    // if parsing fails, fail gracefully
    return null;
  }
}
