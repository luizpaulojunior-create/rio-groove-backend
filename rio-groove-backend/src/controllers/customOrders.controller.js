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

    if (!req.user) {
      return res.status(401).json({
        ok: false,
        error: 'Crie uma conta ou faça login para enviar pedidos personalizados.',
      });
    }

    const contactEmail = String(req.body.contact_email || '').trim().toLowerCase();
    const userEmail = String(req.user.email || '').trim().toLowerCase();
    if (contactEmail && userEmail && contactEmail !== userEmail) {
      return res.status(400).json({
        ok: false,
        error: 'Use o mesmo e-mail da sua conta para o pedido.',
      });
    }

    const order = await customOrdersService.createCustomOrder(req.body, files, req.user);

    res.status(201).json({
      ok: true,
      protocol: order.protocol,
      access_token: order.access_token,
      id: order.id,
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

async function listMyCustomOrders(req, res, next) {
  try {
    const orders = await customOrdersService.listCustomOrdersForCustomer(req.user);
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

async function getMyCustomOrder(req, res, next) {
  try {
    const order = await customOrdersService.getCustomOrderForCustomer(req.params.id, req.user);
    res.json(order);
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ ok: false, error: err.message });
    }
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

async function incrementRevision(req, res, next) {
  try {
    const order = await customOrdersService.incrementRevision(req.params.id);
    res.json(order);
  } catch (err) {
    next(err);
  }
}

async function approveCustomOrder(req, res, next) {
  try {
    const order = await customOrdersService.approveCustomOrderForProduction(req.params.id, req.user);
    res.json(order);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ ok: false, error: err.message });
    }
    next(err);
  }
}

async function payArtFee(req, res, next) {
  try {
    const payment = await customOrdersService.startArtFeePayment(
      req.params.id,
      req.user,
      req.body?.return_origin || req.headers.origin,
    );
    res.json(payment);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ ok: false, error: err.message });
    }
    next(err);
  }
}

async function payProduct(req, res, next) {
  try {
    const payment = await customOrdersService.startProductPayment(
      req.params.id,
      req.user,
      req.body?.return_origin || req.headers.origin,
    );
    res.json(payment);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ ok: false, error: err.message });
    }
    next(err);
  }
}

module.exports = {
  submitCustomOrder,
  listCustomOrders,
  listMyCustomOrders,
  getCustomOrder,
  getMyCustomOrder,
  getCustomOrderPublic,
  patchCustomOrder,
  incrementRevision,
  approveCustomOrder,
  payArtFee,
  payProduct,
};
