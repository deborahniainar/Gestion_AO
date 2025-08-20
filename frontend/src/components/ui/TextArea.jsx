import React, { forwardRef } from 'react';

const TextArea = forwardRef(({
  label,
  error,
  helperText,
  required = false,
  disabled = false,
  fullWidth = false,
  placeholder,
  value,
  onChange,
  onBlur,
  rows = 4,
  maxLength,
  showCharacterCount = false,
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'w-full px-3 py-2 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 resize-none';
  
  const stateClasses = error 
    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
    : 'border-gray-300 dark:border-gray-600 focus:ring-secondary focus:border-secondary';

  const classes = [
    baseClasses,
    stateClasses,
    disabled ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : 'bg-white dark:bg-gray-800',
    fullWidth ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ');

  const characterCount = value ? value.length : 0;

  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        ref={ref}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        className={classes}
        {...props}
      />
      
      <div className="flex justify-between items-center mt-1">
        {(error || helperText) && (
          <p className={`text-sm ${error ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'}`}>
            {error || helperText}
          </p>
        )}
        
        {showCharacterCount && maxLength && (
          <p className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
            {characterCount}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
});

TextArea.displayName = 'TextArea';

export default TextArea;
