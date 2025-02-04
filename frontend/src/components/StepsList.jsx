import React from "react";
import { CheckCircle, Circle, Loader, FileText, FilePlus } from "lucide-react";

const StepsList = ({ steps }) => {
  return (
    <div className="h-full bg-gray-900">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-gray-100">Build Steps</h2>
      </div>
      <div className="p-4 space-y-4" aria-live="polite">
        {steps.length === 0 ? <p className="text-gray-500">No steps available</p> : null}

        {steps.map((step, index) => {
          // Determine the correct icon based on step type and status
          const statusIcon =
            step.status === "completed" ? (
              <CheckCircle className="w-5 h-5 text-green-400" aria-label="Completed" />
            ) : step.status === "in-progress" ? (
              <Loader className="w-5 h-5 text-blue-400 animate-spin" aria-label="In Progress" />
            ) : (
              <Circle className="w-5 h-5 text-gray-500" aria-label="Pending" />
            );

          // Special icon for file creation steps
          const stepIcon = step.type === "CreateFile" ? (
            <FilePlus className="w-5 h-5 text-yellow-400" aria-label="File Created" />
          ) : (
            statusIcon
          );

          return (
            <div
              key={step.id || index}
              className="flex flex-col gap-2 p-4 rounded-lg bg-gray-800 hover:bg-gray-700 transition"
            >
              <div className="flex items-center gap-3">
                {stepIcon}
                <div>
                  <h3 className="font-medium text-gray-200">{step.name || step.title || "Untitled Step"}</h3>
                  {step.path && (
                    <p className="text-xs text-gray-400">{step.path}</p>
                  )}
                  {step.description && (
                    <p className="text-sm text-gray-400 mt-1">{step.description}</p>
                  )}
                </div>
              </div>

              {/* Show extracted file content in Build Steps */}
              {step.type === "CreateFile" && step.code && (
                <pre className="text-xs bg-gray-900 p-3 rounded-md overflow-auto text-gray-300 border border-gray-700">
                  <code>{step.code.slice(0, 500)}{step.code.length > 500 ? "..." : ""}</code>
                </pre>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepsList;
