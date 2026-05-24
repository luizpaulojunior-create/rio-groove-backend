const env = require('./src/config/env');
const stockService = require('./src/services/stock.service');

async function test() {
  try {
    const stock = await stockService.getStock();
    if (stock.length === 0) {
      console.log('No stock items to update.');
      return;
    }
    const item = stock[0];
    console.log('Testing update for item ID:', item.id);
    console.log('Original item:', item);
    
    // Simulate payload exactly as frontend sends after normalizePayload
    const payload = {
      category: item.category,
      model: item.model,
      color_key: item.color_key,
      color_label: item.color_label,
      color_hex: item.color_hex,
      size: item.size,
      sku: item.sku,
      quantity: item.quantity !== undefined ? item.quantity : 10,
      min_stock: item.min_stock !== undefined ? item.min_stock : 5,
      unit_cost: item.unit_cost !== undefined ? item.unit_cost : 45.5,
      is_active: item.is_active !== undefined ? item.is_active : true,
      gender: item.gender,
      fabric: item.fabric
    };
    
    console.log('Sending payload to updateStockItem:', payload);
    const updated = await stockService.updateStockItem(item.id, payload);
    console.log('Update success:', updated);
  } catch (e) {
    console.error('Update error:', e);
  }
}

test();
