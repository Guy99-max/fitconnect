// src/pages/ClientProfile.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";

export default function ClientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trainee, setTrainee] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const userRef = doc(db, "users", id);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) setTrainee(userSnap.data());

      const metricsRef = collection(db, "measurements", id, "data");
      const qMetrics = query(metricsRef, orderBy("timestamp", "desc"));
      const snapMetrics = await getDocs(qMetrics);
      setMetrics(snapMetrics.docs.map((doc) => doc.data()));

      const workoutsRef = collection(db, "workouts");
      const qWorkouts = query(workoutsRef, where("traineeId", "==", id));
      const snapWorkouts = await getDocs(qWorkouts);
      setWorkouts(snapWorkouts.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };

    fetchData();
  }, [id]);

  const toggleWorkoutStatus = async (workoutId, currentStatus) => {
    const ref = doc(db, "workouts", workoutId);
    await updateDoc(ref, { isActive: !currentStatus });
    setWorkouts((prev) =>
      prev.map((w) => (w.id === workoutId ? { ...w, isActive: !currentStatus } : w))
    );
  };

  if (!trainee) return <div className="p-6 text-white">Loading...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-6 text-center">Client Profile</h1>

      {/* Basic Info */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 text-center space-y-1 mb-6 text-sm border border-[#2a2a2a]">
        <div><span className="text-gray-400">Name:</span> <span className="font-semibold text-white">{trainee.displayName}</span></div>
        <div><span className="text-gray-400">Age:</span> <span className="font-semibold text-white">{trainee.age}</span></div>
        <div><span className="text-gray-400">Height:</span> <span className="font-semibold text-white">{trainee.height} cm</span></div>
      </div>

      {/* Measurements */}
      <h2 className="text-xl font-semibold mb-2 text-center">Measurements</h2>
      <table className="text-sm border border-[#2a2a2a] mb-8 mx-auto w-full rounded-xl overflow-hidden">
        <thead className="bg-[#1a1a1a] text-gray-400">
          <tr>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Weight</th>
            <th className="px-3 py-2">Body Fat (%)</th>
            <th className="px-3 py-2">Waist (cm)</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((m, idx) => (
            <tr key={idx} className="border-t border-[#2a2a2a] text-center">
              <td className="px-3 py-2">{new Date(m.timestamp.toDate?.() || m.timestamp).toLocaleDateString()}</td>
              <td className="px-3 py-2">{m.weight}</td>
              <td className="px-3 py-2">{m.bodyFat}</td>
              <td className="px-3 py-2">{m.waist}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Workouts */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold">Workout Programs</h2>
        <button
          onClick={() => navigate(`/create-workout/${id}`)}
          className="bg-gradient-to-r from-[#9effc4] to-[#d0fff3] text-black font-semibold px-4 py-2 rounded-xl hover:opacity-90 text-sm shadow"
        >
          + Create New Program
        </button>
      </div>

      <div className="overflow-auto rounded-xl border border-[#2a2a2a]">
        <table className="text-sm text-white w-full">
          <thead className="bg-[#1a1a1a] text-gray-400">
            <tr>
              <th className="px-3 py-2 text-left">Title</th>
              <th className="px-3 py-2 text-left">Goal</th>
              <th className="px-3 py-2 text-left">Start Date</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {workouts.map((w) => (
              <tr key={w.id} className="border-t border-[#2a2a2a]">
                <td className="px-3 py-2">{w.title}</td>
                <td className="px-3 py-2">{w.goal}</td>
                <td className="px-3 py-2">{w.startDate}</td>
                <td className="px-3 py-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={w.isActive || false}
                      onChange={() => toggleWorkoutStatus(w.id, w.isActive)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:bg-green-500 transition duration-200"></div>
                    <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-full transition-transform duration-200"></div>
                  </label>
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => navigate(`/edit-workout/${w.id}`)}
                    className="text-blue-400 underline hover:text-blue-300 text-sm"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
