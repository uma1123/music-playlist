import React, { createContext, useContext, useEffect, useState } from "react";

//spotifyプレイヤーの状態を管理する型
interface SpotifyPlayerContextProps {
  player: Spotify.Player | null;
  deviceId: string | null;
  isReady: boolean;
}

//デフォルト値でcontextを作成
const SpotifyPlayerContext = createContext<SpotifyPlayerContextProps>({
  player: null,
  deviceId: null,
  isReady: false,
});

//contextを使うためのカスタムフック
export const useSpotifyPlayerContext = () => useContext(SpotifyPlayerContext);

interface Props {
  accessToken: string;
  children: React.ReactNode;
}

//spotify web playback sdkのプロバイダー
export const SpotifyPlayerProvider: React.FC<Props> = ({
  accessToken,
  children,
}) => {
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    //sdkスクリプトがまだ読み込まれていなければ追加
    if (!document.getElementById("spotify-sdk")) {
      const script = document.createElement("script");
      script.id = "spotify-sdk";
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
    }

    if (!accessToken) return; //アクセストークンがなければ何もしない

    let interval: NodeJS.Timeout;

    //プレイヤーのセットアップ処理
    const setupPlayer = () => {
      if (!window.Spotify) return;

      //プレイヤーインスタンスを作成
      const _player = new window.Spotify.Player({
        name: "My Web Player",
        getOAuthToken: (cb) => cb(accessToken),
        volume: 0.5,
      });

      //プレイヤーがreadyになった時
      _player.addListener("ready", ({ device_id }) => {
        console.log("✅ Spotify Player Ready:", device_id);
        setDeviceId(device_id);
        setIsReady(true);
      });

      //プレイヤーがnot readyになった時
      _player.addListener("not_ready", ({ device_id }) => {
        console.warn("⚠️ Device not ready:", device_id);
        setIsReady(false);
      });

      //エラー
      _player.addListener("initialization_error", ({ message }) =>
        console.error("❌ Initialization Error:", message)
      );
      _player.addListener("authentication_error", ({ message }) =>
        console.error("❌ Authentication Error:", message)
      );
      _player.addListener("account_error", ({ message }) =>
        console.error("❌ Account Error:", message)
      );
      _player.addListener("playback_error", ({ message }) =>
        console.error("❌ Playback Error:", message)
      );

      //spotifyと接続できたとき
      _player.connect().then((success) => {
        if (success) {
          console.log("✅ Player connected successfully");
          setPlayer(_player);
        } else {
          console.error("❌ Player connection failed");
        }
      });
    };

    // ポーリングでwindow.Spotifyが使えるまで待つ
    if (!window.Spotify) {
      interval = setInterval(() => {
        if (window.Spotify) {
          clearInterval(interval);
          setupPlayer();
        }
      }, 300);
    } else {
      setupPlayer();
    }

    return () => {
      if (interval) clearInterval(interval);
      if (player) player.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  //子コンポーネントに値を提供
  return (
    <SpotifyPlayerContext.Provider value={{ player, deviceId, isReady }}>
      {children}
    </SpotifyPlayerContext.Provider>
  );
};
