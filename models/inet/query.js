const commands = require('./commands')
const getConnection = require('./connection')


const getItemsBySeasonAndStyle = (season, style, sample) => {
    return new Promise(async (resolve, reject) => {
        const connection = await getConnection()
        try {
            const [results] = await connection.query(
                commands.ITEM_BY_SEASON_AND_STYLE
                    .replace(':season', season)
                    .replace(':style', style)
                    .replace(':sample_type', sample)
                )
            resolve(results)
        } catch (err) {
            reject(err)
        }
    })
}

const getAllVendors = (codes) => {
    return new Promise(async (resolve, reject) => {
        const connection = await getConnection()
        try {
            const vendors = codes.map((c) => `"${c}"`).join(', ')
            const [results] = await connection.query(commands.GET_VENDORS.replace(':vendors', vendors));
            resolve(results)
        } catch (err) {
            reject(err)
        }
    })
}

module.exports = {
    getItemsBySeasonAndStyle,
    getAllVendors
}