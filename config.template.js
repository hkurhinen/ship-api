module.exports = {
  port: 3000,
  basePath: '/v1',
  database: {
    host: 'localhost',
    table: 'shipApi'
  },
  elasticsearch: {
    hosts: [
      'localhost:9200'
    ]
  },
  admins: [{
    'apikey': 'api_key',
    'name': 'api_user'
  }]
};