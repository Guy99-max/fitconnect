// src/pages/AddTrainee.jsx
import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

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
  const navigate = useNavigate();

  onAuthStateChanged(auth, (user) => {
    if (user) {
      setTrainerId(user.uid);
    }
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const trainee = userCredential.user;

      await setDoc(doc(db, "users", trainee.uid), {
        displayName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        role: "trainee",
        goal: formData.goal || "",
        trainerId: trainerId,
        isActive: true
      });

      alert("Trainee created successfully");
      navigate("/trainees");
    } catch (err) {
      setError(err.message);
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
        />
        <input
          type="text"
          name="lastName"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 rounded bg-black text-white border border-gray-700 placeholder-gray-500"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 rounded bg-black text-white border border-gray-700 placeholder-gray-500"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 rounded bg-black text-white border border-gray-700 placeholder-gray-500"
        />
        <input
          type="text"
          name="goal"
          placeholder="Goal (optional)"
          value={formData.goal}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded bg-black text-white border border-gray-700 placeholder-gray-500"
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          className="w-full py-2 rounded bg-gradient-to-r from-[#9ae9ff] to-[#c6f7e9] text-black font-semibold"
        >
          Add Trainee
        </button>
      </form>
    </div>
  );
}
