
import React, { useEffect } from "react";
import { CheckCircle, Circle, Loader } from "lucide-react";

const StepsList = ({ steps }) => {
  useEffect(() => {
  }, [steps]);

  return (
    <div className="h-full bg-gray-900">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-gray-100">Build Steps</h2>
      </div>
      <div className="p-4" aria-live="polite">
        {steps.length === 0 ? <p className="text-gray-500">No steps available</p> : null}
        {steps.map((step, index) => {
          const statusIcon =
            step.status === "completed" ? (
              <CheckCircle className="w-5 h-5 text-green-400" aria-label="Completed" />
            ) : step.status === "in-progress" ? (
              <Loader className="w-5 h-5 text-blue-400 animate-spin" aria-label="In Progress" />
            ) : (
              <Circle className="w-5 h-5 text-gray-500" aria-label="Pending" />
            );

          return (
            <div
              key={step.id || index}
              className="flex items-start gap-3 mb-4 p-3 rounded-lg hover:bg-gray-800"
            >
              {statusIcon}
              <div>
                <h3 className="font-medium text-gray-200">{step.title || "Untitled Step"}</h3>
                {step.description && (
                  <p className="text-sm text-gray-400 mt-1">{step.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepsList;
