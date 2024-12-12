import React, { useState } from "react";
import { diseases } from "./diseases"; // Importing diseases data from diseases.js
import axios from 'axios'

const backend = import.meta.env.VITE_BACKEND_URL

const App = () => {
  const [step, setStep] = useState(0); // Track current question
  const [selectedSymptoms, setSelectedSymptoms] = useState([]); // Track selected symptoms
  const [currentStepSymptoms, setCurrentStepSymptoms] = useState([]); // Track symptoms for the current step
  const [filteredDiseases, setFilteredDiseases] = useState(diseases); // Filtered diseases after each step
  const [results, setResults] = useState(null); // Store the final results
  const [previousSymptoms, setPreviousSymptoms] = useState([]); // Track previously shown symptoms
  const [showForm, setShowForm] = useState(false); // Show form before results
  const [userData, setUserData] = useState({ name: "", email: "", phone: "" }); // Form data
  const [formError, setFormError] = useState(""); // Track form errors

  const questions = [
    "Do you experience any of these common symptoms?",
    "Do you also experience any of these more specific symptoms?",
    "Are you noticing these symptoms?",
    "Any of these uncommon symptoms?",
    "Finally, do you have these rare symptoms?",
  ];

  const getSymptoms = () => {
    const symptomsSet = new Set();
    filteredDiseases.forEach((disease) => {
      disease.symptoms.forEach((symptom) => symptomsSet.add(symptom));
    });

    const availableSymptoms = Array.from(symptomsSet).filter(
      (symptom) =>
        !selectedSymptoms.includes(symptom) &&
        !previousSymptoms.includes(symptom)
    );

    if (availableSymptoms.length === 0) setShowForm(true)

      return availableSymptoms.slice(0, 15);
  };

  const handleSymptomSelect = (symptom) => {
    setCurrentStepSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  const nextStep = () => {
    setSelectedSymptoms((prev) => [...prev, ...currentStepSymptoms]);
    setCurrentStepSymptoms([]);
    setPreviousSymptoms((prev) => [...prev, ...getSymptoms()]);

    const newFiltered = filteredDiseases.filter((disease) =>
      [...selectedSymptoms, ...currentStepSymptoms].some((symptom) =>
        disease.symptoms.includes(symptom)
      )
    );
    setFilteredDiseases(newFiltered);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setShowForm(true); // Show form instead of results after the last question
    }
  };

  const refreshSymptoms = () => {
    setPreviousSymptoms((prev) => [...prev, ...getSymptoms()]);
    setCurrentStepSymptoms([]);
  };

  const calculateResults = (filtered) => {
    const results = filtered.map((disease) => ({
      name: disease.disease,
      probability: (
        (selectedSymptoms.filter((symptom) =>
          disease.symptoms.includes(symptom)
        ).length /
          disease.symptoms.length) *
        100
      ).toFixed(2),
    }));
    setResults(results.sort((a, b) => b.probability - a.probability));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    try {
      // Simple validation
      if (!userData.name || !userData.email || !userData.phone) {
        setFormError("All fields are required!");
        return;
      }

      // Validate email format
      if (!/\S+@\S+\.\S+/.test(userData.email)) {
        setFormError("Invalid email format!");
        return;
      }

      // Validate phone number
      if (!/^\d{10}$/.test(userData.phone)) {
        setFormError("Phone number must be 10 digits!");
        return;
      }
      const response = await axios.post(`${backend}/api/v1/users/create-user`, userData)
      if (response.status === 200) {
        setFormError(""); // Clear errors if validation passes
        calculateResults(filteredDiseases); // Calculate results 
      }
    } catch (error) {
      console.log("Error while storing user", error);
    }
  };

  if (showForm && !results) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Provide Your Information</h1>
        <p className="text-gray-600">
          Please fill out the form below to view your results.
        </p>
        <form className="mt-4" onSubmit={handleFormSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Name</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={userData.name}
              onChange={(e) =>
                setUserData({ ...userData, name: e.target.value })
              }
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Email</label>
            <input
              type="email"
              className="w-full p-2 border rounded"
              value={userData.email}
              onChange={(e) =>
                setUserData({ ...userData, email: e.target.value })
              }
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Phone</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={userData.phone}
              onChange={(e) =>
                setUserData({ ...userData, phone: e.target.value })
              }
            />
          </div>
          {formError && <p className="text-red-500">{formError}</p>}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            View Your Result
          </button>
        </form>
      </div>
    );
  }

  if (results) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Your Results</h1>
        <p className="text-gray-600">Here are the most likely diseases:</p>
        <ul className="mt-4">
          {results.slice(0, 3).map((result, index) => (
            <li key={index} className="p-2 border rounded mb-2">
              <strong>{result.name}</strong>: {result.probability}% chance
            </li>
          ))}
        </ul>
        <p className="text-sm text-gray-500">
          Note: This is not a diagnosis. Consult a doctor for confirmation.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {step === 0 ? (
        <div className="bg-white p-6 rounded shadow-md">
          <h1 className="text-2xl font-bold">Welcome!</h1>
          <p className="text-gray-600">
            Do you want to check if you might have a disease? Let's start!
          </p>
          <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => setStep(1)}
          >
            Start
          </button>
        </div>
      ) : (
        <div>
          <h1 className="text-xl font-bold">{questions[step]}</h1>
          <div className="flex flex-wrap mt-4">
            {getSymptoms().map((symptom, index) => (
              <button
                key={index}
                className={`px-4 py-2 m-2 rounded ${currentStepSymptoms.includes(symptom)
                  ? "bg-green-500 text-white"
                  : "bg-gray-200"
                  }`}
                onClick={() => handleSymptomSelect(symptom)}
              >
                {symptom}
              </button>
            ))}
          </div>
          <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            onClick={nextStep}
            disabled={currentStepSymptoms.length === 0}
          >
            Next
          </button>
          <button
            className="mt-4 px-4 py-2 bg-green-500 ml-5 text-white rounded"
            onClick={refreshSymptoms}
          >
            None of the Above
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
