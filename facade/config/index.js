import nconf from "nconf";

const conf = nconf.argv()
    .env()
    .file({ file: './config/config.json' });

export default conf.get("app");