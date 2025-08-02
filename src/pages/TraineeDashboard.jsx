// src/pages/TraineeDashboard.jsx
import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function TraineeDashboard() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkouts = async () => {
      const current = auth.currentUser;
      if (!current) return;

      const wq = query(collection(db, "workouts"), where("traineeId", "==", current.uid));
      const wsnap = await getDocs(wq);
      const data = wsnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setWorkouts(data);

      const active = data.find(w => w.isActive);
      if (active) {
        localStorage.setItem("activeWorkoutId", active.id);
      } else {
        localStorage.removeItem("activeWorkoutId");
      }

      setLoading(false);
    };

    fetchWorkouts();
  }, []);

  if (loading) return <div className="p-6 text-white">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 text-white">
      <div className="bg-[#1a1a1a] p-6 rounded-2xl shadow">
        <h1 className="text-2xl font-bold mb-1">My Programs</h1>
        <p className="text-gray-400 text-sm">
          Below are all your assigned programs — both active and inactive.
        </p>
      </div>

      {workouts.length === 0 ? (
        <div className="bg-[#1a1a1a] p-6 rounded-2xl shadow text-center text-gray-400">
          No programs assigned yet.
        </div>
      ) : (
        <div className="space-y-4">
          {workouts.map((w) => (
            <div
              key={w.id}
              className="bg-[#222] border border-[#333] p-5 rounded-2xl shadow-md flex justify-between items-center hover:scale-[1.01] transition"
            >
              <div>
                <div className="text-lg font-semibold">{w.title}</div>
                <div className="text-sm text-gray-400">
                  {w.goal || "No goal set"} • {w.startDate}
                </div>
                {w.isActive ? (
                  <span className="text-green-400 text-sm font-medium">Active Program</span>
                ) : (
                  <span className="text-red-500 text-sm font-medium">Inactive</span>
                )}
              </div>

              <button
                onClick={() => navigate(`/view-workout/${w.id}`)}
                className="bg-gradient-to-r from-[#9ae9ff] to-[#f3ddf3] text-black text-sm font-medium px-4 py-2 rounded-xl transition"
              >
                View
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
