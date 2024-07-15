const query = require('./query')
const bcrypt = require('bcryptjs')

const createUser = (body) => {
    return new Promise(async (resolve, reject) => {
        try {
            const salt = bcrypt.genSaltSync(10)
            const hash = bcrypt.hashSync(body.password, salt)
            const data = await query.createUser(body, hash)
            resolve(data)
        } catch (err) {
            reject(err)
        }
    })
}

const getUserByEmail = (email) => {
    return new Promise(async (resolve, reject) => {
        try {
            const data = await query.getByEmail(email)
            resolve(data)
        } catch (err) {
            reject(err)
        }
    })
}

const insertFile = (group, name, user_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const data = await query.insertFile(group, name, user_id)
            resolve(data)
        } catch (err) {
            reject(err)
        }
    })
}

const getFiles = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const data = await query.getFiles()
            resolve(data)
        } catch (err) {
            reject(err)
        }
    })
}

module.exports = {
    createUser,
    getUserByEmail,
    insertFile,
    getFiles
}