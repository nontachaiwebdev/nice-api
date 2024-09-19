const XLSX = require('xlsx')
const utils = require('./utils')
const config = require('./config')
const inet = require('../inet/query')
const files = require('../../controller/files')

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

const getBySeason = (season, style, file) => {
    return new Promise(async (resolve) => {
        const data = await getData(file)
        const activeRows = utils.getValidItemByStatus(data)
        console.log('activeRows', activeRows.length)
        const targetItems = utils.filterBySeasonAndStyle(activeRows, season, style)
        console.log('targetItems', targetItems.length)
        const rows = utils.groupDataRow(targetItems)
        const withSuppliers = await utils.poppulateVendors(rows)
        resolve(utils.transformToMainFormat(withSuppliers))
    })
}

const getCategories = (file) => {
    return new Promise(async (resolve) => {
        const data = await getData(file)
        // const styles = new Set()
        // data.forEach((item) => styles.add(item['STYLE_NBR']))
        const seasonsAndStyles = data.reduce((result, item) => {
            const { SEASON_CD, SEASON_YR } = item
            const season = `${SEASON_CD}${SEASON_YR.slice(-2)}`

            return {
                ...result,
                [season]: result[season] ? (result[season].includes(item['STYLE_NBR']) ? [...result[season]] : [...result[season], item['STYLE_NBR']]) : [item['STYLE_NBR']]
            }
        }, {})
        // const activeRows = utils.getValidItemByStatus(data)
        // console.log('activeRows', activeRows.length)
        // const targetItems = utils.filterBySeasonAndStyle(activeRows, season, style)
        // console.log('targetItems', targetItems.length)
        // const rows = utils.groupDataRow(targetItems)
        // const withSuppliers = await utils.poppulateVendors(rows)
        resolve(seasonsAndStyles)
    })
}

module.exports = {
    getBySeason,
    getCategories
}