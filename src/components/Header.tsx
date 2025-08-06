import { Heart, History, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const Header = () => {
  const pathname = usePathname();

  const getActiveStyle = (path: string) => {
    // 検索ページの場合は、ルートパス（/）または検索結果ページ（/search/...）の両方でアクティブにする
    const isSearchActive =
      path === "/" && (pathname === "/" || pathname.startsWith("/search"));
    const isHistoryActive = path === "/history" && pathname === "/history";
    const isFavoritesActive =
      path === "/favorites" && pathname === "/favorites";

    const isActive = isSearchActive || isHistoryActive || isFavoritesActive;

    return isActive
      ? "flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white font-medium"
      : "flex items-center gap-2 px-4 py-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-700 transition-colors";
  };

  return (
    <div className="flex items-center gap-6">
      <nav className="flex items-center gap-4">
        <Link href="/" className={getActiveStyle("/")}>
          <Search className="w-5 h-5" />
          検索
        </Link>
        <Link href="/history" className={getActiveStyle("/history")}>
          <History className="h-4 w-4" />
          履歴
        </Link>
        <Link href="/favorites" className={getActiveStyle("/favorites")}>
          <Heart className="h-4 w-4" />
          お気に入り
        </Link>
      </nav>
    </div>
  );
};
