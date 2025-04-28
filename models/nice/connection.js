const mysql = require('mysql2/promise')

const HOST = '192.168.19.91'
const USER = 'nontachai'
const PASSWORD = '12qwaszx'
const DATABASE = 'nice'
const getConnection = () => {
    return new Promise(async (resolve, reject) => {
        const connection = await mysql.createConnection({
            host: HOST,
            user: USER,
            password: PASSWORD,
            database: DATABASE,
            waitForConnections: true,
            connectionLimit: 5, // Reduce connection limit
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 10000
        });
        // const pool = mysql.createPool({
        //     host: HOST,
        //     user: USER,
        //     password: PASSWORD,
        //     database: DATABASE,
        //     waitForConnections: true,
        //     connectionLimit: 10,
        //     queueLimit: 0,
        //     enableKeepAlive: true,
        //     keepAliveInitialDelay: 10000
        // });
        resolve(connection)
    })
}

module.exports = getConnection