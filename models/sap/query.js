const sql = require('mssql')
const commands = require('./commands')
const config = require('./connection')

const knownCategoryMapping = {
    '01': 'XFAB',
    '02': 'XACC',
    '03': 'XPAC'
}
const getCategoryCondition = (categoryCode) => {
    if(!categoryCode)
        return ''

    
    if(knownCategoryMapping[categoryCode])
        return `AND SAP_DT_MaterialMasterHeader_View.MaterialType = '${knownCategoryMapping[categoryCode]}'`
    
    return `AND SAP_DT_MaterialMasterHeader_View.MaterialType NOT IN (${Object.values(knownCategoryMapping).map((v) => `'${v}'`).join(', ')})`
        
}

const getItemsBySeasonAndStyle = (season, style, category, sample) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log(commands.GET_ITEMS_BY_SEASON_AND_STYLE
                .replace(':season', season)
                .replace(':style', style)
                .replace(':category_condition', getCategoryCondition(category)))
            await sql.connect(config)
            const CMD = commands.GET_ITEMS_BY_SEASON_AND_STYLE
            .replace(':season', season)
            .replace(':style', style)
            .replace(':category_condition', getCategoryCondition(category))
            .replace(':alt_bom', sample === 7 ? '02' : '01')
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