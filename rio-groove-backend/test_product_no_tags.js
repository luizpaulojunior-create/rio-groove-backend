const productsController = require('./src/controllers/products.controller.js');
const productsService = require('./src/services/products.service.js');

async function run() {
  try {
    // mock req, res
    const req = {
      body: {
        name: 'Camisa Teste Sem Tags',
        description: 'Testando sem tags',
        price: '89.90',
        stock: '5',
        category: 'Camisetas',
        active: 'true',
        collection_id: ''
      },
      files: []
    };

    const res = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        console.log('Response Status:', this.statusCode);
        console.log('Response Data:', data);
        return data;
      }
    };

    console.log('Testing createProduct...');
    await productsController.createProduct(req, res);

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
