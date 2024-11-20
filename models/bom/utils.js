const fields = require('./fields')
const config = require('./config')
const inet = require('../inet')

const isValidStatus = (d) => !config.INVALID_STATUS.includes(d[fields.STATUS])
const getValidItemByStatus = (data) => data.filter(isValidStatus)

const getSeasonCode = (d) => `${d[fields.SEASON_CODE]}${d[fields.SEASON_YEAR].slice(-2)}`
const getStyle = (d) => d[fields.STYLE_NUMBER]
const isSameSeasonAndYear = (data, season, style) => getSeasonCode(data) === season && getStyle(data) === style
const filterBySeasonAndStyle = (data, season, style) => data.filter((d) => isSameSeasonAndYear(d, season, style))

const isGcwColor = (d) => !!d[fields.GCW_COLOR] 
const groupByStyleAndMaterial = (result, d) => {
    const code = `${d[fields.STYLE_CODE]}#${d[fields.MATERIAL_NUMBER]}`
    const grouped = {
        ...result,
        [code]: result[code] ? [...result[code], d] : [d]
    }
    // return grouped;
    return Object.keys(grouped).reduce((result, key) => {
        const items = grouped[key]
        if (items.length > 1) {
            if(isGcwColor(items[0]))  {
                return {
                    ...result,
                    [key]: grouped[key].reduce((result, item) => {
                        const duplicated = result.find((r) => r['GCW_ORD'] === item['GCW_ORD'])
                        if(duplicated)
                            return result

                        return [...result, item]
                    }, [])
                }
            } else {
                return {
                    ...result,
                    [key]: grouped[key].reduce((result, item) => {
                        const duplicated = result.find((r) => r['ITEM_COLOR_ORD'] === item['ITEM_COLOR_ORD'])
                        if(duplicated)
                            return result

                        return [...result, item]
                    }, [])
                }
            }
        } else {
            return {
                ...result,
                [key]: grouped[key]
            }
        }
    }, {})
}

// ASC Sort function
const ordSort = (key) => (x, y) => {
    if (x[key] < x[key]) return -1;
    if (x[key] > x[key]) return 1;
    return 0;
}

const getGcwCode = (components) => {
    components.sort(ordSort(fields.GCW_ORD))
    const gcwNumber = components[0][fields.GCW_COLOR]
    const colors = components.map((c) => c[fields.ITEM_COLOR_CODE])
    return `GCW#${gcwNumber} ${colors.join('/')}`
}
const getNormalColorCode = (components) => {
    components.sort(ordSort(fields.COMPONENT_ORD))
    return components.map((c) => c[fields.ITEM_COLOR_CODE]).filter((cl) => (cl && cl.length > 0)).join('/')
}
const getColor = (components) => isGcwColor(components[0]) ? getGcwCode(components) : getNormalColorCode(components)
const getRowWithColor = (components) => ({
    ...components[0],
    color_code: getColor(components)
})
const reduceItemRows = (data) => (result, key) => {
    return [...result, getRowWithColor(data[key])] 
}
const getValidRowFromGrouped = (data) => {
    const reduceFunc = reduceItemRows(data)
    return Object.keys(data).reduce(reduceFunc, [])
}
const groupDataRow = (data) => {
    const groupedByStyleAndMaterial = data.reduce(groupByStyleAndMaterial, {})
    const validData = getValidRowFromGrouped(groupedByStyleAndMaterial)
    return validData
}

const mapSuppliers = (suppliers) => (d) => {
    return {
        ...d,
        vendor: suppliers.find((s) => s.Code === d[fields.VENDOR_CODE])?.MapCode
    }
}
const poppulateVendors = (data) => {
    return new Promise(async (resolve, reject) => {
        const venderCD = new Set()
        data.forEach((item) => venderCD.add(item[fields.VENDOR_CODE]))
        const suppliers = await inet.getVendors(Array.from(venderCD))
        resolve(data.map(mapSuppliers(suppliers)))
    })
}

const toMainFormat = (d) => {
    return {
        season: getSeasonCode(d),
        style: getStyle(d),
        combi: d[fields.STYLE_CODE],
        materia_code: d[fields.MATERIAL_NUMBER],
        color_code: d.color_code,
        vendor: d.vendor,
        // part: d.PartName,
        cons: d[fields.QTY],
        // msc_code: d[fields.MSC_CODE],
        category: d[fields.CATEGORY],
        source: d
    }
}
const transformToMainFormat = (data) => data.map(toMainFormat)

module.exports = {
    filterBySeasonAndStyle,
    getValidItemByStatus,
    groupDataRow,
    transformToMainFormat,
    poppulateVendors,
    transformToMainFormat
}