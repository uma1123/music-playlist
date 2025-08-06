import { Heart, History, Search } from "lucide-react";
import Link from "next/link";

export const Header = () => {
  return (
    <div className="flex items-center gap-6">
      <nav className="flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white font-medium"
        >
          <Search className="w-5 h-5" />
          検索
        </Link>
        <Link
          href="/history"
          className="flex items-center gap-2 px-4 py-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <History className="h-4 w-4" />
          履歴
        </Link>
        <Link
          href="/favorites"
          className="flex items-center gap-2 px-4 py-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <Heart className="h-4 w-4" />
          お気に入り
        </Link>
      </nav>
    </div>
  );
};
