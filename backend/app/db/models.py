from sqlalchemy import Column, String, Date, DateTime, Numeric, Integer, BigInteger, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base


soumission_documents = Table(
    "soumission_documents",
    Base.metadata,
    Column("id_document", BigInteger, ForeignKey("documents.id", ondelete="CASCADE"), primary_key=True),
    Column("id_soumission", BigInteger, ForeignKey("soumissions.id", ondelete="CASCADE"), primary_key=True),
)


class User(Base):
    __tablename__ = "user"
    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False, unique=True, index=True)
    email_verified_at = Column(DateTime, nullable=True)
    password = Column(String(100), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    appels_offre = relationship("AppelOffre", back_populates="user")
    soumissions = relationship("Soumission", back_populates="user")


class Client(Base):
    __tablename__ = "client"
    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    adress = Column(String(100), nullable=True)
    phone_number = Column(String(100), nullable=True)
    email = Column(String(100), nullable=True)
    appels_offre = relationship("AppelOffre", back_populates="client")


class AppelOffre(Base):
    __tablename__ = "appels_offre"
    id = Column(BigInteger, primary_key=True, index=True)
    reference = Column(String(100), nullable=False, index=True)
    objet = Column(String(100), nullable=True)
    date_limite = Column(Date, nullable=True)
    status = Column(String(20), nullable=True)
    id_client = Column(BigInteger, ForeignKey("client.id"), nullable=True, index=True)
    id_user = Column(BigInteger, ForeignKey("user.id"), nullable=True, index=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    client = relationship("Client", back_populates="appels_offre")
    user = relationship("User", back_populates="appels_offre")
    soumissions = relationship("Soumission", back_populates="appel_offre")


class Specialite(Base):
    __tablename__ = "specialites"
    id = Column(BigInteger, primary_key=True, index=True)
    nom = Column(String(100), nullable=False)
    personnels = relationship("Personnel", back_populates="specialite")


class Personnel(Base):
    __tablename__ = "personnels"
    id = Column(BigInteger, primary_key=True, index=True)
    nom = Column(String(200), nullable=False)
    disponibilite = Column(Date, nullable=True)
    id_specialite = Column(BigInteger, ForeignKey("specialites.id"), nullable=True, index=True)
    specialite = relationship("Specialite", back_populates="personnels")


class Poste(Base):
    __tablename__ = "postes"
    id = Column(BigInteger, primary_key=True, index=True)
    code = Column(String(100), nullable=False)
    name = Column(String(100), nullable=False)
    details = relationship("SoumissionDetail", back_populates="poste")
    prix_references = relationship("PrixReference", back_populates="poste")


class Fournisseur(Base):
    __tablename__ = "fournisseurs"
    id = Column(BigInteger, primary_key=True, index=True)
    nom = Column(String(255), nullable=False)
    contact_nom = Column(String(255), nullable=True)
    contact_mail = Column(String(255), nullable=True)
    contact_phone = Column(String(255), nullable=True)
    adresse = Column(String(255), nullable=True)
    ville = Column(String(255), nullable=True)
    pays = Column(String(255), nullable=True)
    note = Column(String(255), nullable=True)
    materiels = relationship("Materiel", back_populates="fournisseur")
    prix_references = relationship("PrixReference", back_populates="fournisseur")


class Materiel(Base):
    __tablename__ = "materiels"
    id = Column(BigInteger, primary_key=True, index=True)
    reference = Column(String(100), nullable=False)
    quantite = Column(Integer, nullable=False, default=0)
    localisation = Column(String(100), nullable=True)
    etat = Column(String(100), nullable=True)
    id_fournisseur = Column(BigInteger, ForeignKey("fournisseurs.id"), nullable=True, index=True)
    fournisseur = relationship("Fournisseur", back_populates="materiels")


class PrixReference(Base):
    __tablename__ = "prix_reference"
    id = Column(BigInteger, primary_key=True, index=True)
    id_poste = Column(BigInteger, ForeignKey("postes.id"), nullable=False, index=True)
    prix = Column(Numeric(19, 2), nullable=False)
    updated_at = Column(Date, nullable=True)
    id_fournisseur = Column(BigInteger, ForeignKey("fournisseurs.id"), nullable=True, index=True)
    poste = relationship("Poste", back_populates="prix_references")
    fournisseur = relationship("Fournisseur", back_populates="prix_references")


class Soumission(Base):
    __tablename__ = "soumissions"
    id = Column(BigInteger, primary_key=True, index=True)
    delai_validite = Column(Date, nullable=True)
    id_appel_offre = Column(BigInteger, ForeignKey("appels_offre.id"), nullable=True, index=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    id_user = Column(BigInteger, ForeignKey("user.id"), nullable=True, index=True)
    appel_offre = relationship("AppelOffre", back_populates="soumissions")
    user = relationship("User", back_populates="soumissions")
    details = relationship("SoumissionDetail", back_populates="soumission", cascade="all, delete-orphan")
    documents = relationship("Document", secondary=soumission_documents, back_populates="soumissions")


class SoumissionDetail(Base):
    __tablename__ = "soumission_details"
    id = Column(BigInteger, primary_key=True, index=True)
    quantite = Column(Numeric(19, 2), nullable=False)
    prix_unitaire = Column(Numeric(19, 2), nullable=False)
    id_soumission = Column(BigInteger, ForeignKey("soumissions.id"), nullable=False, index=True)
    id_poste = Column(BigInteger, ForeignKey("postes.id"), nullable=False, index=True)
    soumission = relationship("Soumission", back_populates="details")
    poste = relationship("Poste", back_populates="details")


class Document(Base):
    __tablename__ = "documents"
    id = Column(BigInteger, primary_key=True, index=True)
    type = Column(String(100), nullable=False)
    filename = Column(String(100), nullable=False)
    expire_at = Column(Date, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    soumissions = relationship("Soumission", secondary=soumission_documents, back_populates="documents")

