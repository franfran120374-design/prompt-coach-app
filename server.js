const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API: Optimiser un prompt
app.post('/api/optimize', (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt requis' });

    const original = analyzePrompt(prompt);
    const optimized = generateOptimized(prompt);
    const optimizedStats = analyzePrompt(optimized.text);

    res.json({
      original,
      optimized,
      savings: {
        chars: original.chars - optimizedStats.chars,
        tokens: original.tokens - optimizedStats.tokens,
        percent: Math.round((1 - optimizedStats.tokens / original.tokens) * 100)
      }
    });
  } catch (err) {
    console.error('Erreur optimize:', err);
    res.status(500).json({ error: err.message });
  }
});

// API: Calculer les tokens
app.post('/api/calculate', (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Texte requis' });

    const stats = analyzePrompt(text);
    res.json(stats);
  } catch (err) {
    console.error('Erreur calculate:', err);
    res.status(500).json({ error: err.message });
  }
});

function analyzePrompt(text) {
  const chars = text.length;
  const tokens = Math.ceil(chars / 4);
  const costInput = (tokens * 3 / 1000000).toFixed(6);
  const costOutput = (tokens * 15 / 1000000).toFixed(6);
  return { chars, tokens, costInput, costOutput };
}

function generateOptimized(prompt) {
  const lower = prompt.toLowerCase();
  let category = 'general';
  if (/code|function|api|endpoint|debug|error|bug|node|express|react/i.test(lower)) category = 'dev';
  if (/article|email|rédig|écri|texte|contenu|blog/i.test(lower)) category = 'writing';
  if (/analyse|données|comparer|évaluer|mesurer|stats/i.test(lower)) category = 'analysis';

  const templates = {
    dev: {
      prefix: 'Rôle : Dev expérimenté\nTâche : ',
      suffix: '\nContraintes : Code propre, gérer les erreurs\nSortie : Code commenté et prêt à l\'emploi'
    },
    writing: {
      prefix: 'Sujet : ',
      suffix: '\nPublic : [cible]\nTon : [formel/concis]\nLongueur : [X mots]'
    },
    analysis: {
      prefix: 'Données : ',
      suffix: '\nQuestion : [objectif]\nFormat : [tableau/résumé]'
    },
    general: {
      prefix: 'Contexte : [environnement]\nTâche : ',
      suffix: '\nContraintes : [règles]\nFormat : [sortie attendue]'
    }
  };

  const t = templates[category];
  const core = prompt.replace(/^(je voudrais|est-ce que tu peux|j'aimerais|peux-tu|s'il te plaît|bonjour|salut|help|aide)[\s,]*/gi, '').trim();
  const text = t.prefix + core + t.suffix;

  return { text, category };
}

app.listen(PORT, () => {
  console.log(`🚀 Prompt Coach running on port ${PORT}`);
});
