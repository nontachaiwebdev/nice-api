const mysql = require('mysql2/promise')

const HOST = '127.0.0.1'
const USER = 'root'
const PASSWORD = 'password'
const DATABASE = 'nice'
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