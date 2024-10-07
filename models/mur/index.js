const XLSX = require('xlsx')
const utils = require('./utils')
const files = require('../../controller/files')
const {
    WORKING_SEASON,
    WORKING_NUMBER
} = require('./fields')

const getData = (file) => {
    return new Promise(async (resolve, reject) => {
        // const workbook = XLSX.readFile(config.SOURCE_FILE)
        const buffer = await files.getFileBuffer(`/group_two/${file}`)
        const workbook = XLSX.read(buffer)
        resolve(XLSX.utils.sheet_to_json(workbook.Sheets['data']))
    })
}

const getBySeason = (season, style, file) => {
    return new Promise(async (resolve) => {
        const data = await getData(file)
        const activeRows = utils.getValidItemByStatus(data)
        const targetItems = utils.filterBySeasonAndStyle(activeRows, season, style)
        const rows = utils.groupDataRow(targetItems)
        const withSuppliers = await utils.poppulateVendors(rows)
        resolve(utils.transformToMainFormat(withSuppliers))
    })
}

const getCategories = (file) => {
    console.log(file)
    return new Promise(async (resolve) => {
        const data = await getData(file)
        console.log(data)
        const seasonsAndStyles = data.reduce((result, item) => {
            const season = item[WORKING_SEASON]

            if(!item[WORKING_NUMBER])
                return result 

            return {
                ...result,
                [season]: result[season] ? (result[season].includes(item[WORKING_NUMBER]) ? [...result[season]] : [...result[season], item[WORKING_NUMBER]]) : [item[WORKING_NUMBER]]
            }
        }, {})
        console.log(seasonsAndStyles)
        resolve(seasonsAndStyles)
    })
}

module.exports = {
    getBySeason,
    getCategories
}