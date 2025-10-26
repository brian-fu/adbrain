"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function InstagramLogoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [username, setUsername] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    // Get the current logged-in username
    const storedUsername = localStorage.getItem("instagram_username");
    setUsername(storedUsername);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Clear fake "logged in" state
    localStorage.removeItem("instagram_logged_in");
    localStorage.removeItem("instagram_username");

    setLoggingOut(false);
    router.push(redirect);
  };

  const handleCancel = () => {
    router.push(redirect);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <svg
              className="w-10 h-10 text-accent"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
            <h1 className="text-3xl font-bold">Instagram</h1>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 space-y-6">
          <div className="text-center space-y-4">
            <div className="bg-secondary rounded-full w-24 h-24 mx-auto flex items-center justify-center">
              <svg
                className="w-12 h-12 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>

            {username && (
              <p className="text-foreground font-medium">@{username}</p>
            )}

            <p className="text-foreground text-lg font-semibold">
              Log out of your account?
            </p>

            <p className="text-muted-foreground text-sm">
              You can always log back in at any time
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleLogout}
              className="w-full bg-gradient-to-r from-gradient-start to-gradient-end"
              disabled={loggingOut}
            >
              {loggingOut ? "Logging out..." : "Log out"}
            </Button>

            <Button
              onClick={handleCancel}
              variant="outline"
              className="w-full"
              disabled={loggingOut}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
