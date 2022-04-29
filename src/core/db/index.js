const {Pool} = require('pg')
const config = require("../../config")
const SELECT_CURRENT_BLOCK_HEIGHT_QUERY = 'SELECT current_block FROM block_info'
const UPDATE_BLOCK_HEIGHT_QUERY = 'UPDATE block_info SET current_block = $1 WHERE current_block = $2'
const pool = new Pool({
    user: config.db.user,
    host: config.db.host,
    database: config.db.schema,
    password: config.db.password,
    port: config.db.port,
    max: config.db.max,
    idleTimeoutMillis: config.db.idle,
    connectionTimeoutMillis: config.db.connectionTimeout
})
module.exports = {
    query: (text, params, callback) => {
        return pool.query(text, params, callback)
    },
    getCurrentBlockHeight: (callback) => {
        return pool.query(SELECT_CURRENT_BLOCK_HEIGHT_QUERY, (err, result) => {
            if (err) {
                console.error(err);
            }
            callback(err,Number(result.rows[0]['current_block']));
        })
    },
    getCurrentBlockP: new Promise((resolve, reject) => {
        pool.query(SELECT_CURRENT_BLOCK_HEIGHT_QUERY, (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(Number(result.rows[0]['current_block']))
        })
    }),
    updateCurrentBlockHeight: async (currentBlock, latest) => {
        return pool.query(UPDATE_BLOCK_HEIGHT_QUERY, [latest, currentBlock], (err, result) => {
            if (err) {
                console.error(err);
            }
        })
    },
}

