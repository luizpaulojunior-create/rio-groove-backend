import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

function normalizeTags(raw) {
  if (!raw || !Array.isArray(raw)) return null;
  const flat = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('[')) {
      try {
        const inner = JSON.parse(trimmed);
        if (Array.isArray(inner)) {
          flat.push(...inner.map(String));
          continue;
        }
      } catch {
        // fall through
      }
    }
    flat.push(trimmed);
  }
  if (!flat.length) return null;

  const hasCroppedModel = flat.some((t) => t.startsWith('model:') && /cropped/i.test(t));
  const isFeminino = flat.includes('genero:Feminino');
  if (hasCroppedModel && isFeminino && !flat.includes('segmento:cropped')) {
    flat.push('segmento:cropped');
  }
  return flat;
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const { data: products, error } = await supabase
  .from('products')
  .select('id,name,tags');

if (error) throw error;

let fixed = 0;
for (const product of products || []) {
  const normalized = normalizeTags(product.tags);
  if (!normalized) continue;
  const broken = Array.isArray(product.tags)
    && product.tags.some((t) => typeof t === 'string' && t.trim().startsWith('['));
  const missingSegment = normalized.includes('segmento:cropped')
    && !(product.tags || []).includes('segmento:cropped');
  if (!broken && !missingSegment) continue;

  const { error: updErr } = await supabase
    .from('products')
    .update({ tags: normalized })
    .eq('id', product.id);

  if (updErr) {
    console.error('Failed', product.name, updErr.message);
    continue;
  }
  console.log('Fixed:', product.name, '→', normalized.join(', '));
  fixed += 1;
}

console.log(`Done. ${fixed} product(s) updated.`);
