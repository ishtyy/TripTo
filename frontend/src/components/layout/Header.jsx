import React from "react";
import SearchBar from "./SearchBar";
import UserMenu from "./UserMenu";

export default function Header(props) {
  return (
    <header className="bg-gray-900/50 border-b border-gray-800 px-6 py-2 grid grid-cols-3 items-center sticky top-0 z-50 backdrop-blur-sm">
      <div></div>
      <SearchBar {...props} />
      <UserMenu {...props} />
    </header>
  );
}
