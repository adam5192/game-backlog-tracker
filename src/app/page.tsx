"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Download, Sparkles, Clock3, SlidersHorizontal } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import { toast } from "sonner";

const BACKDROP_COVERS = [
  "https://images.igdb.com/igdb/image/upload/t_720p/co2lbd.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/coaarl.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co1rs4.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/cobt0i.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co2lb9.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/coay61.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co1q1f.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co1r7f.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/cobkt6.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co1nmw.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co2mli.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co1rcf.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co2lbb.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co3p2d.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/coc2ea.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co20ac.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co2n12.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co1voh.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co1r7h.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co1voj.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co1x7o.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co2lcv.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co2una.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co1u60.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co1rbu.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co4jni.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co1vpd.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co1tnb.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/cobfzp.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co3nnx.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co1r77.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/coa77e.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co721v.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co8lo8.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/cob9ed.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co1nc7.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/coabgu.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/cob1t2.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co1r8e.jpg",
  "https://images.igdb.com/igdb/image/upload/t_720p/co2lbv.jpg",
];

export default function Home() {
  const [authOpen, setAuthOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const router = useRouter();

  async function handleDemoLogin() {
    setDemoLoading(true);
    const res = await fetch("/api/auth/demo", { method: "POST" });
    setDemoLoading(false);

    if (!res.ok) {
      toast.error("Couldn't load the demo right now.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <section className="relative min-h-screen overflow-hidden flex flex-col">
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
      <div className="absolute inset-0 bg-background/80" />
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 py-16 lg:py-24">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-medium text-foreground mb-4 lg:mb-6 max-w-xl lg:max-w-2xl xl:max-w-3xl">
          Your game backlog, finally under control
        </h1>
        <p className="text-text-secondary max-w-md lg:max-w-lg xl:max-w-xl mb-8 lg:mb-10 text-sm lg:text-base xl:text-lg">
          Track what you own, rate what you&apos;ve played, and get AI-powered
          picks for what to play next, pulled straight from your personal
          library.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            className="text-sm lg:text-base px-6 lg:px-8 py-2.5 lg:py-3 rounded-full bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-50 active:scale-95"
            onClick={() => setAuthOpen(true)}
          >
            Get started
          </button>
          <button
            className="text-sm lg:text-base px-6 lg:px-8 py-2.5 lg:py-3 rounded-full border border-border-color text-foreground hover:bg-surface-1 transition-colors disabled:opacity-50 active:scale-95"
            onClick={handleDemoLogin}
            disabled={demoLoading}
          >
            {demoLoading ? "Loading demo..." : "Try the demo"}
          </button>
        </div>
      </div>

      <div className="relative z-10 max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto px-6 pb-12 lg:pb-16 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 lg:gap-6 xl:gap-8">
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

      <div className="relative z-10 text-center pb-4 lg:pb-6">
        <p className="text-xs lg:text-sm text-text-secondary">
          Built by Adam Mokdad ·{" "}
          <a
            href="https://github.com/adam5192/game-backlog-tracker"
            className="text-text-secondary underline"
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
    <div className="bg-surface-1/85 border border-border-color rounded-2xl p-5 lg:p-7">
      <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-surface-2 text-foreground flex items-center justify-center mb-3 lg:mb-4">
        {icon}
      </div>
      <h3 className="text-foreground font-medium mb-1.5 lg:text-lg">{title}</h3>
      <p className="text-sm lg:text-base text-text-secondary">{description}</p>
    </div>
  );
}
