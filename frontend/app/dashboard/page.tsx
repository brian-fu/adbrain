"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Video, Clock, Calendar } from "lucide-react";
import { AdGenerationModal } from "@/components/ad-generation-modal";

interface Video {
  id: number;
  title: string;
  created_at: string;
  status: string;
  playback_url: string;
}

export default function DashboardPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login?redirect=/dashboard");
        return;
      }

      setUserId(user.id);
      fetchVideos(user.id);
    };

    checkAuth();
  }, [supabase, router]);

  const fetchVideos = async (userId: string) => {
    try {
      setLoading(true);
      const serverUrl =
        process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:8000";

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("No session found");
      }

      console.log("Fetching videos for user:", userId);
      console.log("Using server URL:", serverUrl);

      const response = await fetch(
        `${serverUrl}/v1/users/${userId}/videos-with-urls`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(
          `Failed to fetch videos: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      console.log("Fetched videos:", data);
      setVideos(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching videos:", err);
      setError(err instanceof Error ? err.message : "Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleVideoClick = (videoId: number) => {
    router.push(`/preview?videoId=${videoId}`);
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background pt-16">
          <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-accent" />
              <p className="text-muted-foreground">Loading your videos...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-16">
        <div className="container mx-auto px-4 py-12">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">My Videos</h1>
              <p className="text-muted-foreground">
                Manage and view all your AI-generated ads
              </p>
            </div>
            <Button
              onClick={() => setModalOpen(true)}
              className="bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Ad
            </Button>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-8">
              <p className="text-red-500">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && videos.length === 0 && !error && (
            <div className="text-center py-16 space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-secondary/50 flex items-center justify-center">
                <Video className="w-12 h-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">No videos yet</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Create your first AI-generated ad to get started. It only
                  takes a few minutes!
                </p>
              </div>
              <Button
                onClick={() => setModalOpen(true)}
                className="bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Ad
              </Button>
            </div>
          )}

          {/* Videos Grid */}
          {videos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => handleVideoClick(video.id)}
                  className="group cursor-pointer"
                >
                  <div className="relative rounded-xl overflow-hidden bg-secondary border border-border hover:border-accent/50 transition-all duration-300 hover:shadow-xl hover:shadow-accent/20">
                    {/* Video Thumbnail */}
                    <div
                      className="relative w-full bg-black/50"
                      style={{ aspectRatio: "9/16" }}
                    >
                      <video
                        src={video.playback_url}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-gradient-start to-gradient-end flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-background ml-1"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Video Info */}
                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-accent transition-colors">
                        {video.title || "Untitled Video"}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(video.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                            video.status === "READY"
                              ? "bg-green-500/10 text-green-500"
                              : "bg-yellow-500/10 text-yellow-500"
                          }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              video.status === "READY"
                                ? "bg-green-500"
                                : "bg-yellow-500 animate-pulse"
                            }`}
                          />
                          {video.status === "READY" ? "Ready" : "Processing"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Ad Generation Modal */}
      <AdGenerationModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
