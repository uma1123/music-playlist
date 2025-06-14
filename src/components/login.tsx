import useSpotifyAuth from "@/hooks/useSpotifyAuth";
import { ImSpotify } from "react-icons/im";
import { Button } from "./ui/button";

const Login = () => {
  const { login } = useSpotifyAuth();

  // ログイン画面を表示
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 mb-6">
              <ImSpotify className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Music Playlist
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Spotifyアカウントでログインしてください
            </p>
          </div>
          <Button
            onClick={login}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white"
          >
            ログイン
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
