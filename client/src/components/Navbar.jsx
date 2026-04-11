// src/components/Navbar.jsx
import React from "react";
import { Menu } from "lucide-react";
import Logo from "./Logo.jsx";
import MyLogo from "../assets/logo.png"; 

export default function Navbar({ onOpenSidebar }) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left Side: Logo + Title */}
        <div className="flex items-center gap-3">
          <Logo src={MyLogo} size={40} alt="Mess Logo" />  
          <h1 className="text-lg font-semibold">IIITA Mess</h1>
        </div>

        {/* Right Side: Menu Button */}
        <button
          className="p-2 rounded-xl hover:bg-neutral-100 transition"
          aria-label="Open menu"
          onClick={onOpenSidebar}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
}

