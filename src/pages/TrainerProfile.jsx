import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export default function TrainerProfile() {
  const [trainerData, setTrainerData] = useState(null);
  const [traineeCount, setTraineeCount] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ displayName: "", gymLocation: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchTrainerData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const trainerRef = doc(db, "users", user.uid);
      const trainerSnap = await getDoc(trainerRef);

      if (trainerSnap.exists()) {
        const data = trainerSnap.data();
        setTrainerData(data);
        setFormData({
          displayName: data.displayName || "",
          gymLocation: data.gymLocation || "",
        });
      }

      const q = query(
        collection(db, "users"),
        where("trainerId", "==", user.uid),
        where("isActive", "==", true),
        where("role", "==", "trainee")
      );
      const traineesSnap = await getDocs(q);
      setTraineeCount(traineesSnap.size);
    };

    fetchTrainerData();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    const trainerRef = doc(db, "users", user.uid);
    await updateDoc(trainerRef, {
      displayName: formData.displayName,
      gymLocation: formData.gymLocation,
    });

    setTrainerData((prev) => ({
      ...prev,
      displayName: formData.displayName,
      gymLocation: formData.gymLocation,
    }));
    setEditMode(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!trainerData) return <div className="p-6 text-white">Loading...</div>;

  return (
    <div className="p-6 max-w-md mx-auto text-white">
      <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 text-center">
        <h1 className="text-2xl font-bold mb-6">Trainer Profile</h1>

        <div className="space-y-3 text-sm text-left max-w-xs mx-auto">
          <div>
            <span className="text-gray-400">Name:</span>{" "}
            {editMode ? (
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className="bg-[#111] border border-gray-700 rounded px-3 py-2 w-full"
              />
            ) : (
              <span className="text-white font-semibold">{trainerData.displayName || "N/A"}</span>
            )}
          </div>
          <div>
            <span className="text-gray-400">Email:</span>{" "}
            <span className="text-white font-semibold">{trainerData.email || auth.currentUser.email}</span>
          </div>
          <div>
            <span className="text-gray-400">Training Location:</span>{" "}
            {editMode ? (
              <input
                type="text"
                name="gymLocation"
                value={formData.gymLocation}
                onChange={handleChange}
                className="bg-[#111] border border-gray-700 rounded px-3 py-2 w-full"
              />
            ) : (
              <span className="text-white font-semibold">{trainerData.gymLocation || "N/A"}</span>
            )}
          </div>
          <div>
            <span className="text-gray-400">Active Trainees:</span>{" "}
            <span className="text-white font-semibold">{traineeCount}</span>
          </div>

          {editMode ? (
            <button
              onClick={handleSave}
              className="bg-gradient-to-r from-[#9ae9ff] to-[#88f3c6] text-black font-semibold px-6 py-2 rounded-xl hover:opacity-90 mt-4 w-full"
            >
              Save Details
            </button>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="text-blue-500 text-sm underline mt-4"
            >
              Edit Profile
            </button>
          )}

          {saved && <p className="text-green-500 text-sm mt-2">Details saved.</p>}
        </div>
      </div>
    </div>
  );
}
