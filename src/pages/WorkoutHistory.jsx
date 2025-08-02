// src/pages/WorkoutHistory.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { auth, db } from "../firebase";

export default function WorkoutHistory() {
  const [history, setHistory] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const historyRef = collection(db, "users", user.uid, "history");
      const q = query(historyRef, orderBy("date", "desc"));
      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((doc) => {
        const d = doc.data();
        const summary = d.summary || [];
        const status = getOverallStatus(summary);
        return {
          id: doc.id,
          title: d.title || "Untitled",
          date: d.date?.toDate().toLocaleString() || "Unknown",
          summary,
          status,
        };
      });

      setHistory(data);
      setLoading(false);
    };

    const getOverallStatus = (summary) => {
      const allCompleted = summary.every((ex) => ex.status === "Completed");
      const noneStarted = summary.every((ex) => ex.status === "Not started");
      if (allCompleted) return "Completed";
      if (noneStarted) return "Not started";
      return "Partial";
    };

    fetchHistory();
  }, []);

  if (loading)
    return <div className="p-6 text-gray-400 text-center">Loading history...</div>;
  if (history.length === 0)
    return <div className="p-6 text-gray-400 text-center">No workout history yet.</div>;

  return (
    <div className="p-6 text-white text-center">
      <h1 className="text-3xl font-bold mb-6">Workout History</h1>
      <div className="rounded-2xl border border-[#2b2b2b] shadow mx-auto overflow-hidden w-fit">
        <table className="table-auto min-w-fit text-sm text-white mx-auto">
          <thead className="bg-[#1a1a1a] text-gray-300 text-center">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">Workout</th>
              <th className="px-4 py-3 whitespace-nowrap">Date</th>
              <th className="px-4 py-3 whitespace-nowrap">Status</th>
              <th className="px-4 py-3 whitespace-nowrap">View</th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry) => (
              <React.Fragment key={entry.id}>
                <tr className="border-t border-gray-700 text-center hover:bg-[#222] transition">
                  <td className="px-4 py-2 whitespace-nowrap">{entry.title}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{entry.date}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {entry.status === "Completed" && (
                      <span className="text-[#90ee90] font-medium">Completed</span>
                    )}
                    {entry.status === "Partial" && (
                      <span className="text-[#ffd580] font-medium">Partial</span>
                    )}
                    {entry.status === "Not started" && (
                      <span className="text-red-400 font-medium">Not started</span>
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <button
                      onClick={() =>
                        setExpandedId(expandedId === entry.id ? null : entry.id)
                      }
                      className="bg-gradient-to-br from-[#8ed3ff] to-[#e2c7f7] text-black font-medium px-4 py-1 rounded-full text-xs hover:opacity-90 transition"
                    >
                      {expandedId === entry.id ? "Hide" : "View"}
                    </button>
                  </td>
                </tr>
                {expandedId === entry.id && (
                  <tr className="border-t border-gray-700 bg-[#111] text-white">
                    <td colSpan="4" className="p-4">
                      <table className="text-xs border border-[#333] mx-auto w-fit">
                        <thead className="bg-[#1a1a1a] text-gray-400 text-center">
                          <tr>
                            <th className="px-3 py-1">Exercise</th>
                            <th className="px-3 py-1">Sets</th>
                            <th className="px-3 py-1">Reps</th>
                            <th className="px-3 py-1">Load</th>
                            <th className="px-3 py-1">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entry.summary.map((ex, idx) => (
                            <tr key={idx} className="border-t border-[#333] text-center">
                              <td className="px-3 py-1 whitespace-nowrap">{ex.name}</td>
                              <td className="px-3 py-1">{ex.sets}</td>
                              <td className="px-3 py-1">{ex.reps}</td>
                              <td className="px-3 py-1">{ex.load}</td>
                              <td className="px-3 py-1">
                                {ex.status === "Completed" && (
                                  <span className="text-[#90ee90] font-medium">Completed</span>
                                )}
                                {ex.status === "Partial" && (
                                  <span className="text-[#ffd580] font-medium">Partial</span>
                                )}
                                {ex.status === "Not started" && (
                                  <span className="text-red-400 font-medium">Not started</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
