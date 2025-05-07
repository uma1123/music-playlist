import { useEffect, useState } from "react";

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: typeof Spotify;
  }
}

const useSpotifyPlayer = (accessToken: string) => {
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [deviceId, setDeviceId] = useState<string>("");

  useEffect(() => {
    if (!accessToken) return;

    const scriptTagId = "spotify-player";

    const loadScript = () => {
      const script = document.createElement("script");
      script.id = scriptTagId;
      script.type = "text/javascript";
      script.async = true;
      script.src = "https://sdk.scdn.co/spotify-player.js";
      document.body.appendChild(script);
    };

    if (!document.getElementById(scriptTagId)) {
      loadScript();
    }

    window.onSpotifyWebPlaybackSDKReady = () => {
      const _player = new window.Spotify.Player({
        name: "Web Playback SDK Player",
        getOAuthToken: (cb: (token: string) => void) => {
          cb(accessToken);
        },
        volume: 0.5,
      });

      _player.addListener("ready", ({ device_id }: { device_id: string }) => {
        console.log("Ready with Device ID", device_id);
        setDeviceId(device_id);
        setIsReady(true);
      });

      _player.addListener(
        "initialization_error",
        ({ message }: { message: string }) =>
          console.error("Initialization error:", message)
      );
      _player.addListener(
        "authentication_error",
        ({ message }: Spotify.Error) =>
          console.error("Authentication error:", message)
      );
      _player.addListener("account_error", ({ message }: Spotify.Error) =>
        console.error("Account error:", message)
      );
      _player.addListener("playback_error", ({ message }: Spotify.Error) =>
        console.error("Playback error:", message)
      );

      _player.connect();
      setPlayer(_player);
    };
  }, [accessToken]);

  return { player, isReady, deviceId };
};

export default useSpotifyPlayer;
