const commands = require('./commands')
const getConnection = require('./connection')


const createUser = (user, encodedPassword) => {
    return new Promise(async (resolve, reject) => {
        const connection = await getConnection()
        try {
            const [results] = await connection.query(commands.CREATE_USER(user, encodedPassword))
            resolve(results)
        } catch (err) {
            reject(err)
        }
    })
}

const getByEmail = (email) => {
    return new Promise(async (resolve, reject) => {
        const connection = await getConnection()
        try {
            const [results] = await connection.query(commands.GET_USER_BY_EMAIL.replace(':email', email))
            resolve(results)
        } catch (err) {
            reject(err)
        }
    })
}

const insertFile = (group, name, user_id) => {
    return new Promise(async (resolve, reject) => {
        const connection = await getConnection()
        try {
            const [results] = await connection.query(commands.CREATE_FILE(group, name, user_id))
            resolve(results)
        } catch (err) {
            reject(err)
        }
    })
}

const getFiles = () => {
    return new Promise(async (resolve, reject) => {
        const connection = await getConnection()
        try {
            const [results] = await connection.query(commands.GET_FILES)
            resolve(results)
        } catch (err) {
            reject(err)
        }
    })
}

module.exports = {
    createUser,
    getByEmail,
    insertFile,
    getFiles
}