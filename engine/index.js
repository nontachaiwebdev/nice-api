const XLSX = require('xlsx')
const utils = require('./utils')
const inet = require('../models/inet/query')

const compareKeys = {
    inet: ['Season', 'Style', 'Combi', 'Material', 'Code', 'Color', 'Vendor'],
    sap: ['Season', 'Style', 'Combi', 'Material', 'Code', 'Color', 'Vendor', 'Part']
}

const getReport = (source, target) => {

}

const getBomData = (season, style) => {
    return new Promise((resolve) => {
        const workbook = XLSX.readFile(`${__dirname}/../source/BOM_PRODUCTION.xlsb`)
        const sheet_name_list = workbook.SheetNames
        const xlData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]])
        const shapedList = xlData.map((dt) => utils.getShapedDataFromBOM(dt))
        // resolve(utils.getBySeasonAndStyle(shapedList, season, style))
    })
}

const getRowsFromRawData = async (data) => {
    const venderCD = new Set()
    data.forEach((item) => venderCD.add(item?.VEND_CD))
    const suppliers = await inet.getAllVendors(Array.from(venderCD))
    const activeRows = data.filter((dt) => !['K', 'P'].includes(dt?.STATUS))
    const includedVendor = activeRows.map((dt) => ({ ...dt, VENDOR_MAP_CODE: suppliers.find((s) => s.Code === dt.VEND_CD)?.MapCode }))
    const groupedItems = utils.groupSameItem(includedVendor)
    const items = Object.keys(groupedItems).map((key) => {
        if(groupedItems[key].length > 1) {
            const sorted = groupedItems[key].sort(utils.sortByORD)
            const colors = sorted.reduce((result, s) => {
                return {
                    color_codes: [...result.color_codes, s.ITEM_COLOR_CD],
                    color_descriptions: [...result.color_descriptions, s.ITEM_COLOR_ABRV]
                }
            }, {
                color_codes: [],
                color_descriptions: []
            })
            return {
                ...groupedItems[key][0],
                ...{
                    color_codes: colors?.color_codes.join('/'),
                    color_descriptions: colors?.color_descriptions.join('/')
                }
            }
        }

        return {
            ...groupedItems[key][0],
            color_codes: groupedItems[key][0].ITEM_COLOR_CD,
            color_descriptions: groupedItems[key][0].ITEM_COLOR_ABRV
        }

    })
    return items
}

const compareWithInet = async (data, inetData) => {
    const bomSummary = data.reduce((result, dt) => {
        console.log(dt)
        const bom = utils.bomToUniversalFormat(dt)
        const matched = inetData.find((d) => {
            const compared = utils.inetCompareConfig.map((config) => {
                return bom[config.bom] == d[config.inet]
            })
            return compared.filter((f) => !f).length == 0
        })
        if(matched) {
            return {
                ...result,
                update: [...result.update, dt]
            }
        }

        return {
            ...result,
            add: [...result.add, dt]
        }
    }, {
        add: [],
        update: []
    })
    return bomSummary
}

const compareWithBom = async (data, inetData) => {
    const intSummary = inetData.reduce((result, dt) => {
        const matched = data.find((d) => {
            const bom = utils.bomToUniversalFormat(d)
            const compared = utils.inetCompareConfig.map((config) => {
                return bom[config.bom] == dt[config.inet]
            })
            return compared.filter((f) => !f).length == 0
        })
        if(matched) {
            return {
                ...result,
                update: [...result.update, dt]
            }
        }

        return {
            ...result,
            delete: [...result.delete, dt]
        }
    }, {
        delete: [],
        update: []
    })
    return intSummary
}

module.exports = {
    getBomData,
    getRowsFromRawData,
    compareWithInet,
    compareWithBom
}