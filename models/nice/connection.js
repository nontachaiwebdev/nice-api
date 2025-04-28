const mysql = require('mysql2/promise')

const HOST = process.env.NICE_HOST
const USER = process.env.NICE_USER
const PASSWORD = process.env.NICE_PASSWORD
const DATABASE = process.env.NICE_DATABASE
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