from sqlalchemy import Column, String, Date, DateTime, Numeric, Integer, BigInteger, ForeignKey, Table, Text, Boolean
from sqlalchemy import Enum as SAEnum
from enum import Enum as PyEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base


soumission_documents = Table(
    "soumission_documents",
    Base.metadata,
    Column("id_document", Integer, ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True),
    Column("id_soumission", Integer, ForeignKey("soumissions.id", ondelete="CASCADE"), primary_key=True),
)


appeloffre_documents = Table(
    "appeloffre_documents",
    Base.metadata,
    Column("id_document", Integer, ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True),
    Column("id_appel_offre", Integer, ForeignKey("appels_offre.id", ondelete="CASCADE"), primary_key=True),
)

# Association documents ↔ materiels
materiel_documents = Table(
    "materiel_documents",
    Base.metadata,
    Column("id_document", Integer, ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True),
    Column("id_materiel", Integer, ForeignKey("materiels.id", ondelete="CASCADE"), primary_key=True),
)

# Association documents ↔ personnels
personnel_documents = Table(
    "personnel_documents",
    Base.metadata,
    Column("id_document", Integer, ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True),
    Column("id_personnel", Integer, ForeignKey("personnels.id", ondelete="CASCADE"), primary_key=True),
)
class AppelOffreStatus(PyEnum):
    EN_COURS = "en_cours"
    SOUMIS = "soumis"
    ATTRIBUE = "attribue"
    PERDU = "perdu"


class Admin(Base):
    __tablename__ = "admins"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(100), nullable=False, unique=True, index=True)
    password = Column(String(100), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    appels_offre = relationship("AppelOffre", back_populates="admin")
    soumissions = relationship("Soumission", back_populates="admin")


class Client(Base):
    __tablename__ = "client"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    adress = Column(String(100), nullable=True)
    phone_number = Column(String(100), nullable=True)
    email = Column(String(100), nullable=True)
    appels_offre = relationship("AppelOffre", back_populates="client")


class AppelOffre(Base):
    __tablename__ = "appels_offre"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    reference = Column(String(100), nullable=False, index=True)
    objet = Column(String(100), nullable=True)
    date_limite = Column(Date, nullable=True)
    status = Column(SAEnum(AppelOffreStatus, name="appels_offre_status"), nullable=False, default=AppelOffreStatus.EN_COURS)
    id_client = Column(Integer, ForeignKey("client.id"), nullable=True, index=True)
    id_admin = Column(Integer, ForeignKey("admins.id"), nullable=True, index=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    client = relationship("Client", back_populates="appels_offre")
    admin = relationship("Admin", back_populates="appels_offre")
    soumissions = relationship("Soumission", back_populates="appel_offre")
    documents = relationship("Document", secondary=appeloffre_documents, back_populates="appels_offre")


class Specialite(Base):
    __tablename__ = "specialites"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nom = Column(String(100), nullable=False)
    # personnels = relationship("Personnel", back_populates="specialite")


class Personnel(Base):
    __tablename__ = "personnels"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nom = Column(String(200), nullable=False)
    prenom = Column(String(200), nullable=False)
    profile_image = Column(String(255), nullable=True)
    fonction = Column(String(100), nullable=True)
    experience_annees = Column(Integer, nullable=True)
    formation = Column(String(255), nullable=True)
    nationalite = Column(String(100), nullable=True)
    date_naissance = Column(Date, nullable=True)
    salaire_mensuel = Column(Numeric(19, 2), nullable=True)
    contact = Column(String(50), nullable=True)
    genre = Column(String(20), nullable=True)
    status = Column(String(50), nullable=True)
    # disponibilite = Column(Date, nullable=True)
    # id_specialite = Column(Integer, ForeignKey("specialites.id"), nullable=True, index=True)
    # specialite = relationship("Specialite", back_populates="personnels")
    # Pièces jointes
    documents = relationship("Document", secondary=personnel_documents, back_populates="personnels")


class Poste(Base):
    __tablename__ = "postes"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    code = Column(String(100), nullable=False)
    name = Column(String(100), nullable=False)
    details = relationship("SoumissionDetail", back_populates="poste")
    prix_references = relationship("PrixReference", back_populates="poste")


class Fournisseur(Base):
    __tablename__ = "fournisseurs"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nom = Column(String(255), nullable=False)
    contact_nom = Column(String(255), nullable=True)
    contact_mail = Column(String(255), nullable=True)
    contact_phone = Column(String(255), nullable=True)
    adresse = Column(String(255), nullable=True)
    ville = Column(String(255), nullable=True)
    pays = Column(String(255), nullable=True)
    note = Column(String(255), nullable=True)
    # materiels = relationship("Materiel", back_populates="fournisseur")
    prix_references = relationship("PrixReference", back_populates="fournisseur")


class Materiel(Base):
    __tablename__ = "materiels"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    designation = Column(String(255), nullable=False)
    nombre = Column(Integer, nullable=False, default=0)
    marque = Column(String(100), nullable=True)
    modele = Column(String(100), nullable=True)
    annee = Column(Integer, nullable=True)
    qualite = Column(String(100), nullable=True)
    # id_fournisseur = Column(Integer, ForeignKey("fournisseurs.id"), nullable=True, index=True)
    # fournisseur = relationship("Fournisseur", back_populates="materiels")
    documents = relationship("Document", secondary=materiel_documents, back_populates="materiels")


class PrixReference(Base):
    __tablename__ = "prix_reference"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_poste = Column(Integer, ForeignKey("postes.id"), nullable=False, index=True)
    prix = Column(Numeric(19, 2), nullable=False)
    updated_at = Column(Date, nullable=True)
    id_fournisseur = Column(Integer, ForeignKey("fournisseurs.id"), nullable=True, index=True)
    poste = relationship("Poste", back_populates="prix_references")
    fournisseur = relationship("Fournisseur", back_populates="prix_references")


class Soumission(Base):
    __tablename__ = "soumissions"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    delai_validite = Column(Date, nullable=True)
    id_appel_offre = Column(Integer, ForeignKey("appels_offre.id"), nullable=True, index=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    id_admin = Column(Integer, ForeignKey("admins.id"), nullable=True, index=True)
    appel_offre = relationship("AppelOffre", back_populates="soumissions")
    admin = relationship("Admin", back_populates="soumissions")
    details = relationship("SoumissionDetail", back_populates="soumission", cascade="all, delete-orphan")
    documents = relationship("Document", secondary=soumission_documents, back_populates="soumissions")


class SoumissionDetail(Base):
    __tablename__ = "soumission_details"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    quantite = Column(Numeric(19, 2), nullable=False)
    prix_unitaire = Column(Numeric(19, 2), nullable=False)
    id_soumission = Column(Integer, ForeignKey("soumissions.id"), nullable=False, index=True)
    id_poste = Column(Integer, ForeignKey("postes.id"), nullable=False, index=True)
    soumission = relationship("Soumission", back_populates="details")
    poste = relationship("Poste", back_populates="details")


class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    type = Column(String(100), nullable=False)
    filename = Column(String(100), nullable=False)
    original_name = Column(String(255), nullable=True)  # Nom donné par l'utilisateur
    original_filename = Column(String(255), nullable=True)  # Nom original du fichier uploadé
    expire_at = Column(Date, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    soumissions = relationship("Soumission", secondary=soumission_documents, back_populates="documents")
    appels_offre = relationship("AppelOffre", secondary=appeloffre_documents, back_populates="documents")
    personnels = relationship("Personnel", secondary=personnel_documents, back_populates="documents")
    materiels = relationship("Materiel", secondary=materiel_documents, back_populates="documents")


# --- Nouveaux modèles pour les workspaces de soumissions (lots, tâches, sous-tâches) ---
class Lot(Base):
    __tablename__ = "soumission_lots"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    appel_offre = Column(String(255), nullable=False, index=True)
    titre = Column(String(255), nullable=False, index=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    tasks = relationship("Task", back_populates="lot", cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "soumission_tasks"
    # IDs ici sont des UUID strings générés côté frontend; on accepte String primary key
    id = Column(String(64), primary_key=True, index=True)
    titre = Column(String(255), nullable=False)
    ordre = Column(Integer, nullable=True, default=0)
    id_lot = Column(Integer, ForeignKey("soumission_lots.id", ondelete="CASCADE"), nullable=False, index=True)

    lot = relationship("Lot", back_populates="tasks")
    subtasks = relationship("Subtask", back_populates="task", cascade="all, delete-orphan")


class Subtask(Base):
    __tablename__ = "soumission_subtasks"
    id = Column(String(64), primary_key=True, index=True)
    titre = Column(String(255), nullable=False)
    done = Column(Boolean, nullable=False, default=False)
    ordre = Column(Integer, nullable=True, default=0)
    content_markdown = Column(Text, nullable=True)
    id_task = Column(String(64), ForeignKey("soumission_tasks.id", ondelete="CASCADE"), nullable=False, index=True)

    task = relationship("Task", back_populates="subtasks")

