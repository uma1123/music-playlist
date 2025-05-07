import { useEffect, useState } from "react";

const useSpotifyPlayer = (accessToken: string | null) => {
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new Spotify.Player({
        name: "Web Playback SDK",
        getOAuthToken: (cb) => cb(accessToken),
        volume: 0.5,
      });

      setPlayer(spotifyPlayer);

      spotifyPlayer.addListener("ready", ({ device_id }) => {
        console.log("Ready with Device ID", device_id);
        setIsReady(true);
      });

      spotifyPlayer.addListener("not_ready", ({ device_id }) => {
        console.log("Device ID has gone offline", device_id);
        setIsReady(false);
      });

      spotifyPlayer.addListener("initialization_error", ({ message }) => {
        console.error("Initialization Error:", message);
      });

      spotifyPlayer.addListener("authentication_error", ({ message }) => {
        console.error("Authentication Error:", message);
      });

      spotifyPlayer.addListener("account_error", ({ message }) => {
        console.error("Account Error:", message);
      });

      spotifyPlayer.addListener("playback_error", ({ message }) => {
        console.error("Playback Error:", message);
      });

      spotifyPlayer.connect();
    };

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [accessToken]);

  return { player, isReady };
};

export default useSpotifyPlayer;
