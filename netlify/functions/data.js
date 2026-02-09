const fetch = require('node-fetch');

exports.handler = async (event) => {
  const method = event.httpMethod;
  const fileName = event.path.split('/').pop(); // 'manifest' ou 'servers'
  const filePath = `data/${fileName}.json`;
  
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO = "aurorastudiio/aurorastudiio.github.io"; // Votre repo
  const GITHUB_BRANCH = "main";

  if (!GITHUB_TOKEN) {
    return { statusCode: 500, body: JSON.stringify({ error: "GITHUB_TOKEN non configuré" }) };
  }

  const baseUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;
  const headers = {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'AuroraStudio-Admin'
  };

  try {
    // GET : Lire le fichier depuis GitHub
    if (method === 'GET') {
      const response = await fetch(`${baseUrl}?ref=${GITHUB_BRANCH}`, { headers });
      if (response.status === 404) return { statusCode: 200, body: JSON.stringify({}) };
      
      const data = await response.json();
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: content
      };
    }

    // POST/PUT : Écrire le fichier sur GitHub (Commit)
    if (method === 'POST' || method === 'PUT') {
      const newContent = event.body;
      
      // 1. Récupérer le SHA du fichier existant (nécessaire pour l'update)
      const getRes = await fetch(`${baseUrl}?ref=${GITHUB_BRANCH}`, { headers });
      let sha = null;
      if (getRes.status === 200) {
        const existingFileData = await getRes.json();
        sha = existingFileData.sha;
      }

      // 2. Créer le commit
      const commitRes = await fetch(baseUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: `Admin Update: ${filePath}`,
          content: Buffer.from(newContent).toString('base64'),
          sha: sha, // Si sha est null, GitHub crée le fichier
          branch: GITHUB_BRANCH
        })
      });

      const result = await commitRes.json();
      if (!commitRes.ok) throw new Error(result.message || "Erreur GitHub");

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'GitHub Commit Success', sha: result.content.sha })
      };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error) {
    console.error("GitHub API Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
