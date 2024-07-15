const sql = require('mssql')
const commands = require('./commands')
const config = require('./connection')

const getItemsBySeasonAndStyle = (season, style) => {
    return new Promise(async (resolve, reject) => {
        try {
            await sql.connect(config)
            const CMD = commands.GET_ITEMS_BY_SEASON_AND_STYLE.replace(':season', season).replace(':style', style)
            const result = await sql.query(CMD)
            resolve(result)
        } catch (err) {
            reject(err)
        }
    })
}

module.exports = {
    getItemsBySeasonAndStyle
}