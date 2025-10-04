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
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                index < currentStep
                  ? "bg-green-500 text-white"
                  : index === currentStep - 1
                  ? "bg-blue-500 text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              {index + 1}
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700">
              {stepName}
            </span>
            {index < totalSteps - 1 && (
              <div
                className={`flex-1 h-0.5 mx-4 ${
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
