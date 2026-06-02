const customOrdersService = require('../services/customOrders.service');

async function submitCustomOrder(req, res, next) {
  try {
    const artFiles = req.files?.art_files || [];
    const refFiles = req.files?.reference_files || [];
    const files = [...artFiles, ...refFiles];

    if (req.body.order_type === 'ready_art' && artFiles.length === 0) {
      return res.status(400).json({
        ok: false,
        error: 'Envie pelo menos um arquivo de arte para pedidos com estampa pronta.',
      });
    }

    const order = await customOrdersService.createCustomOrder(req.body, files);

    res.status(201).json({
      ok: true,
      protocol: order.protocol,
      access_token: order.access_token,
      order,
    });
  } catch (err) {
    next(err);
  }
}

async function listCustomOrders(req, res, next) {
  try {
    const orders = await customOrdersService.listCustomOrders({
      status: req.query.status,
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

async function getCustomOrder(req, res, next) {
  try {
    const order = await customOrdersService.getCustomOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ ok: false, error: 'Pedido não encontrado.' });
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
}

async function getCustomOrderPublic(req, res, next) {
  try {
    const order = await customOrdersService.getCustomOrderByToken(req.params.token);
    if (!order) {
      return res.status(404).json({ ok: false, error: 'Pedido não encontrado.' });
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
}

async function patchCustomOrder(req, res, next) {
  try {
    const mockupFile = req.file || req.files?.mockup?.[0] || null;
    const order = await customOrdersService.updateCustomOrder(req.params.id, req.body, mockupFile);
    res.json(order);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  submitCustomOrder,
  listCustomOrders,
  getCustomOrder,
  getCustomOrderPublic,
  patchCustomOrder,
};
