// src/components/Navbar.jsx
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth } from "../firebase";
import { Menu, X } from "lucide-react";

export default function Navbar({ role }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isTrainer = role === "trainer";

  const handleLogout = async () => {
    await auth.signOut();
    localStorage.removeItem("role");
    navigate("/");
  };

  const handleLiveClick = () => {
    const id = localStorage.getItem("activeWorkoutId");
    if (id) {
      navigate(`/live-workout/${id}`);
    } else {
      navigate("/no-workout");
    }
  };

  const isActive = (path) => {
    if (path === "/live-workout") {
      return location.pathname.startsWith("/live-workout/");
    }
    return location.pathname === path;
  };

  const navLinks = isTrainer
    ? [
        { path: "/trainer", label: "Dashboard" },
        { path: "/trainees", label: "Trainees" },
        { path: "/trainer-profile", label: "Profile" },
      ]
    : [
        { path: "/live-workout", label: "Live Workout", onClick: handleLiveClick },
        { path: "/home", label: "Home" },
        { path: "/history", label: "History" },
        { path: "/profile", label: "Profile" },
      ];

  // בסיס אחיד לפריטי ניווט
  const desktopItemBase =
    "inline-flex items-center px-2 py-1 text-sm transition-colors";
  const mobileItemBase =
    "block w-full pl-4 py-2 text-left text-sm leading-6";

  return (
    <nav className="bg-black border-b border-gray-800 px-4 py-3 flex justify-between items-center relative z-20">
      <h1 className="text-xl font-bold text-white">FitConnect</h1>

      {/* Desktop */}
      <div className="hidden md:flex items-center space-x-6">
        {navLinks.map(({ path, label, onClick }) => {
          const active = isActive(path);
          const stateCls = active
            ? "font-semibold text-white"
            : "text-gray-400 hover:text-white";
          const className = `${desktopItemBase} ${stateCls}`;

          return onClick ? (
            <button
              key={label}
              onClick={onClick}
              className={`${className} appearance-none bg-transparent border-0`}
            >
              {label}
            </button>
          ) : (
            <Link key={label} to={path} className={className}>
              {label}
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className={`${desktopItemBase} text-red-500 hover:text-red-400`}
        >
          Logout
        </button>
      </div>

      {/* Mobile toggle */}
      <div className="md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center p-2"
        >
          {isOpen ? <X size={24} color="white" /> : <Menu size={24} color="white" />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-black border-t border-gray-800 md:hidden z-10">
          <div className="flex flex-col py-2">
            {navLinks.map(({ path, label, onClick }) => {
              const active = isActive(path);
              const stateCls = active
                ? "font-semibold text-white"
                : "text-gray-300 hover:text-white";
              const className = `${mobileItemBase} ${stateCls}`;

              return onClick ? (
                <button
                  key={label}
                  onClick={() => {
                    setIsOpen(false);
                    onClick();
                  }}
                  className={`${className} appearance-none bg-transparent border-0`}
                >
                  {label}
                </button>
              ) : (
                <Link
                  key={label}
                  to={path}
                  onClick={() => setIsOpen(false)}
                  className={className}
                >
                  {label}
                </Link>
              );
            })}
            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              className={`${mobileItemBase} text-red-500 hover:text-red-400`}
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
