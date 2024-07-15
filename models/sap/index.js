const query = require('./query')
const utils = require('./utils')

const getItemsBySeasonAndStyle = (season, style) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { recordset: data } = await query.getItemsBySeasonAndStyle(season, style)
            resolve(utils.transformToMainFormat(data))
        } catch (err) {
            reject(err)
        }
    })
}

module.exports = {
    getItemsBySeasonAndStyle
}