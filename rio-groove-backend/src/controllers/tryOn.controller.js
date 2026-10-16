const asyncHandler = require('../utils/asyncHandler');
const { isTryOnConfigured, runVirtualTryOn } = require('../services/tryOn.service');

function tryOnStatus(_req, res) {
  return res.json({ ok: true, enabled: isTryOnConfigured() });
}

const createTryOn = asyncHandler(async (req, res) => {
  if (!isTryOnConfigured()) {
    return res.status(503).json({
      ok: false,
      message: 'O experimentador ainda está sendo ligado. Tente de novo em breve.',
    });
  }

  const file = req.file;
  if (!file?.buffer) {
    return res.status(400).json({ ok: false, message: 'Envie uma foto para experimentar a peça.' });
  }
  if (file.size > 8 * 1024 * 1024) {
    return res.status(413).json({ ok: false, message: 'A foto precisa ter no máximo 8 MB.' });
  }

  const garmentImageUrl = String(req.body?.garmentImageUrl || '').trim();
  const image = await runVirtualTryOn({
    personBuffer: file.buffer,
    personMime: file.mimetype,
    garmentImageUrl,
  });

  return res.json({ ok: true, image });
});

module.exports = {
  tryOnStatus,
  createTryOn,
};
