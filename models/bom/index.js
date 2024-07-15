const XLSX = require('xlsx')
const utils = require('./utils')
const config = require('./config')
const inet = require('../inet/query')

const getData = () => {
    return new Promise((resolve, reject) => {
        const workbook = XLSX.readFile(config.SOURCE_FILE)
        resolve(XLSX.utils.sheet_to_json(workbook.Sheets[config.DATA_TAB]))
    })
}

const getBySeason = (season, style) => {
    return new Promise(async (resolve) => {
        const data = await getData()
        const activeRows = utils.getValidItemByStatus(data)
        const targetItems = utils.filterBySeasonAndStyle(activeRows, season, style)
        const rows = utils.groupDataRow(targetItems)
        const withSuppliers = await utils.poppulateVendors(rows)
        resolve(utils.transformToMainFormat(withSuppliers))
    })
}

module.exports = {
    getBySeason
}