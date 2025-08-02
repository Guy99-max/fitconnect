import React from "react";
import { useNavigate } from "react-router-dom";

export default function NoWorkout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="bg-[#111] border border-gray-800 rounded-2xl p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">No Active Workout</h1>
        <p className="text-gray-400 mb-6">Your trainer hasn't assigned a workout yet.</p>
        <button
          onClick={() => navigate("/home")}
          className="bg-gradient-to-r from-[#9ae9ff] to-[#88f3c6] text-black font-semibold px-6 py-3 rounded-xl hover:opacity-90"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
