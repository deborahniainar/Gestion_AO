FROM python:3.11-slim

# Crée un utilisateur non-root pour éviter les problèmes de permission
RUN useradd -m appuser

WORKDIR /app

# Copie requirements et installe
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copie le reste de l'application
COPY . .

# Change le propriétaire des fichiers
RUN chown -R appuser:appuser /app

# Switch vers l'utilisateur non-root
USER appuser

# Commande par défaut (peut être surchargée par docker-compose)
CMD ["uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]
