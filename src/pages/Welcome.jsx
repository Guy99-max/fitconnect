import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Welcome() {
  const navigate = useNavigate();

  const handleSelectRole = (role) => {
    navigate(`/register?role=${role}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4">
      <div className="mb-6 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">FitConnect</h1>
        <p className="text-gray-400 text-sm">Your personal fitness companion</p>
      </div>
      <div className="bg-[#111] border border-gray-800 rounded-2xl p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">Welcome</h2>
        <p className="text-base text-gray-400 mb-8">
          Connect with your trainer or start managing your own fitness journey.
        </p>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => handleSelectRole('trainer')}
            className="bg-gradient-to-r from-[#9ae9ff] to-[#88f3c6] text-black font-semibold px-6 py-3 rounded-xl hover:opacity-90"
          >
            I'm a Trainer
          </button>
          <button
            onClick={() => handleSelectRole('trainee')}
            className="bg-gray-800 border border-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700"
          >
            I'm a Trainee
          </button>
        </div>
      </div>
    </div>
  );
}
