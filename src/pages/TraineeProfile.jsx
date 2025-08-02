import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { format } from "date-fns";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

export default function TraineeProfile() {
  const user = auth.currentUser;
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({ age: "", height: "", goal: "" });
  const [measurements, setMeasurements] = useState([]);
  const [newMeasurement, setNewMeasurement] = useState({ weight: "", bodyFat: "", waist: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleLines, setVisibleLines] = useState({ weight: true, bodyFat: true, waist: true });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        setFormData({
          age: data.age || "",
          height: data.height || "",
          goal: data.goal || "",
        });
      }

      const q = query(collection(db, "measurements", user.uid, "data"), orderBy("timestamp", "desc"));
      const snap = await getDocs(q);
      setMeasurements(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      setIsLoading(false);
    };

    fetchData();
  }, [user]);

  const handleUserChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const saveUserDetails = async () => {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), formData);
    setIsEditing(false);
  };

  const addMeasurement = async () => {
    const valid = newMeasurement.weight && newMeasurement.bodyFat && newMeasurement.waist;
    if (!valid) return alert("Fill all measurement fields");
    await addDoc(collection(db, "measurements", user.uid, "data"), {
      ...newMeasurement,
      timestamp: Timestamp.now(),
    });
    setNewMeasurement({ weight: "", bodyFat: "", waist: "" });
    window.location.reload();
  };

  const chartData = {
    labels: measurements.map(m => format(m.timestamp.toDate(), "MMM d")),
    datasets: [
      visibleLines.weight && {
        label: "Weight (kg)",
        data: measurements.map(m => m.weight ?? 0),
        borderColor: "#9ae9ff",
        backgroundColor: "rgba(154, 233, 255, 0.2)",
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "#9ae9ff",
      },
      visibleLines.bodyFat && {
        label: "Body Fat %",
        data: measurements.map(m => m.bodyFat ?? 0),
        borderColor: "#f3ddf3",
        backgroundColor: "rgba(243, 221, 243, 0.2)",
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "#f3ddf3",
      },
      visibleLines.waist && {
        label: "Waist (cm)",
        data: measurements.map(m => m.waist ?? 0),
        borderColor: "#90ee90",
        backgroundColor: "rgba(144, 238, 144, 0.2)",
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "#90ee90",
      },
    ].filter(Boolean),
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: { color: "#ffffff" },
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      x: {
        ticks: { color: "#aaaaaa" },
        grid: { color: "#222" },
      },
      y: {
        ticks: { color: "#aaaaaa" },
        grid: { color: "#222" },
      },
    },
  };

  if (isLoading) return <div className="p-6 text-white">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 text-white">
      <div className="bg-[#1a1a1a] p-6 rounded-2xl shadow space-y-2">
        <h1 className="text-2xl font-bold">
          Welcome, {userData?.firstName} {userData?.lastName}
        </h1>
        <p className="text-gray-400">{userData?.email}</p>
      </div>

      <div className="bg-[#222] p-6 rounded-2xl shadow text-sm">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleUserChange}
                className="w-full bg-[#1a1a1a] border border-[#333] text-white p-2 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Height (cm)</label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleUserChange}
                className="w-full bg-[#1a1a1a] border border-[#333] text-white p-2 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Goal</label>
              <input
                type="text"
                name="goal"
                value={formData.goal}
                onChange={handleUserChange}
                className="w-full bg-[#1a1a1a] border border-[#333] text-white p-2 rounded-xl"
              />
            </div>
            <button
              onClick={saveUserDetails}
              className="bg-gradient-to-r from-[#9ae9ff] to-[#f3ddf3] text-black px-4 py-2 rounded-xl font-medium transition"
            >
              Save Details
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <div className="text-gray-400">Age:</div>
            <div className="col-span-2">{formData.age || "-"}</div>
            <div className="text-gray-400">Height (cm):</div>
            <div className="col-span-2">{formData.height || "-"}</div>
            <div className="text-gray-400">Goal:</div>
            <div className="col-span-2">{formData.goal || "-"}</div>
            <div className="col-span-3">
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-400 text-xs underline mt-2"
              >
                Edit
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#1a1a1a] p-6 rounded-2xl shadow">
        <h2 className="text-xl font-semibold border-b border-[#333] pb-2 mb-4">
          Add Measurement
        </h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <input
            type="number"
            placeholder="Weight (kg)"
            value={newMeasurement.weight}
            onChange={e => setNewMeasurement(p => ({ ...p, weight: e.target.value }))}
            className="bg-[#1a1a1a] border border-[#333] text-white p-2 rounded-xl w-full"
          />
          <input
            type="number"
            placeholder="Body Fat %"
            value={newMeasurement.bodyFat}
            onChange={e => setNewMeasurement(p => ({ ...p, bodyFat: e.target.value }))}
            className="bg-[#1a1a1a] border border-[#333] text-white p-2 rounded-xl w-full"
          />
          <input
            type="number"
            placeholder="Waist (cm)"
            value={newMeasurement.waist}
            onChange={e => setNewMeasurement(p => ({ ...p, waist: e.target.value }))}
            className="bg-[#1a1a1a] border border-[#333] text-white p-2 rounded-xl w-full"
          />
        </div>
        <button
          onClick={addMeasurement}
          className="bg-gradient-to-r from-[#9ae9ff] to-[#f3ddf3] text-black px-4 py-2 rounded-xl font-medium transition"
        >
          Add Measurement
        </button>
      </div>

      {measurements.length > 0 && (
        <div className="bg-[#1a1a1a] p-6 rounded-2xl shadow space-y-4">
          <h2 className="text-xl font-semibold border-b border-[#333] pb-2">
            Measurement History
          </h2>
          <div className="overflow-auto rounded-xl border border-[#333]">
            <table className="w-full text-sm text-white text-center">
              <thead>
                <tr className="text-gray-400 border-b border-[#333]">
                  <th className="p-2">Date</th>
                  <th className="p-2">Weight</th>
                  <th className="p-2">Body Fat %</th>
                  <th className="p-2">Waist</th>
                </tr>
              </thead>
              <tbody>
                {measurements.map((m) => (
                  <tr key={m.id} className="border-t border-[#222]">
                    <td className="p-2">{format(m.timestamp.toDate(), "yyyy-MM-dd")}</td>
                    <td className="p-2">{m.weight}</td>
                    <td className="p-2">{m.bodyFat}</td>
                    <td className="p-2">{m.waist}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {measurements.length > 0 && (
        <div className="bg-[#1a1a1a] p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold border-b border-[#333] pb-2 mb-4">
            Progress Chart
          </h2>
          <Line data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
}
