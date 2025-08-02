import React, { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const role = docSnap.data().role;
        localStorage.setItem("selectedRole", role);
        onLogin();
        navigate(role === "trainer" ? "/trainer" : "/trainee");
      } else {
        setError("User data not found in Firestore.");
      }
    } catch (error) {
      setError(error.message || "Login failed.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="bg-[#111] border border-gray-800 rounded-2xl p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-6">Login</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-gray-700 text-white px-4 py-2 rounded mb-4"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-gray-700 text-white px-4 py-2 rounded mb-4"
        />

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button
          onClick={handleLogin}
          className="bg-gradient-to-r from-[#9ae9ff] to-[#88f3c6] text-black font-semibold w-full py-3 rounded-xl hover:opacity-90"
        >
          Login
        </button>

        <p className="text-sm text-gray-400 mt-6">
          Don't have an account?{" "}
          <a href="/register" className="text-blue-400 underline">Register here</a>
        </p>
      </div>
    </div>
  );
}
