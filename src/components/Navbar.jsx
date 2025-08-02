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

  return (
    <nav className="bg-black border-b border-gray-800 px-4 py-3 flex justify-between items-center relative z-20">
      <h1 className="text-xl font-bold text-white">FitConnect</h1>

      {/* Desktop */}
      <div className="hidden md:flex space-x-6 items-center">
        {navLinks.map(({ path, label, onClick }) => {
          const isCurrent = isActive(path);
          const className = `text-sm ${
            isCurrent ? "font-bold text-white" : "text-gray-400"
          } hover:text-white`;

          return onClick ? (
            <button key={label} onClick={onClick} className={className}>
              {label}
            </button>
          ) : (
            <Link key={label} to={path} className={className}>
              {label}
            </Link>
          );
        })}
        <button onClick={handleLogout} className="text-red-500 hover:underline text-sm">
          Logout
        </button>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} color="white" /> : <Menu size={24} color="white" />}
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-black border-t border-gray-800 md:hidden z-10">
          <div className="flex flex-col p-4 space-y-3">
            {navLinks.map(({ path, label, onClick }) => {
              const isCurrent = isActive(path);
              const className = `text-sm ${
                isCurrent ? "font-bold text-white" : "text-gray-400"
              } hover:text-white text-left`;

              return onClick ? (
                <button
                  key={label}
                  onClick={() => {
                    setIsOpen(false);
                    onClick();
                  }}
                  className={className}
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
              className="text-red-500 hover:underline text-sm text-left"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
