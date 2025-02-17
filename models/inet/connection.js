const mysql = require('mysql2/promise')

const HOST = '192.168.19.180' // 192.168.19.20
const USER = 'TouchUp'
const PASSWORD = 'fN3mzP67' // fN3mzP67'
const DATABASE = 'niceapparel'
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