import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Register({ onRegister }) {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const roleParam = searchParams.get('role');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState(roleParam || 'trainee');
  const [trainerEmail, setTrainerEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (roleParam) {
      setRole(roleParam);
    }
  }, [roleParam]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      let trainerId = null;
      let selfManaged = false;

      if (role === 'trainee') {
        if (!trainerEmail) {
          setError("Trainer's email is required.");
          return;
        }

        const normalizedTrainerEmail = trainerEmail.trim().toLowerCase();

        if (normalizedTrainerEmail === email.trim().toLowerCase()) {
          trainerId = user.uid;
          selfManaged = true;
        } else {
          const q = query(
            collection(db, 'users'),
            where('email', '==', normalizedTrainerEmail),
            where('role', '==', 'trainer')
          );
          const snapshot = await getDocs(q);

          if (snapshot.empty) {
            setError("Trainer not found. Please check the email or use your own if self-managed.");
            return;
          }

          trainerId = snapshot.docs[0].id;
        }
      }

      const displayName = `${firstName} ${lastName}`;

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: email.trim().toLowerCase(),
        displayName,
        firstName,
        lastName,
        role,
        trainerId: role === 'trainer' ? user.uid : trainerId,
        selfManaged: role === 'trainer' ? false : selfManaged,
        createdAt: new Date().toISOString()
      });

      onRegister?.();
      navigate(role === 'trainer' ? '/trainer' : '/trainee');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4">
      <div className="bg-[#111] border border-gray-800 rounded-2xl p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-6">Create Your Account</h2>
        <form onSubmit={handleRegister} className="space-y-4 text-left">
          <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full p-2 bg-black border border-gray-700 rounded" required />
          <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full p-2 bg-black border border-gray-700 rounded" required />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 bg-black border border-gray-700 rounded" required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 bg-black border border-gray-700 rounded" required />

          {role === 'trainee' && (
            <input
              type="email"
              placeholder="Trainer's Email (or your own)"
              value={trainerEmail}
              onChange={(e) => setTrainerEmail(e.target.value)}
              className="w-full p-2 bg-black border border-gray-700 rounded"
              required
            />
          )}

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button type="submit" className="w-full bg-gradient-to-r from-[#9ae9ff] to-[#88f3c6] text-black font-semibold py-2 rounded-xl hover:opacity-90">
            Register
          </button>
        </form>

        <p className="text-sm text-gray-400 text-center mt-4">
          Already registered?{' '}
          <a href="/login" className="text-blue-400 underline">Login</a>
        </p>
      </div>
    </div>
  );
}
