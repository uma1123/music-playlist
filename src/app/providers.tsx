"use client";
import { ReactNode } from "react";
import useSpotifyAuth from "../hooks/useSpotifyAuth";
import { SpotifyPlayerProvider } from "../context/SpotifyPlayerProvider";

export default function Providers({ children }: { children: ReactNode }) {
  const { accessToken } = useSpotifyAuth();
  if (!accessToken) return <>{children}</>;
  return (
    <SpotifyPlayerProvider accessToken={accessToken}>
      {children}
    </SpotifyPlayerProvider>
  );
}
