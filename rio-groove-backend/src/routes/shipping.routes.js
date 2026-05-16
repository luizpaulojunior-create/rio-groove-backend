const express = require('express');
const {
  shippingQuote,
  purchaseOrderShipping,
  generateOrderShippingLabel,
  getShippingTracking
} = require('../controllers/shipping.controller');
const { createShipmentInCart } = require('../services/shipping.service');

const router = express.Router();

router.post('/api/shipping/quote', shippingQuote);
router.post('/api/shipping/purchase', purchaseOrderShipping);
router.post('/api/shipping/label', generateOrderShippingLabel);
router.get('/api/shipping/tracking/:id', getShippingTracking);

// ROTA TEMPORÁRIA DE DEBUG - Melhor Envio Cart
// Pode ser removida após a validação
router.get('/debug/test-melhor-envio-cart', async (req, res) => {
  try {
    const mockOrder = {
      customer_name: "Cliente Teste Debug",
      customer_phone: "21999999999",
      customer_email: "teste@riogroovemovimentos.com.br",
      customer_cpf: "00000000000",
      shipping_street: "Avenida das Américas",
      shipping_number: "1000",
      shipping_complement: "Sala 101",
      shipping_neighborhood: "Barra da Tijuca",
      shipping_city: "Rio de Janeiro",
      shipping_state: "RJ",
      shipping_cep: "22640100", // CEP válido real
      items: [
        {
          product_name: "Camiseta Rio Groove (Mock Teste)",
          quantity: 1,
          unit_price: 150.00,
          metadata_json: {
            weight: 0.5,
            width: 20,
            height: 10,
            length: 20
          }
        }
      ]
    };

    const serviceId = 1; // 1 = PAC

    console.log('[DEBUG] Executando teste isolado de createShipmentInCart...');
    console.log('[DEBUG] Payload mockado:', JSON.stringify(mockOrder, null, 2));
    
    const cartId = await createShipmentInCart(mockOrder, serviceId);
    
    res.status(200).json({
      success: true,
      message: 'Carrinho criado com sucesso no Melhor Envio!',
      cart_id: cartId,
      mock_order_used: mockOrder
    });
  } catch (error) {
    console.error('[DEBUG] Falha no teste de createShipmentInCart:', error);
    res.status(500).json({
      success: false,
      message: 'Falha ao criar carrinho no Melhor Envio.',
      error: error.message
    });
  }
});

module.exports = router;
