/** Categorias de custos gerais — manter alinhado com admin/src/config/generalCosts.js */

const GENERAL_COST_GROUPS = [
  {
    id: 'infrastructure',
    label: 'Infraestrutura',
    items: [
      { key: 'electricity', label: 'Luz / Energia elétrica' },
      { key: 'water', label: 'Água' },
      { key: 'gas', label: 'Gás' },
      { key: 'rent', label: 'Aluguel' },
      { key: 'condo', label: 'Condomínio / IPTU' },
      { key: 'internet', label: 'Internet / Telefone' },
    ],
  },
  {
    id: 'production',
    label: 'Produção & Insumos',
    items: [
      { key: 'raw_materials', label: 'Compra de insumos (blanks, filme, tinta)' },
      { key: 'packaging', label: 'Embalagens / Sacolas / Tags' },
      { key: 'production_supplies', label: 'Material de produção' },
      { key: 'equipment_maintenance', label: 'Manutenção de equipamentos' },
    ],
  },
  {
    id: 'investments',
    label: 'Equipamentos & Investimentos',
    items: [
      { key: 'equipment_purchase', label: 'Compra de equipamentos' },
      { key: 'machinery', label: 'Máquinas / Prensas / Impressoras' },
      { key: 'furniture', label: 'Móveis / Estrutura física' },
    ],
  },
  {
    id: 'people',
    label: 'Pessoal',
    items: [
      { key: 'payroll', label: 'Folha / Pró-labore' },
      { key: 'freelancers', label: 'Freelas / Designers' },
    ],
  },
  {
    id: 'commercial',
    label: 'Comercial',
    items: [
      { key: 'marketing', label: 'Marketing / Anúncios' },
      { key: 'commissions', label: 'Comissões / Afiliados' },
    ],
  },
  {
    id: 'operations',
    label: 'Operacional & Logística',
    items: [
      { key: 'shipping_ops', label: 'Frete / Logística operacional' },
      { key: 'software', label: 'Software / Ferramentas (SaaS)' },
      { key: 'professional_services', label: 'Serviços profissionais' },
      { key: 'travel', label: 'Transporte / Viagens' },
    ],
  },
  {
    id: 'financial',
    label: 'Financeiro & Impostos',
    items: [
      { key: 'payment_fees', label: 'Taxas de pagamento (Mercado Pago, etc.)' },
      { key: 'taxes', label: 'Impostos / DAS / Notas' },
      { key: 'accounting', label: 'Contador / Jurídico' },
      { key: 'bank_fees', label: 'Tarifas bancárias' },
    ],
  },
  {
    id: 'other',
    label: 'Outros',
    items: [{ key: 'other', label: 'Outros custos gerais' }],
  },
];

const GENERAL_COST_KEYS = GENERAL_COST_GROUPS.flatMap((group) => group.items.map((item) => item.key));

const GENERAL_COST_LABELS = Object.fromEntries(
  GENERAL_COST_GROUPS.flatMap((group) => group.items.map((item) => [item.key, item.label])),
);

const LEGACY_DRE_KEY_MAP = {
  payroll: 'payroll',
  marketing: 'marketing',
  rent: 'rent',
  utilities: 'electricity',
  other: 'other',
};

function parseMoney(value, fallback = 0) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return fallback;
  return Math.round(num * 100) / 100;
}

function emptyGeneralCostsMap() {
  return Object.fromEntries(GENERAL_COST_KEYS.map((key) => [key, 0]));
}

function normalizeGeneralMonthlyCosts(raw) {
  const result = {};
  if (!raw || typeof raw !== 'object') return result;

  for (const [monthKey, values] of Object.entries(raw)) {
    if (!values || typeof values !== 'object') continue;
    const monthCosts = emptyGeneralCostsMap();
    for (const key of GENERAL_COST_KEYS) {
      monthCosts[key] = parseMoney(values[key], 0);
    }
    result[monthKey] = monthCosts;
  }
  return result;
}

function normalizeGeneralCostEntries(raw) {
  const result = {};
  if (!raw || typeof raw !== 'object') return result;

  for (const [monthKey, entries] of Object.entries(raw)) {
    if (!Array.isArray(entries)) continue;
    result[monthKey] = entries
      .map((entry) => ({
        id: String(entry.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
        category: GENERAL_COST_KEYS.includes(entry.category) ? entry.category : 'other',
        description: String(entry.description || '').trim().slice(0, 200),
        amount: parseMoney(entry.amount, 0),
        date: entry.date ? String(entry.date).slice(0, 10) : null,
      }))
      .filter((entry) => entry.amount > 0 || entry.description);
  }
  return result;
}

function migrateLegacyDreExpenses(generalMonthly, legacyDre) {
  if (!legacyDre || typeof legacyDre !== 'object') return generalMonthly;
  const merged = { ...generalMonthly };

  for (const [monthKey, values] of Object.entries(legacyDre)) {
    if (!values || typeof values !== 'object') continue;
    if (!merged[monthKey]) merged[monthKey] = emptyGeneralCostsMap();

    for (const [legacyKey, generalKey] of Object.entries(LEGACY_DRE_KEY_MAP)) {
      const amount = parseMoney(values[legacyKey], 0);
      if (amount > 0 && merged[monthKey][generalKey] === 0) {
        merged[monthKey][generalKey] = amount;
      }
    }
  }

  return merged;
}

function getGeneralCostsForMonth(config, monthKey) {
  const base = emptyGeneralCostsMap();
  const stored = config?.general_monthly_costs?.[monthKey] || {};
  for (const key of GENERAL_COST_KEYS) {
    base[key] = parseMoney(stored[key], 0);
  }
  return base;
}

function sumGeneralCostsMap(costsMap = {}) {
  return round2(GENERAL_COST_KEYS.reduce((sum, key) => sum + (Number(costsMap[key]) || 0), 0));
}

function round2(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function buildGeneralCostsBreakdown(config, monthKey) {
  const costs = getGeneralCostsForMonth(config, monthKey);
  const groups = GENERAL_COST_GROUPS.map((group) => {
    const items = group.items.map((item) => ({
      key: item.key,
      label: item.label,
      amount: costs[item.key] || 0,
    }));
    const subtotal = round2(items.reduce((sum, item) => sum + item.amount, 0));
    return { ...group, items, subtotal };
  }).filter((group) => group.subtotal > 0);

  return {
    costs,
    groups,
    total: sumGeneralCostsMap(costs),
  };
}

module.exports = {
  GENERAL_COST_GROUPS,
  GENERAL_COST_KEYS,
  GENERAL_COST_LABELS,
  emptyGeneralCostsMap,
  normalizeGeneralMonthlyCosts,
  normalizeGeneralCostEntries,
  migrateLegacyDreExpenses,
  getGeneralCostsForMonth,
  sumGeneralCostsMap,
  buildGeneralCostsBreakdown,
};
