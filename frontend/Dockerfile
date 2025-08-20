FROM node:20-slim

# Crée un utilisateur non-root
RUN useradd -m nodeuser

WORKDIR /app

# Copie package.json et package-lock.json
COPY package*.json ./

# Installe les dépendances
RUN npm install

# Copie le reste de l'application
COPY . .

# Change le propriétaire des fichiers
RUN chown -R nodeuser:nodeuser /app

# Switch vers l'utilisateur non-root
USER nodeuser

# Commande par défaut (peut être surchargée par docker-compose)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
