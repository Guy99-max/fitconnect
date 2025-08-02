// src/pages/TraineeList.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function TraineeList({ activeOnly = false }) {
  const [trainees, setTrainees] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const q = query(
          collection(db, "users"),
          where("trainerId", "==", user.uid),
          where("role", "==", "trainee")
        );

        const snapshot = await getDocs(q);
        let list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (activeOnly) {
          list = list.filter((t) => t.isActive);
        }

        setTrainees(list);
      }
    });

    return () => unsubscribe();
  }, [activeOnly]);

  const toggleActiveStatus = async (traineeId, currentStatus) => {
    const traineeRef = doc(db, "users", traineeId);
    await updateDoc(traineeRef, { isActive: !currentStatus });

    setTrainees((prev) =>
      prev.map((t) =>
        t.id === traineeId ? { ...t, isActive: !currentStatus } : t
      )
    );
  };

  const filtered = trainees.filter((t) =>
    t.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="text-white">
      <h2 className="text-2xl font-semibold mb-6 text-center">Trainees</h2>

      <div className="mb-6 flex justify-between items-center">
        <input
          type="text"
          placeholder="Search trainees..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-80 px-4 py-2 rounded-lg bg-black text-white border border-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#9ae9ff]"
        />
        <button
          onClick={() => navigate("/add-trainee")}
          className="bg-gradient-to-r from-[#9ae9ff] to-[#88f3c6] text-black font-semibold px-5 py-2 rounded-xl hover:opacity-90 transition"
        >
          Add Trainee +
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-400 text-center">No trainees found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((trainee) => (
            <div
              key={trainee.id}
              className="bg-[#1a1a1a] border border-gray-700 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
            >
              <div className="mb-3 space-y-1">
                <div className="text-lg font-semibold">
                  {trainee.displayName || "Unnamed"}
                </div>
                <div className="text-sm text-gray-400">{trainee.email}</div>
                <div className="text-sm text-gray-300">
                  Goal: {trainee.goal || "Not specified"}
                </div>
              </div>

              <div className="flex justify-between items-center mt-auto pt-2">
                <button
                  onClick={() => navigate(`/client-profile/${trainee.id}`)}
                  className="bg-gradient-to-br from-[#9ae9ff] to-[#f3ddf3] text-black text-sm font-medium px-4 py-2 rounded-full hover:opacity-90 transition"
                >
                  View Profile
                </button>

                {!activeOnly && (
                  <div className="flex items-center space-x-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={trainee.isActive || false}
                        onChange={() =>
                          toggleActiveStatus(trainee.id, trainee.isActive)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:bg-green-500 transition duration-200"></div>
                      <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-full transition-transform duration-200"></div>
                    </label>
                    <span className="text-sm text-gray-400">
                      {trainee.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
