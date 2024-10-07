const XLSX = require('xlsx')
const utils = require('./utils')
const config = require('./config')
const inet = require('../inet/query')
const files = require('../../controller/files')

const categoryMapping = {
    '01': {
        name: 'Fabric',
        match: ['fabric']
    },
    '02': {
        name: 'Accessories',
        match: ['trim', 'thread', 'zippers', 'embroidery', 'direct application']
    },
    '03': {
        name: 'Packing',
        match: ['packaging']
    },
    '04': {
        name: 'Other',
        match: ['statement', 'content information', 'care instructions', 'size matrix']
    }
}

const getData = (file) => {
    return new Promise(async (resolve, reject) => {
        // const workbook = XLSX.readFile(config.SOURCE_FILE)
        // console.log(`/group_one/${file}`)
        const buffer = await files.getFileBuffer(`/group_one/${file}`)
        // console.log(buffer)
        const workbook = XLSX.read(buffer)
        resolve(XLSX.utils.sheet_to_json(workbook.Sheets[config.DATA_TAB]))
    })
}

const filterByCategory = (data, category) => {
    const compare = categoryMapping[category].match
    console.log(compare)
    return data.filter((item) => {
        return compare.includes(item['ITEM_TYPE_1'].toLowerCase())
    })
}

const getBySeason = (season, style, file, category) => {
    return new Promise(async (resolve) => {
        const data = await getData(file)
        const activeRows = utils.getValidItemByStatus(data)
        const targetItems = utils.filterBySeasonAndStyle(activeRows, season, style)
        const rows = utils.groupDataRow(targetItems)
        let withSuppliers = await utils.poppulateVendors(rows)
        console.log(withSuppliers.length, category)
        if(category)
            withSuppliers = filterByCategory(withSuppliers, category)
        console.log(withSuppliers.length)
        resolve(utils.transformToMainFormat(withSuppliers))
    })
}

const getCategories = (file) => {
    return new Promise(async (resolve) => {
        const data = await getData(file)
        const seasonsAndStyles = data.reduce((result, item) => {
            const { SEASON_CD, SEASON_YR } = item
            const season = `${SEASON_CD}${SEASON_YR.slice(-2)}`

            return {
                ...result,
                [season]: result[season] ? (result[season].includes(item['STYLE_NBR']) ? [...result[season]] : [...result[season], item['STYLE_NBR']]) : [item['STYLE_NBR']]
            }
        }, {})
        resolve(seasonsAndStyles)
    })
}

module.exports = {
    getBySeason,
    getCategories
}