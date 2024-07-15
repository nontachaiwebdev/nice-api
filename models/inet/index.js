const query = require('./query')
const utils = require('./utils')

const getItemsBySeasonAndStyle = (season, style, sample) => {
    return new Promise(async (resolve, reject) => {
        try {
            const data = await query.getItemsBySeasonAndStyle(season, style, sample)
            resolve(utils.transformToMainFormat(data))
        } catch (err) {
            reject(err)
        }
    })
}

const getVendors = (codes) => {
    return new Promise(async (resolve, reject) => {
        try {
            if(codes.length === 0)
                return resolve([])

            const vendors = await query.getAllVendors(codes)
            resolve(vendors)
        } catch (err) {
            console.log(err)
            reject(err)
        }
    })
}

module.exports = {
    getItemsBySeasonAndStyle,
    getVendors
}