// src/App.jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import TrainerDashboard from './pages/TrainerDashboard';
import TraineeDashboard from './pages/TraineeDashboard';
import CreateWorkout from './pages/CreateWorkout';
import EditWorkout from './pages/EditWorkout';
import TraineeProfile from './pages/TraineeProfile';
import LiveWorkout from './pages/LiveWorkout';
import WorkoutHistory from './pages/WorkoutHistory';
import TrainerProfile from './pages/TrainerProfile';
import NoWorkout from './pages/NoWorkout';
import Navbar from './components/Navbar';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import ClientProfile from './pages/ClientProfile';
import TraineeViewWorkout from "./pages/TraineeViewWorkout";
import Trainees from "./pages/Trainees";
import AddTrainee from './pages/AddTrainee';



export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRole(docSnap.data().role);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <Router>
      {user && role && <Navbar role={role} />}
      <Routes>
        {!user ? (
          <>
            <Route path="/" element={<Welcome />} />
            <Route path="/login" element={<Login onLogin={() => setUser(auth.currentUser)} />} />
            <Route path="/register" element={<Register onRegister={() => setUser(auth.currentUser)} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        ) : (
          <>
            {role === "trainer" && (
              <>
                <Route path="/trainer" element={<TrainerDashboard />} />
                <Route path="/trainee-profile/:id" element={<TraineeProfile />} />
                <Route path="/create-workout/:id" element={<CreateWorkout />} />
                <Route path="/edit-workout/:id" element={<EditWorkout />} />
                <Route path="/trainer-profile" element={<TrainerProfile />} />
                <Route path="/client-profile/:id" element={<ClientProfile />} />
                <Route path="/trainees" element={<Trainees />} />
                <Route path="/add-trainee" element={<AddTrainee />} />
              </>
            )}
            {role === "trainee" && (
              <>
                <Route path="/home" element={<TraineeDashboard />} />
                <Route path="/live-workout/:id" element={<LiveWorkout />} />
                <Route path="/history" element={<WorkoutHistory />} />
                <Route path="/no-workout" element={<NoWorkout />} />
                <Route path="/profile" element={<TraineeProfile />} />
                <Route path="/view-workout/:id" element={<TraineeViewWorkout />} />

              </>
            )}
            <Route path="*" element={<Navigate to={role === "trainer" ? "/trainer" : "/home"} />} />
          </>
        )}
      </Routes>
    </Router>
  );
}
