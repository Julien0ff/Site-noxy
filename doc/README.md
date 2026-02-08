# Guide rapide - Manifest & fichiers JSON

Ce guide explique :
- comment fonctionne `data/manifest.json`
- comment ajouter un nouveau contenu
- comment est structuré un fichier `.json`

---

## 1) À quoi sert `data/manifest.json`

Le manifest est **la liste officielle** de tout ce qui apparaît sur le site.
Les pages de liste **ne lisent pas le dossier**, elles lisent le manifest.

Chaque entrée ressemble à ça :

```json
{ "id": "emerald-armor", "listed": true, "featured": false }
```

### Champs importants

- `id` : correspond exactement au nom du fichier JSON (sans `.json`)
- `listed` :
  - `true` = apparaît dans les pages de liste (mods / modpacks / resourcepacks)
  - `false` = n'apparaît pas dans les listes
- `featured` :
  - `true` = mis en avant sur la page d'accueil
  - `false` = pas mis en avant

### Règles sur la page d'accueil

1. Si **au moins un** contenu est `featured: true`, **seuls** ces contenus sont affichés (max 4).
2. S'il n'y a **aucun** `featured: true`, l'accueil affiche les contenus `listed: true`.

### Cas particulier

Si `featured: true` **et** `listed: false` :
- **visible sur l'accueil**
- **invisible dans les listes**

---

## 2) Comment ajouter un nouveau mod / modpack / resource pack

### Étapes

1. Créer le fichier JSON :
   - `data/mods/ton-mod.json`
   - ou `data/modpacks/ton-pack.json`
   - ou `data/resourcepacks/ton-pack.json`

2. Ajouter une entrée dans `data/manifest.json` :

```json
{
  "id": "ton-mod",
  "listed": true,
  "featured": false
}
```

3. (Optionnel) Vérifier que la page HTML existe :
   - Exemple : `"page": "mod-emeraldarmor.html"`

---

## 3) Comment fonctionne un fichier `.json`

Un fichier JSON est un **fichier texte** (comme un `.txt`) mais avec des règles strictes :

### Règles de base

- Tout est entre `{ }`
- Les clés sont entre guillemets `" "`
- Les valeurs peuvent être :
  - texte `"hello"`
  - nombre `123`
  - booléen `true` / `false`
  - liste `[ ... ]`
  - objet `{ ... }`
- **Pas de virgule** après le dernier élément

### Exemple simple

```json
{
  "title": "Emerald Armor",
  "tags": ["Armor", "Loot"],
  "listed": true
}
```

---

## 4) Structure d'un fichier JSON de contenu

Chaque contenu a au minimum :

```json
{
  "id": "emerald-armor",
  "type": "mod",
  "page": "mod-emeraldarmor.html",
  "texts": {
    "fr": {
      "title": "Emerald Armor",
      "shortDescription": "...",
      "descriptionHtml": "..."
    },
    "en": {
      "title": "Emerald Armor",
      "shortDescription": "...",
      "descriptionHtml": "..."
    }
  },
  "tags": [],
  "images": { "logo": "...", "banner": "...", "gallery": [] },
  "compatibility": { "edition": "Java", "minecraft": [], "platforms": [], "environments": [] },
  "details": [],
  "versions": [],
  "links": { "modrinth": "#", "curseforge": "#" }
}
```

---

## 5) Langues & fallback

- Le site utilise la langue choisie dans les paramètres.
- Si une traduction manque, **l'anglais est utilisé par défaut**.
- Tu peux ajouter une langue (ex: `ja`) sans changer le code, mais si le contenu `ja` n'existe pas, il retombera sur l'anglais.

---

Si tu veux, je peux aussi te faire un **exemple de template JSON prêt à copier** pour un nouveau mod.
