const mysql = require('mysql2/promise')

const HOST = process.env.INET_HOST
const USER = process.env.INET_USER
const PASSWORD = process.env.INET_PASSWORD
const DATABASE = process.env.INET_DATABASE
const getConnection = () => {
    return new Promise(async (resolve, reject) => {
        console.log(HOST, USER, PASSWORD, DATABASE)
        const connection = await mysql.createConnection({
            host: '192.168.19.181', // process.env.INET_HOST,
            user: process.env.INET_USER,
            password: process.env.INET_PASSWORD,
            database: process.env.INET_DATABASE
        });
        resolve(connection)
    })
}

module.exports = getConnection