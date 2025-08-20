import React from 'react';

const WorkflowStep = ({
  step,
  title,
  subtitle,
  image,
  isActive = false,
  isCompleted = false,
  children,
  className = '',
  ...props
}) => {
  const getStepStatus = () => {
    if (isCompleted) return 'completed';
    if (isActive) return 'active';
    return 'pending';
  };

  const status = getStepStatus();

  const statusClasses = {
    completed: 'bg-green-500 text-white',
    active: 'bg-secondary text-white',
    pending: 'bg-gray-300 text-gray-600'
  };

  return (
    <div className={`workflow-step ${className}`} {...props}>
      <div className="flex">
        {/* Image de l'étape */}
        <div className="flex-1 text-center">
          <img 
            src={image} 
            alt={title} 
            className={`w-full h-full object-cover rounded-l-lg transition-opacity duration-300 ${
              isActive ? 'opacity-100' : 'opacity-50'
            }`} 
          />
        </div>

        {/* Contenu de l'étape */}
        <div className="flex-1 p-6">
          {/* En-tête de l'étape */}
          <div className="flex items-center mb-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm mr-3 ${statusClasses[status]}`}>
              {isCompleted ? '✓' : step}
            </div>
            <div>
              <h3 className={`font-bold text-xl ${isActive ? 'text-primary' : 'text-gray-600'}`}>
                {title}
              </h3>
              {subtitle && (
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Contenu de l'étape */}
          <div className={`transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-75'}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowStep;
