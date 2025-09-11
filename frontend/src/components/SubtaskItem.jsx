import React from 'react';
import { Edit, Delete } from "@mui/icons-material";

const SubtaskItem = ({ st, listeId, dragOverSubtaskId, handleDragStart, handleDragEnd, handleDragOver, handleDrop, onClickOpen, onEdit, onDelete }) => {
  return (
    <div
      key={st.id}
      className={`group flex items-center justify-between bg-white dark:bg-primary border ${dragOverSubtaskId === st.id ? 'border-secondary' : 'border-muted-50'} rounded-md px-3 py-2 text-sm shadow-sm`}
      draggable
      onDragStart={() => handleDragStart(listeId, st.id)}
      onDragEnd={handleDragEnd}
      onDragOver={(e) => handleDragOver(listeId, st.id, e)}
      onDrop={() => handleDrop(listeId, st.id)}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <input
          type="checkbox"
          aria-label="Marquer comme terminé"
          checked={!!st.done}
          onChange={(e) => e.stopPropagation()}
          className="h-4 w-4 accent-secondary opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        />
        <span
          className={`truncate cursor-pointer hover:underline ${st.done ? 'line-through text-gray-400' : ''}`}
          onClick={(e) => { e.stopPropagation(); onClickOpen(listeId, st); }}
          title="Ouvrir l'espace de travail"
        >
          {st.titre}
        </span>
      </div>
      <div className="flex items-center gap-1 ml-2">
        <button onClick={(e) => { e.stopPropagation(); onEdit(listeId, st.id); }} className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-gray-200/70 text-gray-700" title="Modifier">
          <Edit fontSize="small" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(listeId, st.id); }} className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-red-50 text-red-600" title="Supprimer">
          <Delete fontSize="small" />
        </button>
      </div>
    </div>
  );
};

export default SubtaskItem;
