interface StepperProps {
  currentStep: number;
  totalSteps: number;
  stepNames: string[];
}

export default function Stepper({
  currentStep,
  totalSteps,
  stepNames,
}: StepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {stepNames.map((stepName, index) => (
          <div key={index} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all duration-300 transform ${
                index < currentStep
                  ? "bg-green-500 text-white scale-110 shadow-lg"
                  : index === currentStep - 1
                  ? "bg-blue-500 text-white scale-125 shadow-xl ring-4 ring-blue-200"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              {index < currentStep ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            <span
              className={`ml-2 text-sm font-medium transition-colors duration-300 ${
                index === currentStep - 1
                  ? "text-blue-600 font-semibold"
                  : "text-gray-700"
              }`}
            >
              {stepName}
            </span>
            {index < totalSteps - 1 && (
              <div
                className={`flex-1 h-0.5 mx-4 transition-all duration-500 ${
                  index < currentStep - 1 ? "bg-green-500" : "bg-gray-300"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
