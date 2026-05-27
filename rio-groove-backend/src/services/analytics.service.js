const { getOrders } = require('./orders.service');
const { getStock } = require('./stock.service');

const PAID_STATUSES = new Set(['paid', 'pagamento_aprovado', 'fulfilled']);
const CANCELLED_STATUSES = new Set(['cancelled', 'cancelado', 'refunded', 'payment_failed']);

function parseOrderDate(order) {
  return new Date(order.created_at || order.createdAt || 0);
}

function isPaidOrder(order) {
  if (CANCELLED_STATUSES.has(String(order.status || '').toLowerCase())) return false;
  if (order.fulfillment_status === 'cancelado') return false;
  if (order.paid_at) return true;
  if (order.payment_status === 'paid' || order.payment_status === 'approved') return true;
  return PAID_STATUSES.has(String(order.status || '').toLowerCase());
}

function isCancelledOrder(order) {
  const status = String(order.status || '').toLowerCase();
  return CANCELLED_STATUSES.has(status) || order.fulfillment_status === 'cancelado';
}

function orderTotal(order) {
  return Number(order.total_amount ?? order.total ?? 0);
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(days) {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - days);
  return d;
}

function monthStart(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function loadOrdersAndStock() {
  const [{ orders }, stockItems] = await Promise.all([
    getOrders({ limit: 500, offset: 0 }),
    getStock().catch(() => []),
  ]);
  return { orders: orders || [], stockItems: stockItems || [] };
}

function buildCustomerMetrics(orders) {
  const customersMap = {};
  const now = new Date();
  const monthStartDate = monthStart();

  for (const order of orders) {
    const email = order.customer_email;
    const id = email || order.customer_phone || order.customer_name;
    if (!id || id === '-') continue;

    if (!customersMap[id]) {
      customersMap[id] = { orders: 0, lastOrder: parseOrderDate(order), firstOrder: parseOrderDate(order) };
    }
    customersMap[id].orders += 1;
    const orderDate = parseOrderDate(order);
    if (orderDate > customersMap[id].lastOrder) customersMap[id].lastOrder = orderDate;
    if (orderDate < customersMap[id].firstOrder) customersMap[id].firstOrder = orderDate;
  }

  const customersList = Object.values(customersMap);
  let newCustomers = 0;
  let prevNewCustomers = 0;
  const prevMonthStart = new Date(monthStartDate);
  prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);

  for (const customer of customersList) {
    if (customer.firstOrder >= monthStartDate) newCustomers += 1;
    if (customer.firstOrder >= prevMonthStart && customer.firstOrder < monthStartDate) prevNewCustomers += 1;
  }

  const customersGrowth = prevNewCustomers
    ? Math.round(((newCustomers - prevNewCustomers) / prevNewCustomers) * 100)
    : newCustomers > 0 ? 100 : 0;

  return { newCustomers, customersGrowth, totalCustomers: customersList.length };
}

function buildSizeAndColorMetrics(orders) {
  const sizeMap = new Map();
  const colorMap = new Map();
  let itemsConsumed = 0;

  for (const order of orders.filter(isPaidOrder)) {
    const items = order.order_items || order.items || [];
    for (const item of items) {
      const qty = Number(item.quantity || 1);
      itemsConsumed += qty;

      const size = String(item.size || '—').trim().toUpperCase();
      sizeMap.set(size, (sizeMap.get(size) || 0) + qty);

      const color = String(item.color || '—').trim();
      colorMap.set(color, (colorMap.get(color) || 0) + qty);
    }
  }

  const totalSizeQty = Array.from(sizeMap.values()).reduce((s, v) => s + v, 0) || 1;
  const topSizes = Array.from(sizeMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([size, count]) => ({ size, count, pct: Math.round((count / totalSizeQty) * 100) }));

  const topColors = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([color, count]) => ({ color, count, hex: null }));

  return { itemsConsumed, topSizes, topColors };
}

async function getDashboardAnalytics() {
  const { orders, stockItems } = await loadOrdersAndStock();
  const paidOrders = orders.filter(isPaidOrder);
  const totalSales = paidOrders.reduce((sum, order) => sum + orderTotal(order), 0);
  const totalOrders = orders.filter((order) => !isCancelledOrder(order)).length;
  const averageTicket = paidOrders.length ? totalSales / paidOrders.length : 0;

  const todayStart = startOfDay(new Date());
  const yesterdayStart = daysAgo(1);
  const todayOrders = orders.filter((order) => parseOrderDate(order) >= todayStart).length;
  const yesterdayOrders = orders.filter((order) => {
    const date = parseOrderDate(order);
    return date >= yesterdayStart && date < todayStart;
  }).length;
  const todayOrdersGrowth = yesterdayOrders
    ? Math.round(((todayOrders - yesterdayOrders) / yesterdayOrders) * 100)
    : todayOrders > 0 ? 100 : 0;

  const monthStartDate = monthStart();
  const prevMonthStart = new Date(monthStartDate);
  prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);

  const salesThisMonth = paidOrders
    .filter((order) => parseOrderDate(order) >= monthStartDate)
    .reduce((sum, order) => sum + orderTotal(order), 0);
  const salesPrevMonth = paidOrders
    .filter((order) => {
      const date = parseOrderDate(order);
      return date >= prevMonthStart && date < monthStartDate;
    })
    .reduce((sum, order) => sum + orderTotal(order), 0);
  const salesGrowth = salesPrevMonth
    ? Math.round(((salesThisMonth - salesPrevMonth) / salesPrevMonth) * 100)
    : salesThisMonth > 0 ? 100 : 0;

  const ordersThisMonth = orders.filter((order) => parseOrderDate(order) >= monthStartDate).length;
  const ordersPrevMonth = orders.filter((order) => {
    const date = parseOrderDate(order);
    return date >= prevMonthStart && date < monthStartDate;
  }).length;
  const ordersGrowth = ordersPrevMonth
    ? Math.round(((ordersThisMonth - ordersPrevMonth) / ordersPrevMonth) * 100)
    : ordersThisMonth > 0 ? 100 : 0;

  const customerMetrics = buildCustomerMetrics(orders);
  const inventoryMetrics = buildSizeAndColorMetrics(orders);

  const totalProductsSold = paidOrders.reduce((sum, order) => {
    const items = order.order_items || order.items || [];
    return sum + items.reduce((itemSum, item) => itemSum + Number(item.quantity || 1), 0);
  }, 0);

  const lowStockItems = stockItems.filter(
    (item) => Number(item.quantity) > 0 && Number(item.quantity) <= Number(item.min_stock || 0)
  ).length;
  const outOfStockItems = stockItems.filter((item) => Number(item.quantity) === 0).length;

  return {
    available: true,
    totalSales: salesThisMonth,
    salesGrowth,
    todayOrders,
    todayOrdersGrowth,
    totalOrders: ordersThisMonth,
    ordersGrowth,
    averageTicket,
    totalProductsSold,
    lowStockItems,
    outOfStockItems,
    ...customerMetrics,
    ...inventoryMetrics,
  };
}

async function getSalesChartData(period = '30d') {
  const { orders } = await loadOrdersAndStock();
  const days = period === '7d' ? 7 : 30;
  const weekdayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const buckets = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = daysAgo(i);
    buckets.push({
      date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      weekday: weekdayLabels[date.getDay()],
      revenue: 0,
      orders: 0,
      bucketDate: date.getTime(),
    });
  }

  for (const order of orders.filter(isPaidOrder)) {
    const orderDay = startOfDay(parseOrderDate(order)).getTime();
    const bucket = buckets.find((entry) => entry.bucketDate === orderDay);
    if (!bucket) continue;
    bucket.revenue += orderTotal(order);
    bucket.orders += 1;
  }

  return buckets.map(({ date, weekday, revenue, orders: orderCount }) => ({
    date: days <= 7 ? weekday : date,
    revenue: Number(revenue.toFixed(2)),
    orders: orderCount,
  }));
}

async function getTopProducts(limit = 5) {
  const { orders } = await loadOrdersAndStock();
  const map = new Map();

  for (const order of orders.filter(isPaidOrder)) {
    const items = order.order_items || order.items || [];
    for (const item of items) {
      const name = item.product_name || item.name || 'Produto';
      const current = map.get(name) || { name, quantity: 0, revenue: 0 };
      const qty = Number(item.quantity || 1);
      const lineTotal = Number(item.line_total ?? (Number(item.unit_price || 0) * qty));
      current.quantity += qty;
      current.revenue += lineTotal;
      map.set(name, current);
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
}

module.exports = {
  getDashboardAnalytics,
  getSalesChartData,
  getTopProducts,
};
