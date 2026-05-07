# Finopt Roadmap

## Etat actuel

V1 et V2 sont deja livrees.

- V1: squelette monorepo, backend FastAPI Clean Architecture, auth email/mot de passe avec access token JWT et refresh token revocable, frontend Expo minimal, CI, Docker, outillage qualite.
- V2: port initial de la charte Figma vers React Native, onboarding mobile, home dashboard enrichi, multi-account switcher mocke, transactions recentes mockees, bottom navigation.

Il reste les versions ci-dessous pour atteindre l'application complete du cahier des charges.

## V3 - Comptes Multi-Comptes Reels

Objectif: remplacer les comptes mockes par une vraie gestion multi-comptes persistante.

Backend:
- Ajouter l'entite domaine `Account` avec invariants: nom non vide, type autorise, devise, solde initial.
- Ajouter ports `AccountRepository` et use cases async: create, list, update, delete.
- Ajouter modeles SQLAlchemy, migration Alembic et routes FastAPI `/accounts`.
- Isoler les DTOs API des entites domaine.

Frontend:
- Ajouter client API comptes, store Zustand ou hooks applicatifs dedies.
- Brancher `AccountSwitcher` et Home sur l'API.
- Ajouter ecrans liste comptes et creation compte portes depuis Figma.
- Gerer loading, empty state, erreurs et refresh apres creation.

Tests:
- Tests unitaires domaine/use cases comptes.
- Tests integration API `/accounts`.
- Tests composants `AccountSwitcher`, liste comptes, creation compte.

Sortie attendue:
- Un utilisateur authentifie peut creer, consulter, modifier et supprimer ses comptes.
- Les donnees affichees sur Home viennent du backend.

## V4 - Revenus et Categories

Objectif: poser la base budgetaire: sources de revenus et categories utilisateur.

Backend:
- Ajouter `IncomeSource` avec periodicite et montant.
- Ajouter `Category` liee a l'utilisateur, avec categories par defaut a la creation du profil.
- Ajouter repositories, use cases CRUD et migrations.
- Ajouter routes `/income-sources` et `/categories`.

Frontend:
- Porter les ecrans revenus Figma.
- Ajouter gestion des categories dans les formulaires transaction/budget.
- Ajouter composants de selection reutilisables.

Tests:
- Tests unitaires periodicite/revenus/categories.
- Tests API CRUD.
- Tests composants et hooks revenus/categories.

Sortie attendue:
- L'utilisateur peut declarer ses revenus et disposer de categories exploitables par les transactions.

## V5 - Transactions

Objectif: construire le coeur de suivi budgetaire.

Backend:
- Ajouter `Transaction` liee a `Account` et `Category`.
- Ajouter invariants montant/date/type, filtrage par compte, date, categorie.
- Ajouter CRUD transactions et ajustement de solde selon les regles choisies.
- Ajouter routes `/transactions` avec pagination et filtres.

Frontend:
- Brancher la liste transactions Figma sur l'API.
- Ajouter creation transaction, edition, suppression.
- Mettre a jour Home avec transactions recentes et soldes reels.
- Ajouter filtres rapides par compte/date/categorie.

Tests:
- Tests unitaires entite/use cases transactions.
- Tests integration endpoints avec filtres.
- Tests composants formulaire et liste.

Sortie attendue:
- L'utilisateur peut gerer ses transactions et voir les soldes/flux se mettre a jour.

## V6 - Budget Mensuel et Dashboard Analytique

Objectif: rendre le dashboard vraiment budgetaire, pas seulement transactionnel.

Backend:
- Ajouter `Budget` par mois/annee avec revenus prevus et depenses prevues par categorie.
- Ajouter generation manuelle puis generation assistee depuis revenus/depenses passees.
- Ajouter endpoints budget courant, historique et comparaison prevu/reel.

Frontend:
- Porter les cartes dashboard Figma: solde restant, repartition categories, cash flow.
- Ajouter donut chart ou visualisation RN compatible.
- Ajouter creation/edition budget mensuel.

Tests:
- Tests calcul prevu/reel.
- Tests API budget.
- Tests composants dashboard et graphiques.

Sortie attendue:
- L'utilisateur comprend son budget mensuel, l'ecart prevu/reel et les postes principaux.

## V7 - Import Releves Bancaires

Objectif: accelerer la saisie par import de releves.

Backend:
- Ajouter `BankImport` et port `BankStatementParser`.
- Ajouter adaptateurs CSV/Excel en premier, puis PDF si faisable.
- Ajouter workflow upload, parsing, preview, validation.
- Ajouter detection des doublons.

Frontend:
- Ajouter ecran import, preview des lignes, selection compte/categorie, validation.
- Ajouter feedback erreurs fichier et progression.

Tests:
- Tests parsers par format avec fichiers fixtures.
- Tests use case preview/validation.
- Tests API upload.

Sortie attendue:
- L'utilisateur peut importer un releve, verifier les lignes, puis creer les transactions.

## V8 - Scan Ticket OCR

Objectif: ajouter la capture de tickets et la structuration des depenses.

Backend:
- Ajouter `Receipt` et items de ticket.
- Definir ports `OcrService` et `ReceiptExtractionService`.
- Ajouter adaptateurs mock/test et adaptateur OpenAI/Google Vision/Tesseract selon configuration.
- Ajouter routes upload image, extraction, liaison transaction.

Frontend:
- Ajouter ecran scan ticket avec Expo camera/media picker.
- Ajouter preview OCR, correction manuelle, liaison transaction.

Tests:
- Tests services IA/OCR avec mocks.
- Tests use cases receipt.
- Tests composants scan/preview hors camera native.

Sortie attendue:
- L'utilisateur peut scanner un ticket et transformer les donnees extraites en transaction verifiable.

## V9 - Conseils IA et Objectifs d'Epargne

Objectif: livrer la valeur "optimisation" de Finopt.

Backend:
- Ajouter `SavingsGoal` CRUD et suivi progression.
- Ajouter `BudgetAdvice` stocke.
- Definir port `AiAdviceService`.
- Ajouter use case `GenerateMonthlyAdvice` base sur budget, transactions, revenus et objectifs.
- Ajouter garde-fous: aucune lecture env dans domaine, prompt et API en infrastructure uniquement.

Frontend:
- Porter ecrans Conseils IA et plan epargne depuis Figma.
- Ajouter objectifs d'epargne CRUD et progression.
- Afficher conseils actionnables et historises.

Tests:
- Tests objectifs epargne.
- Tests generation conseils avec service IA mocke.
- Tests composants conseils/objectifs.

Sortie attendue:
- L'utilisateur voit des recommandations budgetaires utiles et suit ses objectifs.

## V10 - Notifications, E2E et Durcissement Production

Objectif: passer d'une app fonctionnelle a une app prete beta.

Backend:
- Ajouter notifications: depassement budget, objectif en retard, solde bas.
- Ajouter jobs planifies ou mecanisme d'evenements domaine.
- Ajouter logs JSON structures et configuration production.
- Renforcer securite auth: rotation refresh token, device sessions, rate limiting.

Frontend:
- Ajouter preferences notifications.
- Ajouter etats offline simples et retry API.
- Polir accessibilite, contrastes, empty states et erreurs.

Tests et qualite:
- Ajouter E2E critiques: auth, creation compte, transaction, budget, import.
- Maintenir couverture backend > 85%.
- Ajouter verification build Expo et smoke tests API.
- Revoir npm audit et upgrades compatibles Expo.

Sortie attendue:
- Une beta coherentement testee, securisee et deployable.

## Regles transverses pour toutes les versions

- Toujours commencer par les tests: acceptance/API/component selon la tranche, puis unitaires, puis implementation.
- Garder le domaine sans dependance framework ou environnement.
- Ne jamais exposer directement les entites domaine via API.
- Isoler IA, OCR, stockage, API externes et persistence derriere des ports.
- Maintenir lint, typecheck et tests verts avant de fermer une version.
- Porter le design Figma progressivement en composants React Native natifs, sans importer de code web/Tailwind dans Expo.
