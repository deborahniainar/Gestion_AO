import React from 'react';

const ProgressBar = ({
  progress = 0,
  steps = [],
  currentStep = 1,
  showStepIndicator = true,
  className = '',
  ...props
}) => {
  return (
    <div className={`mb-6 ${className}`} {...props}>
      {/* Barre de progression */}
      <div className="mb-4 relative">
        <div className="h-5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Indicateur d'étape */}
      {showStepIndicator && steps.length > 0 && (
        <div className="flex items-center">
          <div className="flex items-center justify-center w-8 h-8 bg-gray-600 rounded-full text-secondary-50 font-bold text-base mr-3">
            {currentStep}
          </div>
          <span className="font-semibold text-secondary-50 text-base">
            {steps[currentStep - 1]}
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
