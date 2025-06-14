import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Music2, Search } from "lucide-react";

const SearchBar: React.FC = () => {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    router.push(`/search/${encodeURIComponent(query)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg w-full mx-auto ">
      <div className="relative flex items-center">
        <div className="absolute left-4 z-10">
          <Music2 className="h-6 w-6 text-gray-500" />
        </div>
        <Input
          type="text"
          placeholder="再生したい曲やアーティストを検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-14 pr-24 py-5 text-xl bg-white/90 rounded-full backdrop-blur-sm border-0 shadow-lg forcus:bg-white transition-all"
        />
        <Button
          type="submit"
          size="sm"
          className="absolute right-3 rouded-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 text-xl"
        >
          <Search className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
};

export default SearchBar;
