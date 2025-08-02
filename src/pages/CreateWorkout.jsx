// src/pages/CreateWorkout.jsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, addDoc, Timestamp, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

export default function CreateWorkout() {
  const { id } = useParams(); // traineeId
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [docId, setDocId] = useState(null);
  const [exercises, setExercises] = useState([
    { name: "", sets: "", reps: "", load: "", rest: "", video: "", notes: "" },
  ]);

  const handleExerciseChange = (index, field, value) => {
    const updated = [...exercises];
    updated[index][field] = value;
    setExercises(updated);
  };

  const addExercise = () => {
    setExercises([
      ...exercises,
      { name: "", sets: "", reps: "", load: "", rest: "", video: "", notes: "" },
    ]);
  };

  const removeExercise = (index) => {
    setExercises(exercises.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    const docRef = await addDoc(collection(db, "workouts"), {
      traineeId: id,
      title: title.trim() || "Untitled",
      goal,
      startDate: Timestamp.now().toDate().toISOString().split("T")[0],
      exercises,
    });
    setDocId(docRef.id);
    navigate(-1);
  };

  const handleDelete = async () => {
    if (!docId) return alert("No document ID found.");
    await deleteDoc(doc(db, "workouts", docId));
    alert("Workout deleted.");
    navigate(-1);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-4 text-center">Create Workout Program</h1>

      <div className="flex flex-col gap-4 mb-6">
        <input
          type="text"
          placeholder="Program Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-[#111] border border-gray-700 rounded-xl px-4 py-2 w-full"
        />
        <input
          type="text"
          placeholder="Goal (optional)"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          className="bg-[#111] border border-gray-700 rounded-xl px-4 py-2 w-full"
        />
      </div>

      <h2 className="text-xl font-semibold mb-2">Exercises</h2>

      <div className="overflow-x-auto rounded-xl border border-[#333]">
        <table className="text-sm w-full text-white text-center">
          <thead className="bg-[#1a1a1a] text-gray-400">
            <tr>
              <th className="px-2 py-2 whitespace-nowrap">Exercise</th>
              <th className="px-2 py-2 whitespace-nowrap">Sets</th>
              <th className="px-2 py-2 whitespace-nowrap">Reps</th>
              <th className="px-2 py-2 whitespace-nowrap">Load</th>
              <th className="px-2 py-2 whitespace-nowrap">Rest</th>
              <th className="px-2 py-2 whitespace-nowrap">Video URL</th>
              <th className="px-2 py-2 whitespace-nowrap">Notes</th>
              <th className="px-2 py-2 whitespace-nowrap"></th>
            </tr>
          </thead>
          <tbody>
            {exercises.map((ex, idx) => (
              <tr key={idx} className="border-t border-[#222]">
                {["name", "sets", "reps", "load", "rest", "video", "notes"].map((field) => (
                  <td key={field} className="px-2 py-1">
                    <input
                      type={field === "video" || field === "notes" || field === "name" ? "text" : "number"}
                      step={field === "rest" ? "0.1" : "1"}
                      value={ex[field]}
                      onChange={(e) => handleExerciseChange(idx, field, e.target.value)}
                      className="bg-[#111] border border-gray-700 rounded px-2 py-1 w-full text-center"
                    />
                  </td>
                ))}
                <td className="px-2 py-1">
                  <button
                    onClick={() => removeExercise(idx)}
                    className="text-red-500 hover:underline text-sm"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={addExercise}
        className="mt-4 bg-[#333] hover:bg-[#444] text-white px-4 py-2 rounded-xl"
      >
        + Add Exercise
      </button>

      <div className="flex flex-wrap gap-4 mt-6">
        <button
          onClick={handleSubmit}
          className="bg-gradient-to-r from-[#8df0c3] to-[#9ae9ff] text-black font-semibold px-6 py-2 rounded-2xl hover:opacity-90 shadow-md"
        >
          Save Program
        </button>
        <button
          onClick={handleDelete}
          className="bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold px-6 py-2 rounded-2xl shadow-md hover:opacity-90"
        >
          Delete Program
        </button>
      </div>
    </div>
  );
}
