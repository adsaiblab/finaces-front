# Guide Git — GitHub & GitLab sur macOS

---

## 1. GitHub

### 1.1 Initialiser un dossier local et pousser vers GitHub

#### Étape 1 — Créer le repo sur GitHub

1. Va sur [github.com](https://github.com) → **New repository**
2. Donne un nom, laisse-le **vide** (sans README ni .gitignore)
3. Copie l'URL HTTPS : `https://github.com/TON-USERNAME/MON-REPO.git`

#### Étape 2 — Initialiser en local

```bash
cd ~/Documents/mon-projet

# Créer le .gitignore AVANT le premier commit
touch .gitignore
echo ".DS_Store" >> .gitignore

# Initialiser Git
git init
git add .
git commit -m "first commit"

# Relier au repo GitHub
git branch -M main
git remote add origin https://github.com/TON-USERNAME/MON-REPO.git
git push -u origin main
```

> ✅ `-u` définit `origin/main` comme upstream → les prochains push se font avec `git push` seul.

---

### 1.2 Workflow Push quotidien

```bash
# Modifier des fichiers, puis :
git add .
git commit -m "feat: description du changement"
git push
```

---

### 1.3 Récupérer des fichiers créés/modifiés directement sur GitHub

> Cas typique : tu crées ou édites un fichier via l'interface web GitHub, et tu veux le récupérer sur ton Mac.

```bash
# Récupérer et fusionner les changements distants
git pull origin main

# Ou en deux étapes séparées (recommandé)
git fetch origin       # télécharge sans fusionner
git merge origin/main  # fusionne dans la branche locale
```

---

### 1.4 Cloner un repo existant (nouveau Mac ou nouveau dossier)

```bash
git clone https://github.com/TON-USERNAME/MON-REPO.git
cd MON-REPO
```

---

### 1.5 Commandes de vérification utiles

```bash
git status          # état du dossier local
git log --oneline   # historique des commits
git remote -v       # vérifier les remotes configurés
git branch -a       # lister toutes les branches (locales + distantes)
```

---

---

## 2. GitLab

Le workflow est **identique à GitHub** — seules les URLs et l'interface changent.

### 2.1 Initialiser un dossier local et pousser vers GitLab

#### Étape 1 — Créer le projet sur GitLab

1. Va sur [gitlab.com](https://gitlab.com) → **New project** → **Create blank project**
2. Laisse le repo **vide** (décocher "Initialize repository with a README")
3. Copie l'URL HTTPS : `https://gitlab.com/TON-USERNAME/MON-REPO.git`

#### Étape 2 — Initialiser en local

```bash
cd ~/Documents/mon-projet

touch .gitignore
echo ".DS_Store" >> .gitignore

git init
git add .
git commit -m "first commit"

git branch -M main
git remote add origin https://gitlab.com/TON-USERNAME/MON-REPO.git
git push -u origin main
```

> ⚠️ GitLab peut demander un **Personal Access Token** à la place du mot de passe.
> Génère-le sur : **Settings → Access Tokens → add_token** avec le scope `write_repository`.

---

### 2.2 Workflow Push quotidien

```bash
git add .
git commit -m "fix: correction du module X"
git push
```

---

### 2.3 Récupérer des fichiers créés/modifiés directement sur GitLab

```bash
# Récupérer et fusionner d'un coup
git pull origin main

# Ou en deux étapes
git fetch origin
git merge origin/main
```

---

### 2.4 Cloner un repo GitLab existant

```bash
git clone https://gitlab.com/TON-USERNAME/MON-REPO.git
cd MON-REPO
```

---

---

## 3. Référence rapide — Commandes essentielles

| Action | Commande |
|---|---|
| Initialiser un repo local | `git init` |
| Stager tous les fichiers | `git add .` |
| Créer un commit | `git commit -m "message"` |
| Pousser (première fois) | `git push -u origin main` |
| Pousser (fois suivantes) | `git push` |
| Récupérer les changements distants | `git pull` |
| Cloner un repo existant | `git clone <URL>` |
| Vérifier l'état local | `git status` |
| Voir les remotes | `git remote -v` |

---

## 4. Configuration globale macOS (une seule fois)

```bash
# Ignorer .DS_Store dans tous les projets
touch ~/.gitignore_global && echo ".DS_Store" >> ~/.gitignore_global
git config --global core.excludesfile ~/.gitignore_global

# Identité Git
git config --global user.name "Ton Nom"
git config --global user.email "ton@email.com"
```
