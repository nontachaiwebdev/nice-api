const HOST = '192.168.19.180'
const USER = 'TouchUp'
const PASSWORD = 'fN3mzP67'
const config = {
    user: USER,
    password: PASSWORD,
    database: 'Sapdatatank', // process.env.DB_NAME,
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