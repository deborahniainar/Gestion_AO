# DocumentViewer - Composant de Visualisation de Documents

Un composant React réutilisable pour visualiser différents types de documents dans une modal élégante.

## 📋 Fonctionnalités

- ✅ **Visualisation PDF** : Iframe intégrée avec scroll
- ✅ **Visualisation d'images** : JPG, PNG, GIF, WebP, SVG
- ✅ **Support multi-formats** : Word, Excel, PowerPoint, Archives, Texte
- ✅ **Interface adaptive** : Aperçu ou téléchargement selon le type
- ✅ **Raccourcis clavier** : Fermeture avec `Escape`
- ✅ **Design responsive** : Mobile et desktop
- ✅ **Mode sombre** : Compatibilité dark mode
- ✅ **Téléchargement** : Bouton de téléchargement intégré

## 🚀 Utilisation

### Import
```jsx
import DocumentViewer from '../components/DocumentViewer';
```

### Utilisation basique
```jsx
const MyComponent = () => {
  const [showViewer, setShowViewer] = useState(false);
  const [currentDoc, setCurrentDoc] = useState(null);

  const handleViewDocument = (document) => {
    setCurrentDoc(document);
    setShowViewer(true);
  };

  return (
    <div>
      {/* Bouton pour ouvrir le document */}
      <button onClick={() => handleViewDocument(myDocument)}>
        Voir le document
      </button>

      {/* Composant de visualisation */}
      <DocumentViewer
        isOpen={showViewer}
        document={currentDoc}
        onClose={() => setShowViewer(false)}
      />
    </div>
  );
};
```

## 📊 Props

| Prop | Type | Requis | Description |
|------|------|--------|-------------|
| `isOpen` | `boolean` | ✅ | Contrôle l'ouverture/fermeture de la modal |
| `document` | `object` | ✅ | Objet document à visualiser |
| `onClose` | `function` | ✅ | Callback appelé lors de la fermeture |

## 📄 Structure de l'objet Document

```javascript
const document = {
  // Nom affiché (priorité si présent)
  original_filename: "Mon_CV.pdf",
  
  // Nom du fichier (fallback)
  filename: "abc123.pdf", 
  
  // URL du fichier (REQUIS)
  url: "/api/uploads/personnels/abc123.pdf",
  
  // Date de création (optionnel)
  created_at: "2024-01-15T10:30:00Z"
};
```

## 🎨 Types de fichiers supportés

### 📄 Aperçu direct
- **PDF** : `pdf`
- **Images** : `jpg`, `jpeg`, `png`, `gif`, `webp`, `svg`
- **Texte** : `txt`

### 📋 Téléchargement avec infos
- **Word** : `doc`, `docx`
- **Excel** : `xls`, `xlsx` 
- **PowerPoint** : `ppt`, `pptx`
- **Archives** : `zip`, `rar`, `7z`
- **Autres** : types non reconnus

## ⌨️ Raccourcis clavier

- `Escape` : Fermer la modal
- Clic sur l'overlay : Fermer la modal

## 🎯 Exemples d'utilisation dans le projet

### 1. Page Personnels
```jsx
// Dans handleOpenDocumentModal
const handleViewCV = (cvDocument) => {
  setCurrentDocument(cvDocument);
  setShowDocumentModal(true);
};

<DocumentViewer
  isOpen={showDocumentModal}
  document={currentDocument}
  onClose={() => setShowDocumentModal(false)}
/>
```

### 2. Page Matériels (exemple)
```jsx
// Peut être utilisé pour visualiser les fiches techniques
<DocumentViewer
  isOpen={showMaterielDoc}
  document={selectedMaterielDoc}
  onClose={() => setShowMaterielDoc(false)}
/>
```

### 3. Page Documents (exemple)
```jsx
// Peut être utilisé pour visualiser les documents administratifs
<DocumentViewer
  isOpen={showDocument}
  document={selectedDocument}
  onClose={() => setShowDocument(false)}
/>
```

## 🔧 Customisation

Le composant utilise Tailwind CSS et peut être facilement customisé en modifiant les classes CSS. Il est compatible avec le mode sombre via les classes `dark:`.

## 🐛 Gestion d'erreurs

- Images qui ne se chargent pas : Message d'erreur affiché
- Documents inexistants : Composant ne s'affiche pas
- Types non supportés : Interface de téléchargement avec informations

## 📱 Responsive

Le composant est entièrement responsive :
- **Mobile** : Modal plein écran avec padding réduit
- **Tablet** : Modal adaptée à la taille d'écran
- **Desktop** : Modal avec taille maximale optimisée
