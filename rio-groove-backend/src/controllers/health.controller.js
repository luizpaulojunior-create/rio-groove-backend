function healthCheck(req, res) {
  return res.json({
    ok: true,
    service: 'Rio Groove Store Backend',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  healthCheck
};
