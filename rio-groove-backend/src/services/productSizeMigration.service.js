/**
 * Normaliza tamanhos legados G1/XG → XGG em product_variants (e SKUs).
 */
const supabase = require('../lib/supabase');

function normalizeLegacySize(size) {
  const key = String(size || '').trim().toUpperCase();
  if (key === 'G1' || key === 'XG') return 'XGG';
  return String(size || '').trim();
}

function normalizeLegacySku(sku) {
  return String(sku || '')
    .replace(/-G1-/gi, '-XGG-')
    .replace(/-XG-(?!G)/gi, '-XGG-')
    .replace(/-G1$/i, '-XGG')
    .replace(/-XG$/i, '-XGG');
}

async function renameProductVariantG1ToXgg() {
  const { data: rows, error } = await supabase
    .from('product_variants')
    .select('id, product_id, color, size, sku');

  if (error) throw error;

  const variants = rows || [];
  const byProductColor = new Map();

  for (const row of variants) {
    const key = `${row.product_id}|${String(row.color || '').trim().toLowerCase()}`;
    if (!byProductColor.has(key)) byProductColor.set(key, []);
    byProductColor.get(key).push(row);
  }

  let deleted = 0;
  let renamed = 0;

  for (const group of byProductColor.values()) {
    let hasXgg = group.some((row) => String(row.size || '').trim().toUpperCase() === 'XGG');
    const legacy = group.filter((row) => {
      const size = String(row.size || '').trim().toUpperCase();
      return size === 'G1' || size === 'XG';
    });

    for (const row of legacy) {
      if (hasXgg) {
        const { error: delErr } = await supabase.from('product_variants').delete().eq('id', row.id);
        if (delErr) throw delErr;
        deleted += 1;
        continue;
      }

      const nextSku = normalizeLegacySku(row.sku);
      const { error: updErr } = await supabase
        .from('product_variants')
        .update({ size: 'XGG', sku: nextSku || row.sku })
        .eq('id', row.id);
      if (updErr) throw updErr;
      renamed += 1;
      hasXgg = true;
    }
  }

  return {
    scanned: variants.length,
    renamed,
    deleted,
    message: `Variantes de produto: ${renamed} renomeadas G1/XG→XGG, ${deleted} duplicatas removidas.`,
  };
}

module.exports = {
  normalizeLegacySize,
  normalizeLegacySku,
  renameProductVariantG1ToXgg,
};
