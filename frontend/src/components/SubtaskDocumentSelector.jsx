import React from 'react';

const SubtaskDocumentSelector = ({ open, onClose, onSelect }) => {
  if (!open) return null;

  const options = [
    { key: 'docx', label: 'Document Word' },
    { key: 'xlsx', label: 'Feuille Excel' },
    { key: 'pptx', label: 'Présentation' },
    { key: 'pdf', label: 'Formulaire PDF' },
    { key: 'upload', label: 'Uploader un fichier' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white dark:bg-primary border border-muted-50 rounded-lg shadow-xl">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h6 className="text-sm font-semibold text-secondary">Choisir type de document</h6>
          <button onClick={onClose} className="h-8 w-8 rounded hover:bg-gray-100 dark:hover:bg-primary/40">×</button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-2">
          {options.map(opt => (
            <button
              key={opt.key}
              onClick={() => onSelect(opt.key)}
              className="px-3 py-2 rounded bg-secondary hover:bg-secondary/90 text-white text-sm"
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="px-5 py-4 border-t flex justify-end">
          <button onClick={onClose} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm">Annuler</button>
        </div>
      </div>
    </div>
  );
};

export default SubtaskDocumentSelector;
