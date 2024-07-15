// ['Season', 'Style', 'Combi', 'Material', 'Code', 'Color', 'Vendor', 'Part']

const getSeason = (data) => {
    const code = data['SEASON_CD']
    const year = data['SEASON_YR'].slice(-2)
    return `${code}${year}`
}

// const mappingConfig = {
//     bom: {
//         season: getSeason,
//         style: 'STYLE_NM',
//         combi: 'STYLE_CW_CD',
//         material: 'ITEM_NBR',
//         color: ,
//         vendor: ,
//         part: 
//     }
// }

const getShapedDataFromBOM = (data) => {
    return {
        MSC_CODE: data['MSC_CODE'],
        MSC_LEVEL_1: data['MSC_LEVEL_1'] ? data['MSC_LEVEL_1'].replaceAll("'s", "") : null,
        MSC_LEVEL_2: data['MSC_LEVEL_2'],
        MSC_LEVEL_3: data['MSC_LEVEL_3'],
        SILHOUETTE: data['SILHOUETTE'],
        SEASON_CD: data['SEASON_CD'],
        SEASON_YR: data['SEASON_YR'] ? data['SEASON_YR'].slice(-2) : null,
        STYLE_NM: data['STYLE_NM'],
        STYLE_NBR: data['STYLE_NBR'],
        STYLE_CW_CD: data['STYLE_CW_CD'],
        PLUG_CW_CD: data['PLUG_CW_CD'],
        FACTORY: data['FACTORY'],
        STATUS: data['STATUS'],
        DESCRIPTION: data['DESCRIPTION'],
        ITEM_TYPE_1: data['ITEM_TYPE_1'],
        ITEM_NBR: data['ITEM_NBR'],
        ITEM_COLOR_ORD: data['ITEM_COLOR_ORD'],
        'GCW#': data['GCW#'],
        GCW_ORD: data['GCW_ORD'],
        GCW_ART_DESCRIPTION: data['GCW_ART_DESCRIPTION'],
        ITEM_COLOR_CD: data['ITEM_COLOR_CD'],
        ITEM_COLOR_NM: data['ITEM_COLOR_NM'],
        ITEM_COLOR_ABRV: data['ITEM_COLOR_ABRV'],
        VEND_CD: data['VEND_CD'],
        VEND_LO: data['VEND_LO'],
        VEND_NM: data['VEND_NM'],
        QTY: data['QTY'],
        UOM: data['UOM'],
        BOM_UPDATE_DT: data['BOM_UPDATE_DT'],
        BOM_ITM_UPDATE_DT: data['BOM_ITM_UPDATE_DT'],
        COMPONENT_ORD: data['COMPONENT_ORD']
    }
}

const getBySeasonAndStyle = (data, season, styleCode) => {
    return data.filter((dt) => {
        const code =`${dt.SEASON_CD}${dt.SEASON_YR}`
        const style = dt.STYLE_NBR
        return styleCode === style
    })
}

const groupSameItem = (data) => {
    return data.reduce((result, item) => {
        return {
            ...result,
            [`${item?.ITEM_NBR}#${item?.STYLE_CW_CD}`]: result[`${item?.ITEM_NBR}#${item?.STYLE_CW_CD}`] ? [...result[`${item?.ITEM_NBR}#${item?.STYLE_CW_CD}`], item] : [item]
        }
    }, {})
}

const bomToUniversalFormat = (item) => {
    return {
        season: `${item.SEASON_CD}${item.SEASON_YR}`,
        style: item.STYLE_NBR,
        combi: String(item.STYLE_CW_CD).padStart(3, '0'), // GmtColor
        materialCode: item.ITEM_NBR,
        vendor: item.VENDOR_MAP_CODE,
        raw_data: item,
        color_code: item.color_codes,
        color_description: item.color_descriptions
    }
}

const sortByORD = (x, y) => {
    if (x.COMPONENT_ORD < y.COMPONENT_ORD) {
        return -1;
    }
    if (x.COMPONENT_ORD > y.COMPONENT_ORD) {
        return 1;
    }
        return 0;
}

const inetCompareConfig = [
    {
        bom: 'season',
        inet: 'season'
    },
    {
        bom: 'style',
        inet: 'Style'
    },
    {
        bom: 'combi',
        inet: 'GmtColor'
    },
    {
        bom: 'materialCode',
        inet: 'MatrCode'
    },
    {
        bom: 'vendor',
        inet: 'Supplier_Code'
    }
]

module.exports = {
    getShapedDataFromBOM,
    getBySeasonAndStyle,
    groupSameItem,
    sortByORD,
    bomToUniversalFormat,
    inetCompareConfig
}