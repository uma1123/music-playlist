"use client";

import SearchBar from "../components/SearchBar";

export default function Home() {
  return (
    <div className="min-h-screen flex items-start justify-center bg-gray-100">
      <div className="w-full max-w-lg">
        <h1 className="text-3xl font-bold text-center mb-8 mt-10">
          Music PlayList
        </h1>
        <SearchBar />
      </div>
    </div>
  );
}
