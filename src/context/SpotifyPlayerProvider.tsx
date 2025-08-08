import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Track,
  SpotifyPlayerContextProps,
  SpotifyPlayerProviderProps,
} from "@/types/spotify";

const SpotifyPlayerContext = createContext<SpotifyPlayerContextProps>({
  player: null,
  deviceId: null,
  isReady: false,
  currentTrackList: [],
  currentTrackIndex: 0,
  setCurrentTrackList: () => {},
  setCurrentTrackIndex: () => {},
  isPlayerVisible: false,
  setIsPlayerVisible: () => {},
  lastSearchQuery: null,
  setLastSearchQuery: () => {},
});

export const useSpotifyPlayerContext = () => useContext(SpotifyPlayerContext);

export const SpotifyPlayerProvider: React.FC<SpotifyPlayerProviderProps> = ({
  accessToken,
  children,
}) => {
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentTrackList, setCurrentTrackList] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState<string | null>(null);

  // プレイヤーの状態を全体で共有
  useEffect(() => {
    if (!player) return;

    const handleStateChange = (state: Spotify.PlaybackState | null) => {
      if (state) {
        // 現在再生中のトラックのURIベースでインデックスを同期
        const currentUri = state.track_window?.current_track?.uri;
        if (currentUri && currentTrackList.length > 0) {
          const newIndex = currentTrackList.findIndex(
            (t) => t.uri === currentUri
          );
          if (newIndex !== -1 && newIndex !== currentTrackIndex) {
            setCurrentTrackIndex(newIndex);
            sessionStorage.setItem("lastTrackIndex", newIndex.toString());
          }
        }
      }
    };

    player.addListener("player_state_changed", handleStateChange);

    return () => {
      player.removeListener("player_state_changed", handleStateChange);
    };
  }, [player, currentTrackList, currentTrackIndex]);

  useEffect(() => {
    if (!accessToken) return;

    // 既存のSDKスクリプトをクリーンアップ
    const existingScript = document.getElementById("spotify-sdk");
    if (existingScript) {
      existingScript.remove();
    }

    // 新しいSDKスクリプトを追加
    const script = document.createElement("script");
    script.id = "spotify-sdk";
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    let interval: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;
    let currentPlayer: Spotify.Player | null = null;

    const setupPlayer = () => {
      if (!window.Spotify) {
        console.warn("Spotify SDK not loaded yet");
        return;
      }

      // 既存のプレイヤーがあれば切断
      if (currentPlayer) {
        try {
          currentPlayer.disconnect();
        } catch (error) {
          console.warn("Error disconnecting previous player:", error);
        }
      }

      const _player = new window.Spotify.Player({
        name: "My Web Music Player",
        getOAuthToken: (cb) => {
          console.log("Getting OAuth token...");
          cb(accessToken);
        },
        volume: 0.5,
      });

      currentPlayer = _player;

      _player.addListener("ready", ({ device_id }) => {
        console.log("✅ Spotify Player Ready:", device_id);
        setDeviceId(device_id);
        setIsReady(true);
      });

      _player.addListener("not_ready", ({ device_id }) => {
        console.warn("⚠️ Device not ready:", device_id);
        setIsReady(false);
      });

      _player.addListener("initialization_error", ({ message }) => {
        console.error("❌ Initialization Error:", message);
        setIsReady(false);
      });

      _player.addListener("authentication_error", ({ message }) => {
        console.error("❌ Authentication Error:", message);
        setIsReady(false);
        // 認証エラーの場合、ページをリロードして再認証を促す
        setTimeout(() => {
          window.location.href = "/api/auth/login";
        }, 2000);
      });

      _player.addListener("account_error", ({ message }) => {
        console.error("❌ Account Error:", message);
        setIsReady(false);
      });

      _player.addListener("playback_error", ({ message }) => {
        console.error("❌ Playback Error:", message);
      });

      _player.connect().then((success) => {
        if (success) {
          console.log("✅ Player connected successfully");
          setPlayer(_player);
        } else {
          console.error("❌ Player connection failed");
          setIsReady(false);
        }
      });
    };

    // Spotify SDKの読み込み待機
    if (!window.Spotify) {
      timeoutId = setTimeout(() => {
        interval = setInterval(() => {
          if (window.Spotify) {
            clearInterval(interval);
            setupPlayer();
          }
        }, 500);
      }, 1000); // 1秒待ってから開始
    } else {
      setupPlayer();
    }

    // クリーンアップ処理を改善
    return () => {
      if (interval) clearInterval(interval);
      if (timeoutId) clearTimeout(timeoutId);

      if (currentPlayer) {
        try {
          // リスナーを個別に削除
          currentPlayer.removeListener("ready");
          currentPlayer.removeListener("not_ready");
          currentPlayer.removeListener("initialization_error");
          currentPlayer.removeListener("authentication_error");
          currentPlayer.removeListener("account_error");
          currentPlayer.removeListener("playback_error");
          currentPlayer.removeListener("player_state_changed");

          // 非同期でdisconnect（エラーハンドリング付き）
          (currentPlayer.disconnect as () => Promise<void>)().catch(
            (error: unknown) => {
              console.warn("Error during player disconnect:", error);
            }
          );
        } catch (error) {
          console.warn("Error cleaning up player:", error);
        }
      }
    };
  }, [accessToken]);

  return (
    <SpotifyPlayerContext.Provider
      value={{
        player,
        deviceId,
        isReady,
        currentTrackList,
        currentTrackIndex,
        setCurrentTrackList,
        setCurrentTrackIndex,
        isPlayerVisible,
        setIsPlayerVisible,
        lastSearchQuery,
        setLastSearchQuery,
      }}
    >
      {children}
    </SpotifyPlayerContext.Provider>
  );
};
