# Lattice — Spécification Technique Complète

## Vision

Lattice est un graphe de connaissances personnel augmenté par l'IA. L'utilisateur capture des concepts issus de n'importe quelle discipline (science, philosophie, histoire, économie, etc.) et l'IA révèle des connexions transversales invisibles entre eux. Au fil du temps, Lattice devient une carte vivante de la pensée de son utilisateur.

**Philosophie** : Inspiré par la "grille de modèles mentaux" de Charlie Munger — l'idée que la vraie puissance intellectuelle vient de la capacité à connecter des idées entre disciplines.

---

## Stack Technique

| Couche | Choix | Justification |
|--------|-------|---------------|
| **Framework** | Next.js 14+ (App Router) | SSR, API routes, déploiement flexible |
| **Langage** | TypeScript | Type safety, DX |
| **Base de données** | PostgreSQL + pgvector | Relationnelle + embeddings vectoriels pour similarité sémantique |
| **ORM** | Prisma | Migrations, type safety, support pgvector via extension |
| **Visualisation graphe** | react-force-graph (wrapper D3 force-directed) | Performant, interactif, 2D/3D |
| **Auth** | NextAuth.js (Auth.js v5) | Prêt pour multi-users plus tard |
| **LLM** | Claude API (Anthropic) + OpenAI API (switchable) | Flexibilité, l'utilisateur choisit |
| **Embeddings** | OpenAI text-embedding-3-small OU Voyage AI | Pour la similarité sémantique entre concepts |
| **Styling** | Tailwind CSS + shadcn/ui | Rapide, composants solides |
| **Déploiement** | Vercel (app) + Supabase ou Neon (PostgreSQL) | Zero-config, scalable, free tier généreux |

---

## Architecture

```
lattice/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Pages login/register
│   │   ├── (dashboard)/        # Layout principal
│   │   │   ├── graph/          # Vue graphe interactive
│   │   │   ├── concepts/       # CRUD concepts (liste + détail)
│   │   │   ├── explore/        # Suggestions IA & découverte
│   │   │   └── import/         # Import notes/articles/bookmarks
│   │   └── api/
│   │       ├── concepts/       # CRUD API
│   │       ├── connections/    # Gestion des liens
│   │       ├── ai/
│   │       │   ├── suggest/    # Suggestions de connexions
│   │       │   ├── embed/      # Génération d'embeddings
│   │       │   └── extract/    # Extraction depuis import
│   │       └── import/         # Parsing fichiers
│   ├── components/
│   │   ├── graph/              # Composants graphe
│   │   │   ├── GraphCanvas.tsx       # Wrapper react-force-graph
│   │   │   ├── NodeTooltip.tsx       # Info-bulle au hover
│   │   │   ├── GraphControls.tsx     # Zoom, filtres, recherche
│   │   │   └── ConnectionPanel.tsx   # Détail d'une connexion
│   │   ├── concepts/
│   │   │   ├── ConceptCard.tsx
│   │   │   ├── ConceptEditor.tsx     # Création/édition
│   │   │   └── ConceptSearch.tsx
│   │   ├── ai/
│   │   │   ├── SuggestionFeed.tsx    # Feed de suggestions IA
│   │   │   └── ProviderSelector.tsx  # Switch Claude/OpenAI
│   │   └── ui/                 # shadcn/ui components
│   ├── lib/
│   │   ├── db.ts               # Client Prisma
│   │   ├── ai/
│   │   │   ├── providers.ts    # Abstraction multi-LLM
│   │   │   ├── embeddings.ts   # Génération & comparaison
│   │   │   ├── suggestions.ts  # Logique de suggestion
│   │   │   └── extraction.ts   # Extraction concepts depuis texte
│   │   ├── import/
│   │   │   ├── markdown.ts     # Parser .md
│   │   │   ├── html.ts         # Parser HTML / bookmarks
│   │   │   ├── text.ts         # Parser .txt
│   │   │   └── url.ts          # Scraping d'URL
│   │   └── graph/
│   │       ├── layout.ts       # Algorithmes de layout
│   │       └── filters.ts      # Filtrage par domaine, date, etc.
│   └── types/
│       └── index.ts            # Types partagés
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
├── .env.example
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Modèle de Données (Prisma)

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgvector(map: "vector")]
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  passwordHash  String?
  image         String?
  createdAt     DateTime  @default(now())
  
  concepts      Concept[]
  connections   Connection[]
  imports       Import[]
  settings      UserSettings?
}

model UserSettings {
  id              String  @id @default(cuid())
  userId          String  @unique
  user            User    @relation(fields: [userId], references: [id])
  
  aiProvider      String  @default("anthropic") // "anthropic" | "openai"
  anthropicKey    String? // Encrypted
  openaiKey       String? // Encrypted
  
  graphLayout     String  @default("force-directed")
  theme           String  @default("dark")
}

model Concept {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  title       String
  description String   @db.Text
  domain      String   // "science", "philosophy", "history", "economics", etc.
  tags        String[] // Tags libres
  source      String?  // URL ou référence d'origine
  
  // Embedding vectoriel pour similarité sémantique
  embedding   Unsupported("vector(1536)")?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  connectionsFrom Connection[] @relation("FromConcept")
  connectionsTo   Connection[] @relation("ToConcept")
  importId        String?
  import          Import?      @relation(fields: [importId], references: [id])
  
  @@index([userId])
  @@index([domain])
}

model Connection {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  fromId      String
  from        Concept  @relation("FromConcept", fields: [fromId], references: [id], onDelete: Cascade)
  toId        String
  to          Concept  @relation("ToConcept", fields: [toId], references: [id], onDelete: Cascade)
  
  label       String   // Description du lien
  strength    Float    @default(0.5) // 0-1, force du lien
  type        String   @default("related") // "related", "causes", "contradicts", "extends", "example_of", "analogous_to"
  
  aiGenerated Boolean  @default(false) // Suggéré par l'IA ou créé manuellement
  accepted    Boolean  @default(true)  // false = suggestion en attente
  
  createdAt   DateTime @default(now())
  
  @@unique([fromId, toId])
  @@index([userId])
}

model Import {
  id        String    @id @default(cuid())
  userId    String
  
  source    String    // "markdown", "html", "url", "bookmarks", "text"
  filename  String?
  url       String?
  status    String    @default("pending") // "pending", "processing", "done", "error"
  
  concepts  Concept[]
  
  createdAt DateTime  @default(now())
}
```

---

## Features MVP — Détail

### 1. Visualisation Graphe Interactive

**Technologie** : `react-force-graph-2d` (avec option 3D)

**Comportement** :
- Chaque nœud = un concept, coloré par domaine
- Chaque lien = une connexion, épaisseur proportionnelle à `strength`
- Liens IA en pointillés (suggestions non acceptées)
- Hover sur un nœud : tooltip avec titre + description courte
- Click sur un nœud : panneau latéral avec détail complet + connexions
- Click sur un lien : affiche le label de la connexion
- Drag & drop pour réorganiser
- Zoom molette, pan click-drag
- Recherche rapide qui highlight le nœud trouvé

**Filtres** :
- Par domaine (toggle les couleurs)
- Par date de création (slider temporel)
- Par tags
- Profondeur : montrer N niveaux autour d'un concept sélectionné

**Palette de couleurs par domaine** :
```typescript
const DOMAIN_COLORS: Record<string, string> = {
  science:     "#3B82F6", // Bleu
  philosophy:  "#8B5CF6", // Violet
  history:     "#F59E0B", // Ambre
  economics:   "#10B981", // Émeraude
  psychology:  "#EC4899", // Rose
  technology:  "#06B6D4", // Cyan
  politics:    "#EF4444", // Rouge
  art:         "#F97316", // Orange
  mathematics: "#6366F1", // Indigo
  other:       "#6B7280", // Gris
};
```

### 2. Suggestions de Connexions par IA

**Architecture** :

```typescript
// lib/ai/providers.ts — Abstraction multi-LLM
interface AIProvider {
  generateSuggestions(concepts: Concept[], target: Concept): Promise<SuggestedConnection[]>;
  extractConcepts(text: string): Promise<ExtractedConcept[]>;
}

class AnthropicProvider implements AIProvider {
  // Utilise Claude API (claude-sonnet-4-20250514)
}

class OpenAIProvider implements AIProvider {
  // Utilise GPT-4o
}
```

**Flux de suggestions** :

1. **À la création d'un concept** : générer son embedding, chercher les K plus proches voisins via pgvector (`<=>` cosine distance), puis demander au LLM d'expliquer les liens potentiels entre eux.

2. **Exploration périodique** : un bouton "Discover" qui prend N concepts aléatoires de domaines différents et demande au LLM de trouver des connexions non évidentes.

3. **Prompt type pour les suggestions** :

```typescript
const SUGGESTION_PROMPT = `Tu es un expert en pensée interdisciplinaire.

Voici un nouveau concept ajouté par l'utilisateur :
<new_concept>
Titre : {title}
Description : {description}
Domaine : {domain}
</new_concept>

Voici des concepts existants qui pourraient être liés :
<existing_concepts>
{concepts.map(c => \`- [\${c.id}] \${c.title} (\${c.domain}): \${c.description}\`).join('\\n')}
</existing_concepts>

Pour chaque connexion pertinente que tu identifies, retourne un objet JSON avec :
- fromId: l'ID du concept existant
- toId: l'ID du nouveau concept
- label: une explication concise du lien (1-2 phrases)
- type: "causes" | "contradicts" | "extends" | "example_of" | "analogous_to" | "related"
- strength: un score de 0 à 1 reflétant la force du lien
- reasoning: pourquoi cette connexion est intellectuellement intéressante

Privilégie les connexions TRANSVERSALES entre domaines différents.
Ne retourne que les connexions non triviales et intellectuellement stimulantes.

Retourne un tableau JSON, rien d'autre.`;
```

### 3. Import depuis Notes/Articles/Bookmarks

**Sources supportées (MVP)** :
- Fichiers Markdown (.md)
- Fichiers texte (.txt)
- URLs (scraping avec extraction de contenu)
- Export HTML de bookmarks (Chrome/Firefox)

**Pipeline d'import** :

```
Fichier/URL → Parsing → Extraction texte → LLM extrait les concepts →
  → Génération embeddings → Insertion DB → Suggestions de connexions auto
```

**Prompt d'extraction** :

```typescript
const EXTRACTION_PROMPT = `Analyse le texte suivant et extrais les concepts clés qui méritent d'être dans un graphe de connaissances personnel.

Pour chaque concept, retourne :
- title: nom concis du concept
- description: explication en 2-3 phrases
- domain: le domaine principal parmi [science, philosophy, history, economics, psychology, technology, politics, art, mathematics, other]
- tags: 1-3 tags pertinents

Texte :
<text>
{text}
</text>

Retourne un tableau JSON. Ne retourne que des concepts substantiels, pas des détails mineurs.`;
```

---

## API Routes

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/concepts` | Liste des concepts (avec filtres, pagination) |
| POST | `/api/concepts` | Créer un concept + auto-embed + auto-suggest |
| GET | `/api/concepts/[id]` | Détail d'un concept + connexions |
| PUT | `/api/concepts/[id]` | Modifier un concept |
| DELETE | `/api/concepts/[id]` | Supprimer un concept + ses connexions |
| GET | `/api/connections` | Liste des connexions (filtres) |
| POST | `/api/connections` | Créer une connexion manuelle |
| PUT | `/api/connections/[id]` | Modifier (ex: accepter une suggestion) |
| DELETE | `/api/connections/[id]` | Supprimer une connexion |
| POST | `/api/ai/suggest` | Demander des suggestions pour un concept |
| POST | `/api/ai/discover` | Suggestions aléatoires cross-domain |
| POST | `/api/ai/embed` | Générer embedding pour un concept |
| POST | `/api/ai/extract` | Extraire concepts depuis du texte |
| POST | `/api/import/file` | Upload et import d'un fichier |
| POST | `/api/import/url` | Import depuis une URL |
| GET | `/api/import/[id]/status` | Statut d'un import |

---

## Variables d'Environnement

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lattice"

# Auth
NEXTAUTH_SECRET="generate-a-secret"
NEXTAUTH_URL="http://localhost:3000"

# AI Providers
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."

# Embedding model choice
EMBEDDING_PROVIDER="openai" # or "voyage"
```

---

## Plan de Build — Phases

### Phase 1 : Fondations (Jours 1-2)
- [ ] Init Next.js + TypeScript + Tailwind + shadcn/ui
- [ ] Setup Prisma + PostgreSQL + pgvector
- [ ] Auth basique avec NextAuth.js
- [ ] CRUD concepts (API + UI basique)
- [ ] Page de liste des concepts

### Phase 2 : Le Graphe (Jours 3-4)
- [ ] Intégration react-force-graph-2d
- [ ] Rendu des nœuds colorés par domaine
- [ ] Rendu des connexions avec labels
- [ ] Interactions : hover, click, zoom, pan
- [ ] Panneau latéral de détail
- [ ] Filtres par domaine et recherche

### Phase 3 : Intelligence IA (Jours 5-7)
- [ ] Abstraction multi-LLM (Anthropic + OpenAI)
- [ ] Génération d'embeddings à la création
- [ ] Recherche de voisins sémantiques via pgvector
- [ ] Suggestions de connexions au LLM
- [ ] UI du feed de suggestions (accept/reject/edit)
- [ ] Bouton "Discover" pour exploration aléatoire

### Phase 4 : Import (Jours 8-9)
- [ ] Upload de fichiers (Markdown, texte)
- [ ] Scraping d'URL
- [ ] Import de bookmarks HTML
- [ ] Extraction de concepts par LLM
- [ ] Auto-embedding et auto-suggestion post-import

### Phase 5 : Polish (Jours 10-12)
- [ ] Dark mode / Light mode
- [ ] Animations de graphe fluides
- [ ] Raccourcis clavier (Cmd+K recherche, etc.)
- [ ] Page settings (clés API, préférences)
- [ ] Responsive design
- [ ] Déploiement Vercel + Supabase/Neon

---

## Commandes Claude Code — Démarrage

```bash
# Phase 1 — Kickstart
# Colle cette spec dans ton projet et dis à Claude Code :

"Initialise le projet Lattice selon la spec LATTICE_SPEC.md.
Commence par le setup Next.js + Prisma + pgvector + NextAuth.
Crée le schéma Prisma et les migrations.
Implémente le CRUD concepts avec une UI basique."

# Phase 2 — Graphe
"Implémente la visualisation graphe avec react-force-graph-2d.
Les nœuds sont colorés par domaine, les liens montrent leur label au hover.
Ajoute un panneau latéral qui s'ouvre au click sur un nœud."

# Phase 3 — IA
"Implémente le système de suggestions IA.
Crée l'abstraction multi-provider (Anthropic + OpenAI).
À la création d'un concept, génère son embedding et suggère des connexions."
```

---

## Évolutions Post-MVP

- **Spaced Repetition** : Quiz sur les connexions pour ancrer les connaissances
- **Timeline View** : Visualiser l'évolution de son graphe dans le temps
- **Export** : Obsidian, Notion, Anki
- **API publique** : Pour intégrer avec d'autres outils
- **Multi-users** : Graphes partagés, merge de connaissances
- **Mobile** : PWA ou app React Native
- **Plugin navigateur** : Capturer un concept depuis n'importe quelle page web
