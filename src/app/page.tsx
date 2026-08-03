"use client";

import { useState } from "react";
import Image from "next/image";
import { Download, Sparkles, Clock3, SlidersHorizontal } from "lucide-react";
import AuthModal from "@/components/AuthModal";

const BACKDROP_COVERS = [
  "https://images.igdb.com/igdb/image/upload/t_720p/co1nmw.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co4i78.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co6rzl.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co1y2f.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co1rs4.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co3aet.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co2mlj.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co2n12.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co1u60.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co958d.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co1qrs.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co9ba3.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/coaamg.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co3hfx.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/coabgu.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co62ao.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/coacrk.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co1v85.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/coaarl.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co2i0n.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/coaes9.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/cob9ed.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co4aqi.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co1rqa.jpg",
];

export default function Home() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <section className="relative h-screen overflow-hidden flex flex-col">
      <div className="absolute inset-0 flex flex-wrap opacity-30">
        {Array.from({ length: 110 }).map((_, i) => (
          <div
            key={i}
            style={{ width: "9.09%", aspectRatio: "3/4" }}
            className="relative"
          >
            <Image
              src={BACKDROP_COVERS[i % BACKDROP_COVERS.length]}
              alt=""
              fill
              className="object-cover"
              sizes="140px"
            />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gray-950/80" />
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-3xl font-medium text-gray-100 mb-3 max-w-xl">
          Your game backlog, finally under control
        </h1>
        <p className="text-gray-400 max-w-md mb-6 text-sm">
          Track what you own, rate what you've played, and get AI-powered picks
          for what to play next — pulled straight from your Steam library.
        </p>
        <button
          className="text-sm px-6 py-2 rounded-full bg-gray-100 text-gray-900"
          onClick={() => setAuthOpen(true)}
        >
          Get started
        </button>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 pb-8 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <FeatureCard
            icon={<Download size={22} />}
            title="Steam import"
            description="Pull in your whole library automatically, with a review screen so you stay in control of what gets added."
          />
          <FeatureCard
            icon={<Sparkles size={22} />}
            title="AI recommendations"
            description="Get a personalized pick for what to play next, based on what you've actually rated and enjoyed."
          />
          <FeatureCard
            icon={<Clock3 size={22} />}
            title="Completion data"
            description="See how long each game takes to beat, and compare your rating against the wider consensus."
          />
          <FeatureCard
            icon={<SlidersHorizontal size={22} />}
            title="Search & filter"
            description="Find anything in your library instantly by genre, rating, or status."
          />
        </div>
      </div>

      <div className="relative z-10 text-center pb-3">
        <p className="text-xs text-gray-500">
          Built by [your name] ·{" "}
          <a
            href="https://github.com/yourusername/game-backlog-tracker"
            className="text-gray-300 underline"
          >
            View on GitHub
          </a>
        </p>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-gray-900/85 border border-gray-800 rounded-2xl p-5">
      <div className="w-10 h-10 rounded-full bg-gray-800 text-gray-100 flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="text-gray-100 font-medium mb-1.5">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );
}
