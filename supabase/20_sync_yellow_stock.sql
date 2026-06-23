-- Rio Groove — sincronizar estoque amarelo (Camisa, Regata, Boné) com 10 un.
BEGIN;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Oversized Boxy',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'P',
  10,
  5,
  42,
  'OVR-YEL-P-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Oversized Boxy',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'M',
  10,
  5,
  42,
  'OVR-YEL-M-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Oversized Boxy',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'G',
  10,
  5,
  42,
  'OVR-YEL-G-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Oversized Boxy',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'GG',
  10,
  5,
  42,
  'OVR-YEL-GG-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Oversized Boxy',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'XGG',
  10,
  5,
  42,
  'OVR-YEL-XGG-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Oversized Boxy',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'P',
  10,
  5,
  42,
  'OVR-YEL-P-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Oversized Boxy',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'M',
  10,
  5,
  42,
  'OVR-YEL-M-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Oversized Boxy',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'G',
  10,
  5,
  42,
  'OVR-YEL-G-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Oversized Boxy',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'GG',
  10,
  5,
  42,
  'OVR-YEL-GG-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Oversized Boxy',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'XGG',
  10,
  5,
  42,
  'OVR-YEL-XGG-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Relaxed Fit',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'P',
  10,
  5,
  42,
  'RLM-YEL-P-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Relaxed Fit',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'M',
  10,
  5,
  42,
  'RLM-YEL-M-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Relaxed Fit',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'G',
  10,
  5,
  42,
  'RLM-YEL-G-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Relaxed Fit',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'GG',
  10,
  5,
  42,
  'RLM-YEL-GG-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Relaxed Fit',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'XGG',
  10,
  5,
  42,
  'RLM-YEL-XGG-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Relaxed Fit',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'P',
  10,
  5,
  42,
  'RLM-YEL-P-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Relaxed Fit',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'M',
  10,
  5,
  42,
  'RLM-YEL-M-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Relaxed Fit',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'G',
  10,
  5,
  42,
  'RLM-YEL-G-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Relaxed Fit',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'GG',
  10,
  5,
  42,
  'RLM-YEL-GG-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Relaxed Fit',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'XGG',
  10,
  5,
  42,
  'RLM-YEL-XGG-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Regular Fit',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'P',
  10,
  5,
  42,
  'REG-YEL-P-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Regular Fit',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'M',
  10,
  5,
  42,
  'REG-YEL-M-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Regular Fit',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'G',
  10,
  5,
  42,
  'REG-YEL-G-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Regular Fit',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'GG',
  10,
  5,
  42,
  'REG-YEL-GG-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Regular Fit',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'XGG',
  10,
  5,
  42,
  'REG-YEL-XGG-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Regular Fit',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'P',
  10,
  5,
  42,
  'REG-YEL-P-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Regular Fit',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'M',
  10,
  5,
  42,
  'REG-YEL-M-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Regular Fit',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'G',
  10,
  5,
  42,
  'REG-YEL-G-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Regular Fit',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'GG',
  10,
  5,
  42,
  'REG-YEL-GG-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Regular Fit',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'XGG',
  10,
  5,
  42,
  'REG-YEL-XGG-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Oversized Tradicional',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'P',
  10,
  5,
  42,
  'OVT-YEL-P-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Oversized Tradicional',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'M',
  10,
  5,
  42,
  'OVT-YEL-M-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Oversized Tradicional',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'G',
  10,
  5,
  42,
  'OVT-YEL-G-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Oversized Tradicional',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'GG',
  10,
  5,
  42,
  'OVT-YEL-GG-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Oversized Tradicional',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'XGG',
  10,
  5,
  42,
  'OVT-YEL-XGG-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Oversized Tradicional',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'P',
  10,
  5,
  42,
  'OVT-YEL-P-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Oversized Tradicional',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'M',
  10,
  5,
  42,
  'OVT-YEL-M-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Oversized Tradicional',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'G',
  10,
  5,
  42,
  'OVT-YEL-G-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Oversized Tradicional',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'GG',
  10,
  5,
  42,
  'OVT-YEL-GG-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Masculino',
  'Oversized Tradicional',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'XGG',
  10,
  5,
  42,
  'OVT-YEL-XGG-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Baby Tee Altíssima',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'P',
  10,
  5,
  42,
  'BTA-YEL-P-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Baby Tee Altíssima',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'M',
  10,
  5,
  42,
  'BTA-YEL-M-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Baby Tee Altíssima',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'G',
  10,
  5,
  42,
  'BTA-YEL-G-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Baby Tee Altíssima',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'GG',
  10,
  5,
  42,
  'BTA-YEL-GG-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Baby Tee Altíssima',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'XGG',
  10,
  5,
  42,
  'BTA-YEL-XGG-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Baby Tee Altíssima',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'P',
  10,
  5,
  42,
  'BTA-YEL-P-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Baby Tee Altíssima',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'M',
  10,
  5,
  42,
  'BTA-YEL-M-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Baby Tee Altíssima',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'G',
  10,
  5,
  42,
  'BTA-YEL-G-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Baby Tee Altíssima',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'GG',
  10,
  5,
  42,
  'BTA-YEL-GG-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Baby Tee Altíssima',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'XGG',
  10,
  5,
  42,
  'BTA-YEL-XGG-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Oversized Feminina',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'P',
  10,
  5,
  42,
  'OVF-YEL-P-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Oversized Feminina',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'M',
  10,
  5,
  42,
  'OVF-YEL-M-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Oversized Feminina',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'G',
  10,
  5,
  42,
  'OVF-YEL-G-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Oversized Feminina',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'GG',
  10,
  5,
  42,
  'OVF-YEL-GG-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Oversized Feminina',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'XGG',
  10,
  5,
  42,
  'OVF-YEL-XGG-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Oversized Feminina',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'P',
  10,
  5,
  42,
  'OVF-YEL-P-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Oversized Feminina',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'M',
  10,
  5,
  42,
  'OVF-YEL-M-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Oversized Feminina',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'G',
  10,
  5,
  42,
  'OVF-YEL-G-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Oversized Feminina',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'GG',
  10,
  5,
  42,
  'OVF-YEL-GG-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Oversized Feminina',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'XGG',
  10,
  5,
  42,
  'OVF-YEL-XGG-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Boxy Cropped',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'P',
  10,
  5,
  42,
  'BOX-YEL-P-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Boxy Cropped',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'M',
  10,
  5,
  42,
  'BOX-YEL-M-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Boxy Cropped',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'G',
  10,
  5,
  42,
  'BOX-YEL-G-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Boxy Cropped',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'GG',
  10,
  5,
  42,
  'BOX-YEL-GG-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Boxy Cropped',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'XGG',
  10,
  5,
  42,
  'BOX-YEL-XGG-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Boxy Cropped',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'P',
  10,
  5,
  42,
  'BOX-YEL-P-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Boxy Cropped',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'M',
  10,
  5,
  42,
  'BOX-YEL-M-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Boxy Cropped',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'G',
  10,
  5,
  42,
  'BOX-YEL-G-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Boxy Cropped',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'GG',
  10,
  5,
  42,
  'BOX-YEL-GG-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Boxy Cropped',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'XGG',
  10,
  5,
  42,
  'BOX-YEL-XGG-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Relaxed Fit',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'P',
  10,
  5,
  42,
  'RLF-YEL-P-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Relaxed Fit',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'M',
  10,
  5,
  42,
  'RLF-YEL-M-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Relaxed Fit',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'G',
  10,
  5,
  42,
  'RLF-YEL-G-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Relaxed Fit',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'GG',
  10,
  5,
  42,
  'RLF-YEL-GG-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Relaxed Fit',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'XGG',
  10,
  5,
  42,
  'RLF-YEL-XGG-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Relaxed Fit',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'P',
  10,
  5,
  42,
  'RLF-YEL-P-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Relaxed Fit',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'M',
  10,
  5,
  42,
  'RLF-YEL-M-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Relaxed Fit',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'G',
  10,
  5,
  42,
  'RLF-YEL-G-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Relaxed Fit',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'GG',
  10,
  5,
  42,
  'RLF-YEL-GG-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Relaxed Fit',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'XGG',
  10,
  5,
  42,
  'RLF-YEL-XGG-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Cropped Tradicional',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'P',
  10,
  5,
  42,
  'CRO-YEL-P-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Cropped Tradicional',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'M',
  10,
  5,
  42,
  'CRO-YEL-M-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Cropped Tradicional',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'G',
  10,
  5,
  42,
  'CRO-YEL-G-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Cropped Tradicional',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'GG',
  10,
  5,
  42,
  'CRO-YEL-GG-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Cropped Tradicional',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'XGG',
  10,
  5,
  42,
  'CRO-YEL-XGG-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Cropped Tradicional',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'P',
  10,
  5,
  42,
  'CRO-YEL-P-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Cropped Tradicional',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'M',
  10,
  5,
  42,
  'CRO-YEL-M-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Cropped Tradicional',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'G',
  10,
  5,
  42,
  'CRO-YEL-G-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Cropped Tradicional',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'GG',
  10,
  5,
  42,
  'CRO-YEL-GG-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Cropped Tradicional',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'XGG',
  10,
  5,
  42,
  'CRO-YEL-XGG-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Regata Cropped Boxy',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'P',
  10,
  5,
  42,
  'RCB-YEL-P-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Regata Cropped Boxy',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'M',
  10,
  5,
  42,
  'RCB-YEL-M-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Regata Cropped Boxy',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'G',
  10,
  5,
  42,
  'RCB-YEL-G-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Regata Cropped Boxy',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'GG',
  10,
  5,
  42,
  'RCB-YEL-GG-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Regata Cropped Boxy',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'XGG',
  10,
  5,
  42,
  'RCB-YEL-XGG-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Regata Cropped Boxy',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'P',
  10,
  5,
  42,
  'RCB-YEL-P-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Regata Cropped Boxy',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'M',
  10,
  5,
  42,
  'RCB-YEL-M-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Regata Cropped Boxy',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'G',
  10,
  5,
  42,
  'RCB-YEL-G-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Regata Cropped Boxy',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'GG',
  10,
  5,
  42,
  'RCB-YEL-GG-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Camisa',
  'Feminino',
  'Regata Cropped Boxy',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'XGG',
  10,
  5,
  42,
  'RCB-YEL-XGG-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Regata',
  'Unissex',
  'Regular',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'P',
  10,
  5,
  25,
  'RGT-YEL-P-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Regata',
  'Unissex',
  'Regular',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'M',
  10,
  5,
  25,
  'RGT-YEL-M-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Regata',
  'Unissex',
  'Regular',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'G',
  10,
  5,
  25,
  'RGT-YEL-G-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Regata',
  'Unissex',
  'Regular',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'GG',
  10,
  5,
  25,
  'RGT-YEL-GG-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Regata',
  'Unissex',
  'Regular',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'XGG',
  10,
  5,
  25,
  'RGT-YEL-XGG-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Regata',
  'Unissex',
  'Regular',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'P',
  10,
  5,
  25,
  'RGT-YEL-P-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Regata',
  'Unissex',
  'Regular',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'M',
  10,
  5,
  25,
  'RGT-YEL-M-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Regata',
  'Unissex',
  'Regular',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'G',
  10,
  5,
  25,
  'RGT-YEL-G-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Regata',
  'Unissex',
  'Regular',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'GG',
  10,
  5,
  25,
  'RGT-YEL-GG-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Regata',
  'Unissex',
  'Regular',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'XGG',
  10,
  5,
  25,
  'RGT-YEL-XGG-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Regata',
  'Unissex',
  'Machão',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'P',
  10,
  5,
  25,
  'MCH-YEL-P-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Regata',
  'Unissex',
  'Machão',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'M',
  10,
  5,
  25,
  'MCH-YEL-M-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Regata',
  'Unissex',
  'Machão',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'G',
  10,
  5,
  25,
  'MCH-YEL-G-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Regata',
  'Unissex',
  'Machão',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'GG',
  10,
  5,
  25,
  'MCH-YEL-GG-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Regata',
  'Unissex',
  'Machão',
  'Lisa',
  'yel',
  'Amarelo',
  '#FFD500',
  'XGG',
  10,
  5,
  25,
  'MCH-YEL-XGG-LS',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Regata',
  'Unissex',
  'Machão',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'P',
  10,
  5,
  25,
  'MCH-YEL-P-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Regata',
  'Unissex',
  'Machão',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'M',
  10,
  5,
  25,
  'MCH-YEL-M-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Regata',
  'Unissex',
  'Machão',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'G',
  10,
  5,
  25,
  'MCH-YEL-G-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Regata',
  'Unissex',
  'Machão',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'GG',
  10,
  5,
  25,
  'MCH-YEL-GG-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Regata',
  'Unissex',
  'Machão',
  'Estonada',
  'yel',
  'Amarelo',
  '#FFD500',
  'XGG',
  10,
  5,
  25,
  'MCH-YEL-XGG-EST',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Boné',
  'Unissex',
  'Trucker',
  'N/A',
  'yel',
  'Amarelo',
  '#FFD500',
  'Tamanho Único',
  10,
  5,
  25,
  'TRK-YEL-U',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Boné',
  'Unissex',
  'Dad Hat',
  'N/A',
  'yel',
  'Amarelo',
  '#FFD500',
  'Tamanho Único',
  10,
  5,
  25,
  'DAD-YEL-U',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

INSERT INTO stock_items (
  category, gender, model, fabric, color_key, color_label, color_hex, size,
  quantity, min_stock, unit_cost, sku, is_active
) VALUES (
  'Boné',
  'Unissex',
  'Snapback',
  'N/A',
  'yel',
  'Amarelo',
  '#FFD500',
  'Tamanho Único',
  10,
  5,
  25,
  'SNP-YEL-U',
  true
) ON CONFLICT (sku) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  color_label = EXCLUDED.color_label,
  color_hex = EXCLUDED.color_hex,
  is_active = true;

UPDATE stock_items
SET quantity = 10
WHERE color_key = 'yel'
  AND category IN ('Camisa', 'Regata', 'Boné');

COMMIT;
