const express = require('express');
const path    = require('path');

const app       = express();
const PORT      = process.env.PORT || 3000;
const DEEPL_KEY = process.env.DEEPL_API_KEY;
const DEEPL     = 'https://api-free.deepl.com/v2';
const FREE_PLAN_CHAR_LIMIT = 500000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function noKey(res) {
  return res.status(500).json({ error: 'DEEPL_API_KEY no configurada en el servidor.' });
}

function countRequestedChars(body) {
  if (!body || !Array.isArray(body.text)) return 0;
  return body.text.reduce((sum, value) => {
    if (typeof value === 'string') return sum + value.length;
    if (value === null || value === undefined) return sum;
    return sum + String(value).length;
  }, 0);
}

app.post('/api/translate', async (req, res) => {
  if (!DEEPL_KEY) return noKey(res);

  const requestedChars = countRequestedChars(req.body);
  if (requestedChars <= 0) {
    return res.status(400).json({ error: 'Petición inválida: no hay texto para traducir.' });
  }

  let usageResponse;
  try {
    usageResponse = await fetch(`${DEEPL}/usage`, {
      headers: { 'Authorization': `DeepL-Auth-Key ${DEEPL_KEY}` }
    });
  } catch (e) {
    return res.status(502).json({
      error: 'No se pudo verificar el consumo de DeepL. Traducción bloqueada para no superar el límite del plan gratuito.'
    });
  }

  let usageData = null;
  try {
    usageData = await usageResponse.json();
  } catch (e) {
    return res.status(502).json({
      error: 'No se pudo interpretar el consumo de DeepL. Traducción bloqueada para no superar el límite del plan gratuito.'
    });
  }

  if (!usageResponse.ok) {
    return res.status(usageResponse.status).json({
      error: usageData.error || usageData.message || 'No se pudo verificar el consumo de DeepL.'
    });
  }

  const currentCount = Number(usageData.character_count);
  const apiLimit = Number(usageData.character_limit);
  if (!Number.isFinite(currentCount)) {
    return res.status(502).json({
      error: 'Consumo de DeepL inválido. Traducción bloqueada para no superar el límite del plan gratuito.'
    });
  }

  const effectiveLimit = Math.min(
    Number.isFinite(apiLimit) && apiLimit > 0 ? apiLimit : FREE_PLAN_CHAR_LIMIT,
    FREE_PLAN_CHAR_LIMIT
  );
  const projectedCount = currentCount + requestedChars;
  if (projectedCount > effectiveLimit) {
    const remaining = Math.max(effectiveLimit - currentCount, 0);
    return res.status(400).json({
      error: `Límite mensual de DeepL (500000) insuficiente para esta traducción. Quedan ${remaining.toLocaleString('es-ES')} caracteres y se solicitaron ${requestedChars.toLocaleString('es-ES')}.`
    });
  }

  try {
    const r = await fetch(`${DEEPL}/translate`, {
      method: 'POST',
      headers: { 'Authorization': `DeepL-Auth-Key ${DEEPL_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    res.status(r.status).json(await r.json());
  } catch (e) {
    res.status(502).json({ error: 'Error de conexión con DeepL.' });
  }
});

app.get('/api/usage', async (req, res) => {
  if (!DEEPL_KEY) return noKey(res);
  try {
    const r = await fetch(`${DEEPL}/usage`, {
      headers: { 'Authorization': `DeepL-Auth-Key ${DEEPL_KEY}` }
    });
    res.status(r.status).json(await r.json());
  } catch (e) {
    res.status(502).json({ error: 'Error de conexión con DeepL.' });
  }
});

app.listen(PORT, () => console.log(`Translet escuchando en http://localhost:${PORT}`));
