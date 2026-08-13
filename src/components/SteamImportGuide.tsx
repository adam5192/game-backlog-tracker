"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink, Copy, Eye, Download } from "lucide-react";
import { toast } from "sonner";

export default function SteamImportGuide() {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-surface-1 border border-border-color rounded-2xl mb-6 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="text-sm font-medium text-foreground">
          How do I find my Steam profile URL?
        </span>
        <ChevronDown
          size={18}
          className={`text-text-secondary transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-5">
          <GuideStep
            icon={<ExternalLink size={18} />}
            title="1. Open your Steam profile"
            description={
              <>
                Log into Steam (either the desktop app or steamcommunity.com),
                click your username in the top right, and select{" "}
                <strong>View profile</strong>.
              </>
            }
          />

          <GuideStep
            icon={<Copy size={18} />}
            title="2. Copy the URL from your browser"
            description={
              <>
                Your profile page URL will look like one of these:
                <code className="block bg-surface-2 rounded-lg px-3 py-2 mt-2 text-xs text-foreground">
                  steamcommunity.com/id/yourcustomname
                </code>
                <span className="block text-xs text-text-secondary mt-1">
                  or
                </span>
                <code className="block bg-surface-2 rounded-lg px-3 py-2 mt-2 text-xs text-foreground">
                  steamcommunity.com/profiles/76561198012345678
                </code>
                Either format works, just paste the whole thing into the box
                below.
              </>
            }
          />

          <GuideStep
            icon={<Eye size={18} />}
            title="3. Make sure your game details are public"
            description={
              <>
                This is the step people usually miss. Go to{" "}
                <strong>Edit Profile → Privacy Settings</strong>, and set{" "}
                <strong>&ldquo;Game details&rdquo;</strong> to{" "}
                <strong>Public</strong>. This is a separate setting from your
                overall profile privacy, so it&apos;s easy to have a public
                profile but still have your game list hidden.
              </>
            }
          />

          <GuideStep
            icon={<Download size={18} />}
            title="4. Import, then switch it back if you'd like"
            description={
              <>
                Once you&apos;ve pasted your profile URL below and imported, you
                can set your game details back to private again. We only read
                your library once, at the moment you import.
              </>
            }
          />

          <button
            onClick={() => {
              navigator.clipboard.writeText(
                "https://steamcommunity.com/my/edit/settings",
              );
              toast.success(
                "Link copied. Paste it in your browser while logged into Steam",
              );
            }}
            className="text-xs text-accent hover:opacity-80 transition-opacity underline"
          >
            Copy a direct link to your Steam privacy settings
          </button>
        </div>
      )}
    </div>
  );
}

function GuideStep({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-surface-2 text-foreground flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground mb-1">{title}</p>
        <p className="text-sm text-text-secondary leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
