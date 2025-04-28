const mysql = require('mysql2/promise')

const HOST = process.env.INET_HOST
const USER = process.env.INET_USER
const PASSWORD = process.env.INET_PASSWORD
const DATABASE = process.env.INET_DATABASE
const getConnection = () => {
    return new Promise(async (resolve, reject) => {
        const connection = await mysql.createConnection({
            host: HOST,
            user: USER,
            password: PASSWORD,
            database: DATABASE
        });
        resolve(connection)
    })
}

module.exports = getConnection