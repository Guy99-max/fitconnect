// src/pages/LiveWorkout.jsx
import React, { useEffect, useMemo, useState } from "react";
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

  // Rest timer (real-time based)
  const [resting, setResting] = useState(false);
  const [restDuration, setRestDuration] = useState(60); // seconds
  const [restStartTs, setRestStartTs] = useState(null); // ms epoch
  const [timer, setTimer] = useState(60); // UI remaining seconds

  const [performance, setPerformance] = useState({});
  const [completedExercises, setCompletedExercises] = useState([]);
  const [showSummary, setShowSummary] = useState(false);

  const user = auth.currentUser;

  // ---------- helpers ----------
  const current = exercises[currentExerciseIndex];

  const getRestTime = () => {
    const rest = exercises[currentExerciseIndex]?.rest;
    return rest ? parseInt(rest) * 60 : 60;
  };

  const setsDoneFor = (name) =>
    performance?.[name]?.sets ? performance[name].sets.length : 0;

  const currentSetNumber = useMemo(() => {
    if (!current?.name) return 1;
    return Math.min(setsDoneFor(current.name) + 1, current.sets || 1);
  }, [current, performance]);

  const persist = (extra = {}) => {
    if (!selectedWorkoutId) return;
    const payload = {
      performance,
      completedExercises,
      currentExerciseIndex,
      exercises,
      resting,
      restDuration,
      restStartTs,
      ...extra,
    };
    localStorage.setItem(`live-${selectedWorkoutId}`, JSON.stringify(payload));
  };

  // ---------- load workout ----------
  useEffect(() => {
    if (!selectedWorkoutId) return;

    const fetchWorkout = async () => {
      const workoutRef = doc(db, "workouts", selectedWorkoutId);
      const workoutSnap = await getDoc(workoutRef);
      if (!workoutSnap.exists()) return;

      const workout = workoutSnap.data();
      const allExercises = workout.exercises || [];
      setOriginalExercises(allExercises);

      const savedRaw = localStorage.getItem(`live-${selectedWorkoutId}`);
      if (savedRaw) {
        const saved = JSON.parse(savedRaw);

        setPerformance(saved.performance || {});
        setCompletedExercises(saved.completedExercises || []);
        setResting(!!saved.resting);
        setRestDuration(saved.restDuration || 60);
        setRestStartTs(saved.restStartTs || null);

        // filter out completed exercises
        const filtered = allExercises.filter((ex) => {
          const done = saved.performance?.[ex.name]?.sets?.length || 0;
          return done < (ex.sets ?? 1);
        });
        setExercises(filtered);

        // clamp index
        const idx = Math.min(saved.currentExerciseIndex ?? 0, Math.max(filtered.length - 1, 0));
        setCurrentExerciseIndex(idx);

        // initialize visual timer if resting
        if (saved.resting && saved.restStartTs) {
          const elapsed = Math.floor((Date.now() - saved.restStartTs) / 1000);
          const remaining = Math.max(0, (saved.restDuration || 60) - elapsed);
          setTimer(remaining);
          if (remaining === 0) setResting(false);
        }
      } else {
        setExercises(allExercises);
        setCurrentExerciseIndex(0);
        setPerformance({});
        setCompletedExercises([]);
        setResting(false);
        setRestStartTs(null);
        setRestDuration(getRestTime());
        setTimer(getRestTime());
      }
    };

    fetchWorkout();
  }, [selectedWorkoutId]);

  // ---------- load active workouts list ----------
  useEffect(() => {
    if (!user || selectedWorkoutId) return;
    const loadWorkouts = async () => {
      const q = query(
        collection(db, "workouts"),
        where("traineeId", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((w) => w.isActive);
      setWorkouts(data);
    };
    loadWorkouts();
  }, [user, selectedWorkoutId]);

  // ---------- real-time rest timer ----------
  useEffect(() => {
    if (!resting || !restStartTs) return;

    const tick = () => {
      const elapsed = Math.floor((Date.now() - restStartTs) / 1000);
      const remaining = Math.max(0, restDuration - elapsed);
      setTimer(remaining);
      if (remaining === 0) {
        setResting(false);
        setRestStartTs(null);
        persist({ resting: false, restStartTs: null });
      }
    };

    // update often; keep battery friendly
    const id = setInterval(tick, 500);
    tick(); // sync immediately

    // if user leaves/returns the tab/app
    const onVis = () => tick();
    document.addEventListener("visibilitychange", onVis);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resting, restStartTs, restDuration]);

  // keep localStorage in sync on key state changes
  useEffect(() => {
    persist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [performance, completedExercises, currentExerciseIndex, resting]);

  // ---------- actions ----------
  const handleInputChange = (field, value) => {
    const name = exercises[currentExerciseIndex]?.name;
    if (!name) return;
    setPerformance((prev) => {
      const curr = prev[name] || {};
      // allow empty string; do not coerce to default
      const updated = {
        ...prev,
        [name]: { ...curr, [field]: value },
      };
      return updated;
    });
  };

  const beginRest = (seconds) => {
    const now = Date.now();
    setResting(true);
    setRestDuration(seconds);
    setRestStartTs(now);
    setTimer(seconds);
    persist({ resting: true, restDuration: seconds, restStartTs: now });
  };

  const completeSet = () => {
    const ex = exercises[currentExerciseIndex];
    if (!ex) return;
    const name = ex.name;
    const perf = performance[name] || {};
    const sets = perf.sets || [];

    const reps =
      perf.reps !== undefined && perf.reps !== null ? perf.reps : ex.reps;
    const load =
      perf.load !== undefined && perf.load !== null ? perf.load : ex.load;
    const rpe = perf.rpe ?? "";

    const updatedSet = { reps, load, rpe };
    const updatedPerf = {
      ...performance,
      [name]: {
        ...perf,
        reps,
        load,
        sets: [...sets, updatedSet],
      },
    };
    setPerformance(updatedPerf);

    const totalAfter = sets.length + 1;
    if (totalAfter < (ex.sets || 1)) {
      beginRest(getRestTime());
    } else {
      const updatedCompleted = [...new Set([...completedExercises, name])];
      setCompletedExercises(updatedCompleted);
      goToNext();
    }
  };

  const goToNext = () => {
    const next = currentExerciseIndex + 1;
    if (next < exercises.length) {
      setCurrentExerciseIndex(next);
    } else {
      setShowSummary(true);
    }
  };

  const goToPrev = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex((i) => i - 1);
    }
  };

  const skipRest = () => {
    setResting(false);
    setRestStartTs(null);
    setTimer(getRestTime());
    persist({ resting: false, restStartTs: null });
  };

  const markComplete = async () => {
    if (!user || !selectedWorkoutId) return;

    const workoutRef = doc(db, "workouts", selectedWorkoutId);
    const workoutSnap = await getDoc(workoutRef);
    const workoutTitle = workoutSnap.exists()
      ? workoutSnap.data().title || "Untitled"
      : "Untitled";

    const summary = originalExercises.map((ex) => {
      const perf = performance[ex.name];
      const setsDone = perf?.sets?.length || 0;
      const status =
        setsDone === 0
          ? "Not started"
          : setsDone < ex.sets
          ? "Partial"
          : "Completed";
      return {
        name: ex.name,
        sets: setsDone,
        reps: perf?.sets?.map((s) => s.reps).join(", ") || "-",
        load: perf?.sets?.map((s) => s.load).join(", ") || "-",
        rpe:  perf?.sets?.map((s) => s.rpe ?? "").filter(Boolean).join(", ") || "-",
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

  // ---------- UI ----------
  if (!selectedWorkoutId) {
    return (
      <div className="p-6 w-full max-w-4xl mx-auto text-white">
        <h1 className="text-2xl font-bold mb-4">Select a Workout</h1>
        {workouts.length === 0 ? (
          <p>No active workouts found.</p>
        ) : (
          <ul className="space-y-4">
            {workouts.map((w) => (
              <li
                key={w.id}
                className="border border-gray-700 rounded p-4 bg-[#1a1a1a] shadow flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-white">{w.title}</p>
                  <p className="text-sm text-gray-400">
                    Goal: {w.goal || "Not specified"}
                  </p>
                  <p className="text-sm text-gray-400">
                    Created:{" "}
                    {w.startDate
                      ? new Date(w.startDate).toLocaleDateString()
                      : "Not available"}
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

  if (!current && !showSummary)
    return (
      <div className="p-6 text-white">
        <p className="text-sm text-gray-400">Loading workout...</p>
      </div>
    );

  const perf = current ? performance[current.name] || {} : {};

  return (
    <div className="p-6 w-full max-w-4xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-4">Live Workout</h1>

      {current && (
      <div className="bg-[#1a1a1a] border border-gray-700 p-4 rounded-2xl shadow w-full">
        <h2 className="text-lg font-bold mb-4 text-cyan-200">{current.name}</h2>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-700 mb-4">
          <table className="w-full table-auto text-sm text-white">
            <thead className="bg-[#2b2b2b] text-gray-300 text-center">
              <tr>
                <th className="p-2 text-center w-20">Sets</th>
                <th className="p-2 text-center w-20">Reps</th>
                <th className="p-2 text-center w-20">Load (kg)</th>
                <th className="p-2 text-center w-20">RPE / RIR</th>
                <th className="p-2 text-center w-20">Rest (min)</th>
                <th className="p-2 text-center w-20">Video</th>
                <th className="p-2 text-center w-40">Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-700">
                <td className="p-2 text-center w-20">{current.sets}</td>

                <td className="p-2 text-center w-20">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={perf.reps ?? (current.reps ?? "")}
                    onChange={(e) => handleInputChange("reps", e.target.value)}
                    className="bg-black border border-gray-600 rounded px-2 py-1 w-full text-white text-center"
                  />
                </td>

                <td className="p-2 text-center w-20">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={perf.load ?? (current.load ?? "")}
                    onChange={(e) => handleInputChange("load", e.target.value)}
                    className="bg-black border border-gray-600 rounded px-2 py-1 w-full text-white text-center"
                  />
                </td>

                <td className="p-2 text-center w-20">
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="e.g. 8"
                    value={perf.rpe ?? ""}
                    onChange={(e) => handleInputChange("rpe", e.target.value)}
                    className="bg-black border border-gray-600 rounded px-2 py-1 w-full text-white text-center"
                  />
                </td>

                <td className="p-2 text-center w-20">{current.rest || "-"}</td>

                {/* Video icon centered */}
                <td className="p-2 text-center w-20">
                  {current.video ? (
                    <div className="flex justify-center items-center h-full">
                      <a href={current.video} target="_blank" rel="noopener noreferrer" aria-label="Open video">
                        <Play className="text-blue-400 w-5 h-5" />
                      </a>
                    </div>
                  ) : (
                    "-"
                  )}
                </td>

                <td className="p-2 whitespace-pre-wrap text-center w-40">
                  {current.notes || "-"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>


        {/* Mobile card */}
        <div className="md:hidden rounded-lg border border-gray-700 mb-4 p-3">
          <div className="grid grid-cols-[1fr,6rem] gap-y-3 items-center">
            {/* הסרנו את Exercise */}

            <div className="text-gray-400">Sets</div>
            <div className="w-24 text-center">{current.sets}</div>

            <label className="text-gray-400">Reps</label>
            <input
              type="number"
              inputMode="numeric"
              value={perf.reps ?? (current.reps ?? "")}
              onChange={(e) => handleInputChange("reps", e.target.value)}
              className="bg-black border border-gray-600 rounded px-2 py-1 w-24 text-white text-center"
            />

            <label className="text-gray-400">Load (kg)</label>
            <input
              type="number"
              inputMode="numeric"
              value={perf.load ?? (current.load ?? "")}
              onChange={(e) => handleInputChange("load", e.target.value)}
              className="bg-black border border-gray-600 rounded px-2 py-1 w-24 text-white text-center"
            />

            <label className="text-gray-400">RPE / RIR</label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="8"
              value={perf.rpe ?? ""}
              onChange={(e) => handleInputChange("rpe", e.target.value)}
              className="bg-black border border-gray-600 rounded px-2 py-1 w-24 text-white text-center"
            />

            <div className="text-gray-400">Rest (min)</div>
            <div className="w-24 text-center">{current.rest || "-"}</div>
          </div>

          {current.notes && (
            <div className="mt-3">
              <div className="text-gray-400 mb-1">Notes</div>
              <div className="whitespace-pre-wrap">{current.notes}</div>
            </div>
          )}

          {current.video && (
            <div className="mt-3 flex justify-center">
              <a
                href={current.video}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-pink-400 mx-auto mt-3"
              >
                <Play className="text-white w-6 h-6" />
              </a>
            </div>
          )}
        </div>

          <p className="text-sm text-gray-400 mb-4">
            Set {currentSetNumber} of {current.sets}
          </p>

          {resting ? (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="relative w-36 h-36">
                <svg
                  className="w-full h-full rotate-[-90deg]"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="#2b2b2b"
                    strokeWidth="10"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="#cba5f7"
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={283}
                    strokeDashoffset={
                      (1 - timer / (restDuration || 1)) * 283
                    }
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold text-white">
                    {Math.floor(timer / 60)}:
                    {("0" + (timer % 60)).slice(-2)}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={skipRest}
                  className="text-sm text-gray-400 underline hover:text-white"
                >
                  Skip Rest
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                <button
                  onClick={goToPrev}
                  className="px-4 py-2 text-sm rounded-2xl bg-gray-800 hover:bg-gray-700"
                >
                  Back
                </button>
                <button
                  onClick={goToNext}
                  className="px-4 py-2 text-sm rounded-2xl bg-gray-800 hover:bg-gray-700"
                >
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
      )}

      {showSummary && (
        <div className="mt-6 bg-[#1a1a1a] border border-gray-700 p-4 rounded-2xl">
          <h1 className="text-2xl font-bold text-green-400 mb-4">
            Workout Complete!
          </h1>
          <div className="overflow-auto">
            <table className="w-full text-sm text-white border border-gray-700">
              <thead className="bg-[#2b2b2b] text-gray-300 text-center">
                <tr>
                  <th className="p-2 text-center w-36">Exercise</th>
                    <th className="p-2 text-center w-24">Sets</th>
                    <th className="p-2 text-center w-24">Reps</th>
                    <th className="p-2 text-center w-24">Load (kg)</th>
                    <th className="p-2 text-center w-24">RPE / RIR</th>
                    <th className="p-2 text-center w-40">Status</th>
                </tr>
              </thead>
              <tbody>
                {originalExercises.map((ex, i) => {
                  const perf = performance[ex.name];
                  const setsDone = perf?.sets?.length || 0;
                  const status =
                    setsDone === 0 ? "Not started" :
                    setsDone < ex.sets ? "Partial" : "Completed";

                  const repsStr = perf?.sets?.map((s) => s.reps).join(", ") || "-";
                  const loadStr = perf?.sets?.map((s) => s.load).join(", ") || "-";
                  const rpeStr  = perf?.sets?.map((s) => s.rpe ?? "").filter(Boolean).join(", ") || "-";

                  return (
                    <tr key={i} className="border-t border-gray-700 text-center">
                      <td className="p-2 w-36">{ex.name}</td>
                      <td className="p-2 w-24">{setsDone}</td>
                      <td className="p-2 w-24">{repsStr}</td>
                      <td className="p-2 w-24">{loadStr}</td>
                      <td className="p-2 w-24">{rpeStr}</td>
                      <td className="p-2 w-40">{status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-4">
            {originalExercises.some(
              (ex) => (performance[ex.name]?.sets?.length || 0) < ex.sets
            ) && (
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
