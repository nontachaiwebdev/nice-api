const nice = require('../models/nice')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const SECRET = 'thesecretoflife'

const createUser = async (req, res, next) => {
    await nice.createUser(req.body)
    res.end()
}

const authen = async (req, res, next) => {
    const [user] = await nice.getUserByEmail(req.body.email)
    console.log(user)
    if(!user || !bcrypt.compareSync(req.body.password, user.password)) {
        res.sendStatus(404)
    }

    console.log(user)
    const token = jwt.sign(user, SECRET)
    res.send({ token })
} 

const getProfile = async (req, res, next) => {
    const profile = jwt.verify(req.params.token, SECRET)
    res.send({ profile })
}

module.exports = {
    createUser,
    authen,
    getProfile
}