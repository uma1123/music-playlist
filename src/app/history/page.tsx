"use client";
import { useRouter } from "next/navigation";
import HistoryList from "@/components/HistoryList";
import { useEffect, useState } from "react";

export default function HistoryPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserId = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          console.log("User ID fetched:", data.userId);
          setUserId(data.userId);
        } else {
          console.error("User ID not found or error fetching session");
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      } finally {
        setLoading(false);
      }
    };

    getUserId();
  }, []);

  const handleTrackSelect = (trackId: string) => {
    router.push(`/track/${trackId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">再生履歴</h1>
      {userId && (
        <HistoryList userId={userId} onTrackSelect={handleTrackSelect} />
      )}
    </div>
  );
}
