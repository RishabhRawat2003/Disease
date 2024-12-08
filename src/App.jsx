import React, { useState } from "react";
import { diseases } from "./diseases"; // Importing diseases data from diseases.js

const App = () => {
  const [step, setStep] = useState(0); // Track current question
  const [selectedSymptoms, setSelectedSymptoms] = useState([]); // Track selected symptoms
  const [currentStepSymptoms, setCurrentStepSymptoms] = useState([]); // Track symptoms for the current step
  const [filteredDiseases, setFilteredDiseases] = useState(diseases); // Filtered diseases after each step
  const [results, setResults] = useState(null); // Store the final results

  // Define the questions that the user will answer
  const questions = [
    "Do you experience any of these common symptoms?",
    "Do you also experience any of these more specific symptoms?",
    "Are you noticing these symptoms?",
    "Any of these uncommon symptoms?",
    "Finally, do you have these rare symptoms?"
  ];

  // Get a list of symptoms based on the filtered diseases
  const getSymptoms = () => {
    const symptomsSet = new Set();
    filteredDiseases.forEach((disease) => {
      disease.symptoms.forEach((symptom) => symptomsSet.add(symptom));
    });

    // Exclude symptoms that are already selected
    const availableSymptoms = Array.from(symptomsSet).filter(
      (symptom) => !selectedSymptoms.includes(symptom)
    );

    // Limit to 5-7 symptoms for each question
    return availableSymptoms.slice(0, 15);
  };

  // Handle symptom selection for the current step
  const handleSymptomSelect = (symptom) => {
    setCurrentStepSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  // Move to the next question and filter diseases based on selected symptoms
  const nextStep = () => {
    // After the first step, update selectedSymptoms with the symptoms from currentStepSymptoms
    setSelectedSymptoms((prev) => [...prev, ...currentStepSymptoms]);
    setCurrentStepSymptoms([]); // Clear current step symptoms

    // Filter diseases based on the selected symptoms after each step
    const newFiltered = filteredDiseases.filter((disease) =>
      [...selectedSymptoms, ...currentStepSymptoms].some((symptom) =>
        disease.symptoms.includes(symptom)
      )
    );
    setFilteredDiseases(newFiltered);

    if (step < questions.length - 1) {
      setStep(step + 1); // Go to next question
    } else {
      calculateResults(newFiltered); // Calculate final results after the last question
    }
  };

  // Calculate results (diseases ranked by probability)
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
    setResults(results.sort((a, b) => b.probability - a.probability)); // Sort diseases by probability
  };

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
                className={`px-4 py-2 m-2 rounded ${
                  currentStepSymptoms.includes(symptom)
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
        </div>
      )}
    </div>
  );
};

export default App;

