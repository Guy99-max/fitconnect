// src/pages/TraineeViewWorkout.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function TraineeViewWorkout() {
  const { id } = useParams();
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkout = async () => {
      const docRef = doc(db, "workouts", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setWorkout(docSnap.data());
      }
      setLoading(false);
    };

    fetchWorkout();
  }, [id]);

  if (loading) return <div className="p-6 text-gray-600">Loading...</div>;
  if (!workout) return <div className="p-6 text-red-500">Workout not found.</div>;

  return (
    <div className="min-h-screen bg-[#121212] p-6">
      <div className="max-w-5xl mx-auto space-y-6 text-black">
        <div className="bg-[#1a1a1a] text-white p-6 rounded-2xl shadow">
          <h1 className="text-2xl font-bold mb-1">{workout.title}</h1>
          <p className="text-gray-400">{workout.goal}</p>
        </div>

        <div className="bg-[#1a1a1a] text-white p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-4 border-b border-[#333] pb-2">Exercises</h2>
          <div className="overflow-auto rounded-xl border border-[#333]">
            <table className="w-full text-sm text-white text-center">
              <thead>
                <tr className="bg-[#222] text-gray-400">
                  <th className="p-2">Exercise</th>
                  <th className="p-2">Sets</th>
                  <th className="p-2">Reps</th>
                  <th className="p-2">Load (kg)</th>
                  <th className="p-2">Rest (min)</th>
                  <th className="p-2">Video</th>
                  <th className="p-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {workout.exercises?.map((ex, idx) => (
                  <tr key={idx} className="border-t border-[#222]">
                    <td className="p-2">{ex.name}</td>
                    <td className="p-2">{ex.sets}</td>
                    <td className="p-2">{ex.reps}</td>
                    <td className="p-2">{ex.load}</td>
                    <td className="p-2">{ex.rest}</td>
                    <td className="p-2">
                      {ex.video ? (
                        <a
                          href={ex.video}
                          className="text-blue-400 hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Link
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-2">{ex.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
