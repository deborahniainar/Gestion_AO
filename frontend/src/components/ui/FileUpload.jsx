import React, { useRef } from 'react';
import { CloudUpload } from '@mui/icons-material';
import Button from './Button';

const FileUpload = ({
  onFileSelect,
  onError,
  acceptedTypes = ['.pdf', '.docx'],
  maxSize = 10 * 1024 * 1024, // 10MB par défaut
  multiple = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const file = files[0]; // Prendre le premier fichier si multiple = false

    // Validation du type de fichier
    const isValidType = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type);
      }
      return file.type === type;
    });

    if (!isValidType) {
      const errorMessage = `Format non supporté. Formats autorisés : ${acceptedTypes.join(', ')}`;
      onError?.(errorMessage);
      return;
    }

    // Validation de la taille
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      const errorMessage = `Fichier trop volumineux. Taille maximale : ${maxSizeMB}MB`;
      onError?.(errorMessage);
      return;
    }

    onFileSelect?.(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const event = { target: { files } };
      handleFileChange(event);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className} {...props}>
      <div
        className={`p-6 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 hover:border-secondary transition-colors duration-200 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={openFileDialog}
      >
        <div className="text-center">
          <CloudUpload className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            Glissez / déposez votre fichier ici ou cliquez pour sélectionner
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={acceptedTypes.join(',')}
            multiple={multiple}
            onChange={handleFileChange}
            disabled={disabled}
          />

          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              openFileDialog();
            }}
            disabled={disabled}
          >
            Sélectionner un fichier
          </Button>

          <p className="text-sm text-gray-500 mt-2">
            Formats acceptés : {acceptedTypes.join(', ')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
