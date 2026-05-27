const supabase = require('../lib/supabase');

async function resolveAffiliate(slug) {
  if (!slug) return null;
  const normalized = String(slug).trim().toLowerCase();
  const { data, error } = await supabase
    .from('affiliates')
    .select('id, slug')
    .eq('slug', normalized)
    .eq('active', true)
    .maybeSingle();

  if (error) {
    if (error.code === '42P01') return null;
    console.warn('[growth] resolveAffiliate', error.message);
    return null;
  }
  return data;
}

async function upsertNewsletterSubscriber({ email, name, source = 'checkout' }) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return;

  const { error } = await supabase.from('newsletter_subscribers').upsert(
    {
      email: normalized,
      name: name || null,
      source,
      status: 'active',
      accepts_marketing: true,
      subscribed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'email' }
  );

  if (error && error.code !== '42P01') {
    console.warn('[growth] newsletter upsert', error.message);
  }
}

module.exports = {
  resolveAffiliate,
  upsertNewsletterSubscriber,
};
