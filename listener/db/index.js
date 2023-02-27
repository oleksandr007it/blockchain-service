const {Pool} = require('pg')
const config = require("../config")
const SELECT_CURRENT_BLOCK_HEIGHT_QUERY = 'SELECT current_block FROM block_info'
const UPDATE_BLOCK_HEIGHT_QUERY = 'UPDATE block_info SET current_block = $1 WHERE current_block = $2'
const pool = new Pool({
    user: process.env.NODE_DATASOURCE_USERNAME || config.db.user,
    password: process.env.NODE_DATASOURCE_PASSWORD || config.db.password,
    host: process.env.NODE_DATASOURCE_HOST || config.db.host,
    port: process.env.NODE_DATASOURCE_PORT || config.db.port,
    database: process.env.NODE_DATASOURCE_DATABASE || config.db.schema,
    max: config.db.max,
    idleTimeoutMillis: config.db.idle,
    connectionTimeoutMillis: config.db.connectionTimeout
})
module.exports = {

    getCurrentBlockHeight() {
        return new Promise((resolve, reject) => {
            pool.query(SELECT_CURRENT_BLOCK_HEIGHT_QUERY, (err, result) => {
                if (err) {
                    reject(err);
                }
                resolve(Number(result.rows[0]['current_block']))
            })
        })
    },
    updateCurrentBlockHeight(currentBlock, latest) {
        return new Promise((resolve, reject) => {
            pool.query(UPDATE_BLOCK_HEIGHT_QUERY, [latest, currentBlock], (err, result) => {
                if (err) {
                    console.error("Error update %", err);
                    reject(err);
                }
                resolve(result);
            })
        })
    }
}

