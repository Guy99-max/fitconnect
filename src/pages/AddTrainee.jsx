// src/pages/AddTrainee.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Firebase
import { onAuthStateChanged, getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { initializeApp, deleteApp } from "firebase/app";
import { auth, db, app as primaryApp } from "../firebase";

export default function AddTrainee() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    goal: ""
  });
  const [trainerId, setTrainerId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // קבע trainerId פעם אחת (לא בכל רנדר)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setTrainerId(user?.uid || null);
    });
    return () => unsub();
  }, []);

  const handleChange = (e) => {
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!trainerId) {
      setError("Not authenticated as trainer.");
      return;
    }
    if (!formData.email || !formData.password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);

    // יצירת אפליקציה משנית כדי לא לפגוע בסשן המאמן
    let secondaryApp = null;
    try {
      secondaryApp = initializeApp(primaryApp.options, "Secondary");
      const secondaryAuth = getAuth(secondaryApp);

      // 1) יצירת משתמש חדש (לא מנתק את המאמן)
      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        formData.email.trim().toLowerCase(),
        formData.password
      );
      const trainee = cred.user;

      // 2) יצירת דוק למשתמש החדש
      await setDoc(doc(db, "users", trainee.uid), {
        displayName: `${formData.firstName} ${formData.lastName}`.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        role: "trainee",
        goal: formData.goal || "",
        trainerId: trainerId,
        isActive: true,
        createdAt: serverTimestamp(),
      });

      // 3) קישור דו־כיווני (אופציונלי אך מומלץ)
      await setDoc(
        doc(db, "trainers", trainerId, "trainees", trainee.uid),
        {
          traineeId: trainee.uid,
          email: formData.email.trim().toLowerCase(),
          displayName: `${formData.firstName} ${formData.lastName}`.trim(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
      await setDoc(
        doc(db, "users", trainee.uid, "trainers", trainerId),
        {
          trainerId,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      alert("Trainee created successfully");
      navigate("/trainees");
    } catch (err) {
      // טיפול בשגיאות נפוצות של Auth
      const code = err?.code || "";
      if (code === "auth/email-already-in-use") {
        setError("Email already in use.");
      } else if (code === "auth/invalid-email") {
        setError("Invalid email.");
      } else if (code === "auth/weak-password") {
        setError("Password is too weak (min 6 chars).");
      } else {
        setError(err?.message || String(err));
      }
    } finally {
      if (secondaryApp) {
        try { await deleteApp(secondaryApp); } catch {}
      }
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto text-white bg-[#0d0d0d] p-6 rounded-2xl border border-gray-700">
      <h2 className="text-2xl font-bold mb-4 text-center">Add New Trainee</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="firstName"
          placeholder="First Name"
          value={formData.firstName}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 rounded bg-black text-white border border-gray-700 placeholder-gray-500"
          disabled={loading}
        />
        <input
          type="text"
          name="lastName"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 rounded bg-black text-white border border-gray-700 placeholder-gray-500"
          disabled={loading}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 rounded bg-black text-white border border-gray-700 placeholder-gray-500"
          disabled={loading}
        />
        <input
          type="password"
          name="password"
          placeholder="Password (min 6)"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 rounded bg-black text-white border border-gray-700 placeholder-gray-500"
          disabled={loading}
        />
        <input
          type="text"
          name="goal"
          placeholder="Goal (optional)"
          value={formData.goal}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded bg-black text-white border border-gray-700 placeholder-gray-500"
          disabled={loading}
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          className={`w-full py-2 rounded font-semibold ${
            loading
              ? "bg-neutral-700 text-neutral-300"
              : "bg-gradient-to-r from-[#9ae9ff] to-[#c6f7e9] text-black"
          }`}
          disabled={loading}
        >
          {loading ? "Creating..." : "Add Trainee"}
        </button>
      </form>
    </div>
  );
}
