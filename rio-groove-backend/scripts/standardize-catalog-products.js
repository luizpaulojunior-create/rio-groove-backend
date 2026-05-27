/**
 * Padroniza estampas existentes no modelo Rio Groove:
 * Estampa (products) + insumo Camisa Oversized Tradicional (tags + estoque).
 *
 * PowerShell:
 *   node scripts/standardize-catalog-products.js
 *   node scripts/standardize-catalog-products.js --dry-run
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const DRY_RUN = process.argv.includes('--dry-run');

const INSUMO_TAGS = ['insumo:Camisa', 'model:Oversized Tradicional'];
const DEFAULT_FABRICS = ['liso', 'estonado'];

const VARIANT_TO_ADMIN_COLOR = {
  Preto: 'Black',
  Branco: 'White',
  'Off White': 'Off White',
  Vermelho: 'Vermelho',
  Verde: 'Verde',
};

function normalizeColorVariant(raw) {
  if (!raw) return null;
  const norm = String(raw).trim().toLowerCase().replace(/\s+/g, ' ');
  const map = {
    preto: 'Preto',
    black: 'Preto',
    blk: 'Preto',
    branco: 'Branco',
    white: 'Branco',
    wht: 'Branco',
    'off white': 'Off White',
    offwhite: 'Off White',
    off: 'Off White',
    vermelho: 'Vermelho',
    red: 'Vermelho',
    verde: 'Verde',
    grn: 'Verde',
  };
  return map[norm] || null;
}

function inferColorFromUrl(url) {
  if (!url) return null;
  const u = url.toLowerCase();
  if (/off[-_]?white|offwhite|[-_]off[-_.]/.test(u)) return 'Off White';
  if (/vermelh|[-_]red[-_.]/.test(u)) return 'Vermelho';
  if (/verde|[-_]grn[-_.]/.test(u)) return 'Verde';
  if (/preto|preta|[-_]blk[-_.]|black/.test(u)) return 'Preto';
  if (/branco|branca|[-_]wht[-_.]|[-_]white/.test(u)) return 'Branco';
  return null;
}

function resolveImageVariant(img) {
  return (
    normalizeColorVariant(img.color_variant) ||
    normalizeColorVariant(img.color_key) ||
    inferColorFromUrl(img.image_url)
  );
}

function variantsToAdminColors(variants) {
  const set = new Set();
  for (const v of variants) {
    const admin = VARIANT_TO_ADMIN_COLOR[v];
    if (admin) set.add(admin);
  }
  return Array.from(set);
}

async function main() {
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: products, error } = await sb
    .from('products')
    .select('id, name, slug, colors, fabric_appearances, tags, product_images(id, image_url, color_variant, sort_order)')
    .eq('active', true)
    .order('name');

  if (error) throw error;

  console.log(DRY_RUN ? '=== DRY RUN ===\n' : '=== PADRONIZAÇÃO ESTAMPAS ===\n');

  for (const product of products) {
    const images = product.product_images || [];
    const imageUpdates = [];
    const resolvedVariants = [];

    for (const img of images) {
      const variant = resolveImageVariant(img);
      if (variant) resolvedVariants.push(variant);
      const current = normalizeColorVariant(img.color_variant);
      if (variant && variant !== current) {
        imageUpdates.push({ id: img.id, color_variant: variant });
      } else if (!current && variant) {
        imageUpdates.push({ id: img.id, color_variant: variant });
      }
    }

    const uniqueVariants = [...new Set(resolvedVariants)];
    const colors = variantsToAdminColors(uniqueVariants);
    const fabricAppearances = [...DEFAULT_FABRICS];

    const tags = INSUMO_TAGS;

    console.log(`• ${product.name}`);
    console.log(`  imagens → cores: ${uniqueVariants.join(', ') || 'NENHUMA'}`);
    console.log(`  products.colors: [${colors.join(', ')}]`);
    console.log(`  fabric_appearances: [${fabricAppearances.join(', ')}]`);
    console.log(`  tags: [${tags.join(', ')}]`);
    if (imageUpdates.length) {
      console.log(`  atualizar ${imageUpdates.length} imagem(ns) sem cor normalizada`);
    }

    if (DRY_RUN) continue;

    for (const upd of imageUpdates) {
      const { error: imgErr } = await sb
        .from('product_images')
        .update({ color_variant: upd.color_variant })
        .eq('id', upd.id);
      if (imgErr) throw imgErr;
    }

    const { error: prodErr } = await sb
      .from('products')
      .update({
        colors,
        fabric_appearances: fabricAppearances,
        tags,
      })
      .eq('id', product.id);

    if (prodErr) throw prodErr;
    console.log('  ✓ salvo');
  }

  console.log(`\nConcluído: ${products.length} estampa(s)${DRY_RUN ? ' (simulação)' : ''}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
