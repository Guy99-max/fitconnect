// src/pages/TrainerDashboard.jsx
import React, { useEffect, useState } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import TraineeList from "./TraineeList";

export default function TrainerDashboard() {
  const [trainerName, setTrainerName] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTrainerName(`${data.firstName} ${data.lastName}`);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("role");
    window.location.href = "/";
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Welcome, {trainerName}</h1>
      <p className="text-gray-600 mb-6">
        Here you'll find a list of your <span className="font-medium text-green-600">active</span> trainees.
      </p>

      <TraineeList activeOnly={true} />


    </div>
  );
}
