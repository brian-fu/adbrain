"use client";

import { Button } from "@/components/ui/button";
import {
  Download,
  Share2,
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Loader2,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function PreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoId = searchParams.get("videoId");

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<any>(null);

  useEffect(() => {
    const fetchVideo = async () => {
      if (!videoId) {
        setError("No video ID provided");
        setLoading(false);
        return;
      }

      try {
        // Always fetch fresh URL from backend (presigned URLs expire after 1 hour)
        const serverUrl =
          process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:8000";
        console.log("Fetching fresh video URL:", videoId, "from:", serverUrl);

        const response = await fetch(`${serverUrl}/v1/videos/${videoId}`);
        console.log("Response status:", response.status);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Video not found");
          }
          const errorText = await response.text();
          console.error("Error response:", errorText);
          throw new Error(`Failed to fetch video: ${response.status}`);
        }

        const data = await response.json();
        console.log("Video data received:", data);

        if (data.playback_url) {
          console.log("Setting video URL:", data.playback_url);
          setVideoUrl(data.playback_url);
          setVideoData(data);
        } else {
          throw new Error("Video URL not available");
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching video:", err);
        setError(err instanceof Error ? err.message : "Failed to load video");
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleDownload = async () => {
    if (!videoUrl) return;

    try {
      // Show loading state
      const filename = videoData?.title
        ? `${videoData.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.mp4`
        : `ai-generated-ad-${videoId}.mp4`;

      // Fetch the video as a blob
      const response = await fetch(videoUrl);
      if (!response.ok) throw new Error("Failed to fetch video");

      const blob = await response.blob();

      // Create a temporary URL for the blob
      const blobUrl = window.URL.createObjectURL(blob);

      // Create and click download link
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download video. Please try again.");
    }
  };

  const handleInstagramUpload = () => {
    // In a real app, this would integrate with Instagram's API
    alert(
      "Instagram upload feature would integrate with Instagram's API in production"
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-accent" />
          <p className="text-muted-foreground">
            Loading your generated video...
          </p>
        </div>
      </main>
    );
  }

  if (error || !videoUrl) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-500">{error || "Video not found"}</p>
          <Link href="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {"Back to Home"}
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">{"Your AI Generated Ad"}</h1>
          <div className="w-32" />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Video Preview */}
          <div className="space-y-6">
            <div className="relative group">
              {/* 9:16 aspect ratio video container */}
              <div
                className="relative mx-auto rounded-2xl overflow-hidden bg-card border border-border shadow-2xl"
                style={{ maxWidth: "400px", aspectRatio: "9/16" }}
              >
                <video
                  ref={videoRef}
                  src={videoUrl || ""}
                  className="w-full h-full object-cover bg-black"
                  loop
                  playsInline
                  controls
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onLoadedMetadata={(e) => {
                    const target = e.target as HTMLVideoElement;
                    setVideoDuration(Math.round(target.duration));
                    console.log(
                      "Video loaded successfully! Duration:",
                      target.duration
                    );
                  }}
                  onCanPlay={() => {
                    console.log("Video can play!");
                  }}
                  onError={(e) => {
                    console.error("Video failed to load");
                    console.error("URL:", videoUrl);
                  }}
                />

                {/* Video controls overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
                    {/* Play/Pause button */}
                    <div className="flex items-center justify-center">
                      <button
                        onClick={togglePlay}
                        className="w-16 h-16 rounded-full bg-gradient-to-r from-gradient-start to-gradient-end flex items-center justify-center hover:scale-110 transition-transform"
                      >
                        {isPlaying ? (
                          <Pause className="w-8 h-8 text-background fill-background" />
                        ) : (
                          <Play className="w-8 h-8 text-background fill-background ml-1" />
                        )}
                      </button>
                    </div>

                    {/* Volume control */}
                    <div className="flex items-center justify-end">
                      <button
                        onClick={toggleMute}
                        className="w-10 h-10 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center hover:bg-background/70 transition-colors"
                      >
                        {isMuted ? (
                          <VolumeX className="w-5 h-5 text-foreground" />
                        ) : (
                          <Volume2 className="w-5 h-5 text-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Play button when paused */}
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-sm">
                    <button
                      onClick={togglePlay}
                      className="w-20 h-20 rounded-full bg-gradient-to-r from-gradient-start to-gradient-end flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      <Play className="w-10 h-10 text-background fill-background ml-1" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile action buttons */}
            <div className="lg:hidden space-y-3">
              <Button
                onClick={handleDownload}
                size="lg"
                className="w-full bg-transparent"
                variant="outline"
              >
                <Download className="w-5 h-5 mr-2" />
                {"Download Video"}
              </Button>
              <Button
                onClick={handleInstagramUpload}
                size="lg"
                className="w-full bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90"
              >
                <Share2 className="w-5 h-5 mr-2" />
                {"Upload to Instagram"}
              </Button>
            </div>
          </div>

          {/* Ad Details & Actions */}
          <div className="space-y-8">
            {/* Ad Info */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm">{"Ready to publish"}</span>
              </div>

              <h2 className="text-4xl font-bold">
                {videoData?.title || "Your AI Generated Ad"}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {
                  "Your AI-generated ad is ready! This vertical video is optimized for Instagram Reels, TikTok, and other social media platforms."
                }
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 p-6 rounded-xl bg-secondary/30 border border-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">{"9:16"}</div>
                <div className="text-sm text-muted-foreground">
                  {"Aspect Ratio"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">
                  {videoDuration !== null ? `${videoDuration}s` : "—"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {"Duration"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">{"1080p"}</div>
                <div className="text-sm text-muted-foreground">{"Quality"}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="hidden lg:block space-y-3">
              <Button
                onClick={handleDownload}
                size="lg"
                className="w-full bg-transparent"
                variant="outline"
              >
                <Download className="w-5 h-5 mr-2" />
                {"Download Video"}
              </Button>
              <Button
                onClick={handleInstagramUpload}
                size="lg"
                className="w-full bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90"
              >
                <Share2 className="w-5 h-5 mr-2" />
                {"Upload to Instagram"}
              </Button>
            </div>

            {/* Additional sharing options */}
            <div className="space-y-3">
              <button
                onClick={() => setShowShareOptions(!showShareOptions)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {"More sharing options"}
              </button>

              {showShareOptions && (
                <div className="grid grid-cols-2 gap-3 animate-fade-in-up">
                  <Button variant="outline" size="sm">
                    {"TikTok"}
                  </Button>
                  <Button variant="outline" size="sm">
                    {"YouTube Shorts"}
                  </Button>
                  <Button variant="outline" size="sm">
                    {"Facebook"}
                  </Button>
                  <Button variant="outline" size="sm">
                    {"Twitter"}
                  </Button>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-gradient-start/10 to-gradient-end/10 border border-accent/20 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="text-accent">{"💡"}</span>
                {"Pro Tips"}
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  {"• Post during peak hours (6-9 PM) for maximum engagement"}
                </li>
                <li>{"• Use relevant hashtags to increase discoverability"}</li>
                <li>{"• Add captions for accessibility and silent viewing"}</li>
                <li>{"• Test different versions to see what resonates"}</li>
              </ul>
            </div>

            {/* Create another ad */}
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => router.push("/")}
            >
              {"Create Another Ad"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
