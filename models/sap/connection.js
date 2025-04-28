const HOST = process.env.SAP_HOST
const USER = process.env.SAP_USER
const PASSWORD = process.env.SAP_PASSWORD
const config = {
    user: USER,
    password: PASSWORD,
    database: process.env.SAP_DATABASE,
    server: HOST,
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    },
    options: {
      encrypt: false, // for azure
    //   trustServerCertificate: false
    }
}

module.exports = config