const env = require('../config/env');

const OPENAI_EDITS_URL = 'https://api.openai.com/v1/images/edits';
/** Cap only for the temporary copy sent to OpenAI. Catalog images on the store are never resized. */
const MAX_GARMENT_BYTES = 20 * 1024 * 1024;

const TRY_ON_PROMPT = [
  'Photorealistic virtual try-on for an ecommerce product page.',
  'Image 1 is the customer. Keep the same identity, face, skin, hair, body, tattoos, pose, camera angle and background.',
  'Image 2 is the official product photo of the garment hanging on a hanger. Use that hanging shirt as the only clothing reference.',
  'If a person appears in image 2, ignore them. Copy only the hanging garment and its chest print onto the person in image 1.',
  'Put the exact same garment from image 2 onto the person in image 1.',
  'Reproduce the chest print with high fidelity: same illustration, same lettering, same colors, same layout. Do not redraw, restyle, simplify, or invent artwork.',
  'The print must stay fully visible and readable. No extra logos, extra text, extra accessories, or a different garment.',
  'Natural fabric drape only. No watermark.',
].join(' ');

function isTryOnConfigured() {
  return Boolean(env.openaiApiKey);
}

function allowedGarmentHosts() {
  const hosts = new Set(['cvpobvvkhcqasumhfwps.supabase.co']);
  try {
    const host = new URL(env.supabaseUrl).hostname.toLowerCase();
    if (host) hosts.add(host);
  } catch {
    /* ignore */
  }
  return hosts;
}

function isAllowedGarmentUrl(raw) {
  let parsed;
  try {
    parsed = new URL(String(raw || ''));
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  if (!allowedGarmentHosts().has(parsed.hostname.toLowerCase())) return false;
  return parsed.pathname.includes('/storage/v1/object/public/product-images/');
}

function extensionForMime(mime) {
  const type = String(mime || '').toLowerCase();
  if (type.includes('png')) return 'png';
  if (type.includes('webp')) return 'webp';
  return 'jpg';
}

function normalizeImageMime(mime) {
  const type = String(mime || '').split(';')[0].trim().toLowerCase();
  if (type === 'image/jpg' || type === 'image/jpeg') return 'image/jpeg';
  if (type === 'image/png' || type === 'image/webp') return type;
  return 'image/jpeg';
}

function mapOpenAiError(status, payload) {
  const message = String(payload?.error?.message || payload?.message || '');
  if (status === 401 || status === 403) {
    return 'A chave da OpenAI não foi aceita. Confira OPENAI_API_KEY no Render.';
  }
  if (status === 429 || /quota|billing|insufficient/i.test(message)) {
    return 'A OpenAI recusou a geração (limite ou saldo). Tente de novo em alguns minutos.';
  }
  if (/safety|moderation|rejected|invalid_image/i.test(message)) {
    return 'Essa foto não pôde ser usada. Tente outra, de frente e com boa luz.';
  }
  return 'Não foi possível gerar o preview agora. Tente de novo em instantes.';
}

async function fetchGarmentImage(garmentImageUrl) {
  if (!isAllowedGarmentUrl(garmentImageUrl)) {
    const error = new Error('Imagem da peça inválida.');
    error.statusCode = 400;
    throw error;
  }

  const response = await fetch(garmentImageUrl, { redirect: 'error' });
  if (!response.ok) {
    const error = new Error('Não foi possível carregar a imagem da peça.');
    error.statusCode = 502;
    throw error;
  }

  const mime = normalizeImageMime(response.headers.get('content-type'));
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length) {
    const error = new Error('Não foi possível carregar a imagem da peça.');
    error.statusCode = 502;
    throw error;
  }
  if (buffer.length > MAX_GARMENT_BYTES) {
    const error = new Error('A imagem da peça é grande demais para o preview.');
    error.statusCode = 413;
    throw error;
  }

  return { buffer, mime };
}

async function runVirtualTryOn({ personBuffer, personMime, garmentImageUrl }) {
  if (!env.openaiApiKey) {
    const error = new Error('O experimentador ainda está sendo ligado. Tente de novo em breve.');
    error.statusCode = 503;
    throw error;
  }

  const garment = await fetchGarmentImage(garmentImageUrl);
  const personType = normalizeImageMime(personMime);
  const form = new FormData();
  form.append('model', env.openaiImageModel);
  form.append('prompt', TRY_ON_PROMPT);
  form.append('quality', env.openaiImageQuality);
  form.append('size', '1024x1536');
  form.append('output_format', 'jpeg');
  if (env.openaiImageModel !== 'gpt-image-1-mini') {
    form.append('input_fidelity', 'high');
  }
  form.append(
    'image[]',
    new File([Uint8Array.from(personBuffer)], `person.${extensionForMime(personType)}`, {
      type: personType,
    }),
  );
  form.append(
    'image[]',
    new File([Uint8Array.from(garment.buffer)], `garment.${extensionForMime(garment.mime)}`, {
      type: garment.mime,
    }),
  );

  const response = await fetch(OPENAI_EDITS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.openaiApiKey}` },
    body: form,
  });

  const payload = await response.json().catch(() => ({}));
  const b64 = payload?.data?.[0]?.b64_json;
  if (!response.ok || !b64) {
    const error = new Error(mapOpenAiError(response.status, payload));
    error.statusCode = response.status >= 400 && response.status < 500 ? response.status : 502;
    throw error;
  }

  return `data:image/jpeg;base64,${b64}`;
}

module.exports = {
  isTryOnConfigured,
  isAllowedGarmentUrl,
  MAX_GARMENT_BYTES,
  runVirtualTryOn,
  runFashnTryOn: runVirtualTryOn,
};
