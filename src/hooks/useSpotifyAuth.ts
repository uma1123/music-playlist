import { useState, useEffect } from "react";

//spotify認証を管理するカスタムフック
const useSpotifyAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null); // アクセストークンを管理

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 認証状態を確認するためのAPIエンドポイントを呼び出す
        const res = await fetch("/api/auth/session", {
          credentials: "include", // クッキーを含める
        });
        if (res.ok) {
          const data = await res.json();
          setIsAuthenticated(data.authenticated === true);
          setAccessToken(data.accessToken || null); // アクセストークンを設定
        } else {
          setIsAuthenticated(false);
          setAccessToken(null);
        }
      } catch (err) {
        console.error("認証チェック失敗:", err);
        setIsAuthenticated(false);
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = () => {
    window.location.href = "/api/auth/login";
  };

  console.log("isAuthenticated:", isAuthenticated);
  console.log("accessToken:", accessToken);
  return { isAuthenticated, login, isLoading, accessToken }; // accessToken を返す
};

export default useSpotifyAuth;
