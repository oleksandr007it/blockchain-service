const nconf = require('nconf');

const conf = nconf.argv()
    .env()
    .file({ file: './config/config.json' });

module.exports = conf.get("app");
