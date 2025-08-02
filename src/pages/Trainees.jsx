// src/pages/Trainees.jsx
import React from "react";
import TraineeList from "./TraineeList";

export default function Trainees() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">All Trainees</h1>
      <p className="text-gray-600 mb-6">
        Here you'll find your complete list of trainees, both active and inactive.
      </p>
      <TraineeList />
    </div>
  );
}
