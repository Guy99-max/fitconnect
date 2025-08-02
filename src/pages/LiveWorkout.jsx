// src/pages/LiveWorkout.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { Play } from "lucide-react";

export default function LiveWorkout() {
  const navigate = useNavigate();
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [originalExercises, setOriginalExercises] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [resting, setResting] = useState(false);
  const [timer, setTimer] = useState(60);
  const [performance, setPerformance] = useState({});
  const [completedExercises, setCompletedExercises] = useState([]);
  const [showSummary, setShowSummary] = useState(false);

  const user = auth.currentUser;

  useEffect(() => {
    if (!selectedWorkoutId) return;

    const fetchWorkout = async () => {
      const workoutRef = doc(db, "workouts", selectedWorkoutId);
      const workoutSnap = await getDoc(workoutRef);
      if (workoutSnap.exists()) {
        const workout = workoutSnap.data();
        const allExercises = workout.exercises || [];
        setOriginalExercises(allExercises);

        const saved = localStorage.getItem(`live-${selectedWorkoutId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setPerformance(parsed.performance || {});

          const filtered = allExercises.filter((ex) => {
            const perf = parsed.performance?.[ex.name];
            const targetSets = ex.sets ?? 1;
            return !perf || (perf.sets?.length || 0) < targetSets;
          });

          setExercises(filtered);

          const first = filtered[0];
          const setsDone = parsed.performance?.[first?.name]?.sets?.length || 0;
          setCurrentSet(setsDone + 1);
          setCurrentExerciseIndex(0);
          setCompletedExercises([]);
        } else {
          setExercises(allExercises);
          setCurrentExerciseIndex(0);
          setCurrentSet(1);
          setPerformance({});
          setCompletedExercises([]);
        }
      }
    };

    fetchWorkout();
  }, [selectedWorkoutId]);

  useEffect(() => {
    if (!user || selectedWorkoutId) return;

    const loadWorkouts = async () => {
      const q = query(
        collection(db, "workouts"),
        where("traineeId", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((w) => w.isActive);
      setWorkouts(data);
    };

    loadWorkouts();
  }, [user, selectedWorkoutId]);

  useEffect(() => {
    let interval;
    if (resting && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer === 0) {
      setResting(false);
      setCurrentSet((prev) => prev + 1);
    }
    return () => clearInterval(interval);
  }, [resting, timer]);

  useEffect(() => {
    if (!showSummary && selectedWorkoutId) {
      const saved = localStorage.getItem(`live-${selectedWorkoutId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setPerformance(parsed.performance || {});

        const filtered = originalExercises.filter((ex) => {
          const perf = parsed.performance?.[ex.name];
          const targetSets = ex.sets ?? 1;
          return !perf || (perf.sets?.length || 0) < targetSets;
        });

        setExercises(filtered);

        const current = filtered[0];
        const setsDone = parsed.performance?.[current?.name]?.sets?.length || 0;
        setCurrentExerciseIndex(0);
        setCurrentSet(setsDone + 1);
        setCompletedExercises([]);
      }
    }
  }, [showSummary, selectedWorkoutId]);

  const saveState = (extra = {}) => {
    localStorage.setItem(
      `live-${selectedWorkoutId}`,
      JSON.stringify({
        performance,
        completedExercises,
        currentExerciseIndex,
        currentSet,
        exercises,
        ...extra,
      })
    );
  };

  const handleInputChange = (field, value) => {
    const name = exercises[currentExerciseIndex]?.name;
    if (!name) return;
    setPerformance((prev) => {
      const updated = {
        ...prev,
        [name]: {
          ...(prev[name] || {}),
          [field]: value,
        },
      };
      saveState({ performance: updated });
      return updated;
    });
  };

  const getRestTime = () => {
    const rest = exercises[currentExerciseIndex]?.rest;
    return rest ? parseInt(rest) * 60 : 60;
  };

  const completeSet = () => {
    const ex = exercises[currentExerciseIndex];
    const name = ex.name;
    const perf = performance[name] || {};
    const sets = perf.sets || [];
    const reps = perf.reps || ex.reps;
    const load = perf.load || ex.load;

    const updatedSet = { reps, load };

    const updated = {
      ...performance,
      [name]: {
        ...perf,
        reps,
        load,
        sets: [...sets, updatedSet],
      },
    };
    setPerformance(updated);
    saveState({ performance: updated });

    if (sets.length + 1 < ex.sets) {
      setResting(true);
      setTimer(getRestTime());
    } else {
      const updatedCompleted = [...new Set([...completedExercises, name])];
      setCompletedExercises(updatedCompleted);
      saveState({ completedExercises: updatedCompleted });
      goToNext();
    }
  };

  const goToNext = () => {
    const next = currentExerciseIndex + 1;
    if (next < exercises.length) {
      setCurrentExerciseIndex(next);
      setCurrentSet(1);
      saveState({ currentExerciseIndex: next, currentSet: 1 });
    } else {
      setShowSummary(true);
    }
  };

  const goToPrev = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex((i) => i - 1);
      setCurrentSet(1);
      saveState({ currentExerciseIndex: currentExerciseIndex - 1, currentSet: 1 });
    }
  };

  const markComplete = async () => {
    if (!user) return;

    const workoutRef = doc(db, "workouts", selectedWorkoutId);
    const workoutSnap = await getDoc(workoutRef);
    const workoutTitle = workoutSnap.exists() ? workoutSnap.data().title || "Untitled" : "Untitled";

    const summary = originalExercises.map((ex) => {
      const perf = performance[ex.name];
      const setsDone = perf?.sets?.length || 0;
      const status = setsDone === 0 ? "Not started" : setsDone < ex.sets ? "Partial" : "Completed";
      return {
        name: ex.name,
        sets: setsDone,
        reps: perf?.sets?.map((s) => s.reps).join(", ") || "-",
        load: perf?.sets?.map((s) => s.load).join(", ") || "-",
        status,
      };
    });

    const historyRef = collection(doc(db, "users", user.uid), "history");
    await addDoc(historyRef, {
      workoutId: selectedWorkoutId,
      title: workoutTitle,
      date: serverTimestamp(),
      summary,
    });
    localStorage.removeItem(`live-${selectedWorkoutId}`);
    navigate("/history");
  };

  const current = exercises[currentExerciseIndex];
  console.log({
    selectedWorkoutId,
    currentExerciseIndex,
    exercises,
    current: exercises[currentExerciseIndex],
    performance,
  });

  if (!selectedWorkoutId) {
    return (
      <div className="p-6 max-w-xl mx-auto text-white">
        <h1 className="text-2xl font-bold mb-4">Select a Workout</h1>
        {workouts.length === 0 ? (
          <p>No active workouts found.</p>
        ) : (
          <ul className="space-y-4">
            {workouts.map((w) => (
              <li key={w.id} className="border border-gray-700 rounded p-4 bg-[#1a1a1a] shadow flex justify-between items-center">
                <div>
                  <p className="font-semibold text-white">{w.title}</p>
                  <p className="text-sm text-gray-400">Goal: {w.goal || "Not specified"}</p>
                  <p className="text-sm text-gray-400">
                    Created: {w.startDate ? new Date(w.startDate).toLocaleDateString() : "Not available"}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedWorkoutId(w.id)}
                  className="bg-gradient-to-r from-[#9ae9ff] to-[#f3ddf3] text-black px-4 py-2 rounded-2xl text-sm hover:opacity-90"
                >
                  Start Workout
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (!current && !showSummary) return (
    <div className="p-6 text-white">
      <p className="text-sm text-gray-400">Loading workout...</p>
    </div>
  );

  const perf = performance[current.name] || {};

  return (
    <div className="p-6 max-w-xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-4">Live Workout</h1>
      <div className="bg-[#1a1a1a] border border-gray-700 p-4 rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-4">{current.name}</h2>
        <div className="overflow-auto rounded-lg border border-gray-700 mb-4">
          <table className="w-full text-sm text-white">
            <thead className="bg-[#2b2b2b] text-gray-300">
              <tr>
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
              <tr className="border-t border-gray-700">
                <td className="p-2 font-medium">{current.name}</td>
                <td className="p-2">{current.sets}</td>
                <td className="p-2">
                  <input
                    type="number"
                    value={perf.reps || current.reps}
                    onChange={(e) => handleInputChange("reps", e.target.value)}
                    className="bg-black border border-gray-600 rounded px-2 py-1 w-16 text-white"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    value={perf.load || current.load}
                    onChange={(e) => handleInputChange("load", e.target.value)}
                    className="bg-black border border-gray-600 rounded px-2 py-1 w-16 text-white"
                  />
                </td>
                <td className="p-2">{current.rest || "-"}</td>
                <td className="p-2">
                  {current.video ? (
                    <a href={current.video} target="_blank" rel="noopener noreferrer">
                      <Play className="text-blue-400 w-5 h-5" />
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="p-2 whitespace-pre-wrap">{current.notes || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          Set {currentSet} of {current.sets}
        </p>

        {resting ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" stroke="#2b2b2b" strokeWidth="10" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="#cba5f7"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={283}
                  strokeDashoffset={(1 - timer / getRestTime()) * 283}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold text-white">
                  {Math.floor(timer / 60)}:{("0" + (timer % 60)).slice(-2)}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => {
                  setResting(false);
                  setTimer(getRestTime());
                  setCurrentSet((prev) => prev + 1);
                }}
                className="text-sm text-gray-400 underline hover:text-white"
              >
                Skip Rest
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <button onClick={goToPrev} className="px-4 py-2 text-sm rounded-2xl bg-gray-800 hover:bg-gray-700">
                Back
              </button>
              <button onClick={goToNext} className="px-4 py-2 text-sm rounded-2xl bg-gray-800 hover:bg-gray-700">
                Next
              </button>
            </div>
            <button
              onClick={completeSet}
              className="bg-gradient-to-r from-[#9ae9ff] to-[#f3ddf3] text-black px-4 py-2 rounded-2xl text-sm hover:opacity-90"
            >
              Complete Set
            </button>
          </div>
        )}

      </div>

      {showSummary && (
        <div className="mt-6 bg-[#1a1a1a] border border-gray-700 p-4 rounded-2xl">
          <h1 className="text-2xl font-bold text-green-400 mb-4">Workout Complete!</h1>
          <div className="overflow-auto">
            <table className="w-full text-sm text-white border border-gray-700">
              <thead className="bg-[#2b2b2b] text-gray-300">
                <tr>
                  <th className="p-2">Exercise</th>
                  <th className="p-2">Sets</th>
                  <th className="p-2">Reps</th>
                  <th className="p-2">Load</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {originalExercises.map((ex, i) => {
                  const perf = performance[ex.name];
                  const setsDone = perf?.sets?.length || 0;
                  const status = setsDone === 0 ? "Not started" : setsDone < ex.sets ? "Partial" : "Completed";

                  return (
                    <tr key={i} className="border-t border-gray-700">
                      <td className="p-2">{ex.name}</td>
                      <td className="p-2">{setsDone}</td>
                      <td className="p-2">{perf?.sets?.map((s) => s.reps).join(", ") || "-"}</td>
                      <td className="p-2">{perf?.sets?.map((s) => s.load).join(", ") || "-"}</td>
                      <td className="p-2">{status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-4">
            {originalExercises.some((ex) => (performance[ex.name]?.sets?.length || 0) < ex.sets) && (
              <button
                onClick={() => setShowSummary(false)}
                className="px-4 py-2 text-sm rounded-2xl bg-gray-700 text-white hover:bg-gray-600"
              >
                Back to Workout
              </button>
            )}
            <button
              onClick={markComplete}
              className="bg-gradient-to-r from-[#9ae9ff] to-[#f3ddf3] text-black px-4 py-2 rounded-2xl text-sm hover:opacity-90"
            >
              Finish Workout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}