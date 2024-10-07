const XLSX = require('xlsx')
const utils = require('./utils')
// const config = require('./config')
const inet = require('../inet/query')
const files = require('../../controller/files')
const {
    WORKING_SEASON,
    WORKING_NUMBER,
    ORDER_COLOR,
    MATERIAL_CODE,
    T2_SUPPLIER_CODE,
    ARTICLE,
    BOM_PART_GROUP_NUMBER,
    BOM_PART_COLOR_CODE,
    BOM_PART_COLOR_NAME,
    YIELD,
    MATERIAL_TYPE,
    T1_FACTORY_CODE
} = require('./fields')

const KEYS_GROUPING = [
    WORKING_NUMBER,
    MATERIAL_CODE,
    T2_SUPPLIER_CODE,
    ARTICLE,
    BOM_PART_GROUP_NUMBER,
    T1_FACTORY_CODE
]

const categoryMapping = {
    '01': {
        name: 'Fabric',
        match: ['fabric']
    },
    '02': {
        name: 'Accessories',
        match: ['trim']
    }
}

const filterByCategory = (data, category) => {
    const compare = categoryMapping[category].match
    return data.filter((item) => {
        return compare.includes(item[MATERIAL_TYPE].toLowerCase())
    })
}

const getData = (file) => {
    return new Promise(async (resolve, reject) => {
        const buffer = await files.getFileBuffer(`/group_two/${file}`)
        const workbook = XLSX.read(buffer)
        resolve(XLSX.utils.sheet_to_json(workbook.Sheets['data']))
    })
}

const filterByStyle = (data, season, style) => {
    return data.filter((item) => item[WORKING_SEASON] == season && item[WORKING_NUMBER] == style)
}

const convertToUniversalFormat = (item) => {
    return {
        season: item[WORKING_SEASON],
        style: item[WORKING_NUMBER],
        combi: item[ARTICLE],
        materia_code: item[BOM_PART_GROUP_NUMBER],
        color_code: item['color_code'],
        vendor: item['vendor'],
        cons: item[YIELD],
        category: item[MATERIAL_TYPE],
        source: item
    }
}

const mapToMasterFormat = (data) => {
    return data.map(convertToUniversalFormat)
}

const getSingleColorCode = (data) => {
    return {
        ...data,
        color_code: data[BOM_PART_COLOR_CODE],
        color_name: data[BOM_PART_COLOR_NAME]
    }
}

const mapColorCode = (data) => {
    const codes = data.map((item) => item[BOM_PART_COLOR_CODE]).join('/')
    const names = data.map((item) => item[BOM_PART_COLOR_NAME]).join('/')
    return {
        ...data[0],
        color_code: codes,
        color_name: names
    }
}

const groupItemByKeys = (data) => {
    const groupByKeys = data.reduce((result, item) => {
        const keys = KEYS_GROUPING.map((key) => item[key]).join('#')
        return {
            ...result,
            [keys]: result[keys] ? [...result[keys], item] : [item]
        }
    }, {})
    return Object.keys(groupByKeys).reduce((result, key) => {
        if(groupByKeys[key].length === 1) {
            return [...result, getSingleColorCode(groupByKeys[key][0])]
        }

        const color_order_len = groupByKeys[key].reduce((result, item) => {
            if(item[ORDER_COLOR]) {
                return result + 1
            }

            return result
        }, 0)

        if(color_order_len === 0) {
            return [...result, getSingleColorCode(groupByKeys[key][0])]
        } 

        const readyToOrder = groupByKeys[key].filter((item) => item[ORDER_COLOR] !== null && item[ORDER_COLOR] !== undefined) 
        readyToOrder.sort((a, b) => a[ORDER_COLOR] - b[ORDER_COLOR])
        return [...result, mapColorCode(readyToOrder)]
    }, [])
}

const mapSuppliers = (suppliers) => (d) => {
    return {
        ...d,
        vendor: suppliers.find((s) => s.Code === d[T2_SUPPLIER_CODE])?.MapCode
    }
}
const poppulateVendors = (data) => {
    return new Promise(async (resolve, reject) => {
        const venderCD = new Set()
        data.forEach((item) => venderCD.add(item[T2_SUPPLIER_CODE]))
        const suppliers = await inet.getAllVendors(Array.from(venderCD))
        resolve(data.map(mapSuppliers(suppliers)))
    })
}


module.exports = {
    getData,
    filterByStyle,
    groupItemByKeys,
    mapToMasterFormat,
    poppulateVendors,
    filterByCategory
}
