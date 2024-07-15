const fs = require('fs')

const getFiles = () => {
    return new Promise((resolve, reject) => {
        fs.readdir(`${__dirname}/../source`, (err, files) => {
            resolve(files)
        })
    })
}

const getSources = async (req, res, next) => {
    const files = await getFiles()
    res.send({
        data: files
    })
}

module.exports = {
    getSources
}