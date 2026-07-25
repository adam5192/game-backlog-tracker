import { NextRequest, NextResponse } from "next/server";
import { HowLongToBeatService } from "howlongtobeat";

// reuse one instance across requests instead of creating a new one every time
const hltbService = new HowLongToBeatService();

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");

  if (!name) {
    return NextResponse.json({ error: "Missing Name" }, { status: 400 });
  }

  try {
    // .search() returns possible matches, bc game names arent always exact in hltb database
    const results = await hltbService.search(name);

    // take best match for now
    const best = results[0];

    if (!best) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      mainStory: best.gameplayMain,
      mainExtra: best.gameplayMainExtra,
      completionist: best.gameplayCompletionist,
    });
  } catch (err) {
    return NextResponse.json({ found: false });
  }
}
