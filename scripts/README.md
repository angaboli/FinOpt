# Scripts Finopt

Scripts utilitaires pour faciliter le développement et le déploiement de Finopt.

## Scripts de Setup

### `setup.sh` / `setup.bat`

Script d'installation automatique qui :
- Vérifie les prérequis (Docker, Node.js)
- Crée les fichiers `.env` depuis les exemples
- Installe les dépendances Node.js
- Build les images Docker

**Usage Linux/Mac:**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

**Usage Windows:**
```bash
scripts\setup.bat
```

## Scripts de Test

### `test-setup.sh` / `test-setup.bat`

Script de test qui vérifie que votre installation fonctionne correctement :
- Vérifie que Docker tourne
- Vérifie que les conteneurs sont lancés
- Teste les endpoints principaux de l'API
- Affiche un rapport de test

**Usage Linux/Mac:**
```bash
chmod +x scripts/test-setup.sh
./scripts/test-setup.sh
```

**Usage Windows:**
```bash
scripts\test-setup.bat
```

## Workflow Recommandé

### Premier setup

1. **Setup initial**
   ```bash
   ./scripts/setup.sh
   ```

2. **Éditer `.env`**
   - Ajouter DATABASE_URL (Neon)
   - Ajouter ANTHROPIC_API_KEY
   - Générer JWT_SECRET_KEY

3. **Démarrer les services**
   ```bash
   docker-compose up -d
   ```

4. **Tester l'installation**
   ```bash
   ./scripts/test-setup.sh
   ```

### Développement quotidien

```bash
# Démarrer
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down
```

## Autres Scripts (à venir)

- `backup-db.sh` : Backup de la base de données
- `restore-db.sh` : Restauration de la base de données
- `deploy.sh` : Script de déploiement
- `seed-data.sh` : Générer des données de test

## Contribution

Pour ajouter un nouveau script :

1. Créer le script dans `scripts/`
2. Rendre exécutable : `chmod +x scripts/your-script.sh`
3. Ajouter la documentation ici
4. Tester sur Linux/Mac ET Windows si applicable
5. Commit avec message explicite

## Notes

- Les scripts Bash (`.sh`) sont pour Linux/Mac
- Les scripts Batch (`.bat`) sont pour Windows
- Tous les scripts doivent être exécutés depuis la racine du projet
- Utiliser `set -e` dans les scripts Bash pour arrêter en cas d'erreur
- Ajouter des messages colorés pour meilleure lisibilité
