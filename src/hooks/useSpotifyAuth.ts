import { useState, useEffect } from "react";

//spotify認証を管理するカスタムフック
const useSpotifyAuth = () => {
  // 認証状態を管理するためのステート
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(true);

  //コンポーネントのマウント時に認証状態を確認
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 認証状態を確認するためのAPIエンドポイントを呼び出す
        const res = await fetch("/api/auth/session", {
          credentials: "include", // // クッキーを含める
        });
        if (res.ok) {
          // レスポンスが成功した場合、認証状態を更新
          const data = await res.json();
          setIsAuthenticated(data.authenticated === true);
        } else {
          // レスポンスが失敗した場合、認証状態を更新
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error("認証チェック失敗:", err);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    // 認証状態を確認する関数を呼び出す
    checkAuth();
  }, []);

  // ログイン関数
  const login = () => {
    // Spotifyの認証ページにリダイレクト
    window.location.href = "/api/auth/login";
  };
  // 認証状態、ログイン関数、ローディング状態を返す
  return { isAuthenticated, login, isLoading };
};

export default useSpotifyAuth;
