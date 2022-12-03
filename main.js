
const { client } = require('./index.js');
require('dotenv').config();
client.login(process.env['token']);
