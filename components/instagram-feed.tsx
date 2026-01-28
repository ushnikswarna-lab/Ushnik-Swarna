"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Instagram } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface InstagramPost {
  id: string;
  imageUrl: string;
  caption?: string;
  permalink: string;
  timestamp: string;
}

interface InstagramFeedProps {
  username?: string;
  count?: number;
  className?: string;
}

export function InstagramFeed({ username = "p2tecostay", count = 6, className }: InstagramFeedProps) {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, integrate with Instagram Basic Display API or a service like EmbedSocial
    // For now, using placeholder/dummy data
    setTimeout(() => {
      setPosts([
        { id: "1", imageUrl: "/placeholder.jpg", permalink: "#", timestamp: "2025-01-20" },
        { id: "2", imageUrl: "/placeholder.jpg", permalink: "#", timestamp: "2025-01-19" },
        { id: "3", imageUrl: "/placeholder.jpg", permalink: "#", timestamp: "2025-01-18" },
        { id: "4", imageUrl: "/placeholder.jpg", permalink: "#", timestamp: "2025-01-17" },
        { id: "5", imageUrl: "/placeholder.jpg", permalink: "#", timestamp: "2025-01-16" },
        { id: "6", imageUrl: "/placeholder.jpg", permalink: "#", timestamp: "2025-01-15" },
      ]);
      setLoading(false);
    }, 500);
  }, [username, count]);

  if (loading) {
    return (
      <div className={cn("grid grid-cols-3 gap-2", className)}>
        {[...Array(count)].map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <Instagram className="h-5 w-5 text-primary" />
        <h3 className="font-bold font-heading">Follow Us on Instagram</h3>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {posts.slice(0, count).map((post) => (
          <a
            key={post.id}
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-square overflow-hidden rounded-lg"
          >
            <Image
              src={post.imageUrl}
              alt={post.caption || "Instagram post"}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
          </a>
        ))}
      </div>
      <a
        href={`https://www.instagram.com/${username}/`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-primary hover:underline text-center block"
      >
        @{username}
      </a>
    </div>
  );
}
