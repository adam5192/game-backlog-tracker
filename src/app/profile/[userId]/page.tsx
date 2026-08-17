"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

type ProfileData = {
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  memberSince: string;
};

type ProfileList = {
  id: string;
  name: string;
  description: string | null;
  previewCovers: string[];
  gameCount: number;
};

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [lists, setLists] = useState<ProfileList[]>([]);
  const [loading, setLoading] = useState(true);

  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);

  async function load() {
    setLoading(true);
    setNotFound(false);
    setLoadError(false);
    try {
      const res = await fetch(`/api/profile/${userId}`);

      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to load profile");
      }

      const data = await res.json();
      setProfile(data.profile);
      setLists(data.lists ?? []);
    } catch (err) {
      console.error("Error loading public profile:", err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [userId]);

  if (loading) {
    return (
      <div className="px-4 py-8 sm:px-8 max-w-4xl mx-auto text-text-secondary text-sm">
        Loading...
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="px-4 py-8 sm:px-8 max-w-4xl mx-auto text-center py-16">
        <p className="text-text-secondary text-sm">
          This profile doesn&apos;t exist, or hasn&apos;t been set up yet.
        </p>
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="px-4 py-8 sm:px-8 max-w-4xl mx-auto text-center py-16">
        <p className="text-text-secondary text-sm mb-3">
          Couldn&apos;t load this profile right now.
        </p>
        <button
          onClick={load}
          className="text-sm px-4 py-2 rounded-full border border-border-color text-foreground hover:bg-surface-1 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  const memberSinceLabel = new Date(profile.memberSince).toLocaleDateString(
    undefined,
    {
      month: "long",
      year: "numeric",
    },
  );

  return (
    <div className="px-4 py-8 sm:px-8 max-w-4xl mx-auto">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Back
      </button>
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="w-16 h-16 rounded-full bg-surface-1 relative overflow-hidden shrink-0">
          {profile.avatarUrl && (
            <Image
              src={profile.avatarUrl}
              alt=""
              fill
              className="object-cover"
              sizes="64px"
            />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-medium text-foreground">
            {profile.displayName}
          </h1>
          <p className="text-xs text-text-secondary">
            Member since {memberSinceLabel}
          </p>
        </div>
      </div>

      {profile.bio && (
        <p className="text-sm text-text-secondary mb-8 max-w-lg">
          {profile.bio}
        </p>
      )}
      {!profile.bio && <div className="mb-8" />}

      {/* Their public lists */}
      <h2 className="text-lg font-medium text-foreground mb-4">Public lists</h2>

      {lists.length === 0 ? (
        <p className="text-text-secondary text-sm">
          {profile.displayName} hasn&apos;t made any public lists yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {lists.map((list) => (
            <Link
              key={list.id}
              href={`/lists/${list.id}`}
              className="bg-surface-1 border border-border-color rounded-2xl overflow-hidden hover:border-accent transition-colors"
            >
              {list.previewCovers.length > 0 && (
                <div className="grid grid-cols-4 gap-2 p-3 pb-0">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-3/4 relative bg-surface-2 rounded-lg overflow-hidden"
                    >
                      {list.previewCovers[i] && (
                        <Image
                          src={list.previewCovers[i]}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="100px"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="p-5">
                <h3 className="text-foreground font-medium mb-1">
                  {list.name}
                </h3>
                {list.description && (
                  <p className="text-sm text-text-secondary line-clamp-2 mb-1">
                    {list.description}
                  </p>
                )}
                <p className="text-xs text-text-secondary">
                  {list.gameCount} {list.gameCount === 1 ? "game" : "games"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
