const controller = require('./src/controllers/products.controller');

async function run() {
  const req = {
    body: {
      name: 'Test Product',
      price: '10.50',
      stock: '5',
      active: 'true',
      category: 'Test'
    },
    file: {
      originalname: 'test.jpg',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('fake image content')
    }
  };
  
  const res = {
    status: (code) => {
      console.log('Status', code);
      return {
        json: (data) => console.log('JSON', data),
        send: () => console.log('Send')
      };
    },
    json: (data) => console.log('Success', data)
  };
  
  try {
    await controller.createProduct(req, res);
  } catch (err) {
    console.error('Error running controller:', err);
  }
}

run();