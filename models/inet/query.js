const commands = require('./commands')
const getConnection = require('./connection')
const knownCategories = ['01', '02', '03']
const getCategoryCondition = (categoryCode) => {
    if(!categoryCode)
        return ''

    
    if(knownCategories.includes(categoryCode))
        return `AND syg.Category = '${categoryCode}'`
    
    return `AND syg.Category NOT IN (${knownCategories.map((item) => `'${item}'`).join(', ')})`
        
}


const getItemsBySeasonAndStyle = (season, style, sample, category) => {
    return new Promise(async (resolve, reject) => {
        const connection = await getConnection()
        try {
            console.log(
                commands.ITEM_BY_SEASON_AND_STYLE
                    .replaceAll(':season', season)
                    .replaceAll(':style', style)
                    .replaceAll(':sample_type', sample)
                    .replaceAll(':category_condition', getCategoryCondition(category))
            )
            const [results] = await connection.query(
                commands.ITEM_BY_SEASON_AND_STYLE
                    .replaceAll(':season', season)
                    .replaceAll(':style', style)
                    .replaceAll(':sample_type', sample)
                    .replaceAll(':category_condition', getCategoryCondition(category))
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