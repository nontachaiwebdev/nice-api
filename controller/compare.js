const engine = require('../engine')
const inet = require('../models/inet')
const sap = require('../models/sap')
const bom = require('../models/bom')
const compareEngine = require('../engine/compare')
const mur = require('../models/mur/utils')
const murIndex = require('../models/mur')
const nice = require('../models/nice')

const compare = async (req, res, next) => {
    const { season, style } = req.params
    const bomData = await bom.getBySeason(season, style, req.body.file, req.body?.category)
    const inetData = await inet.getItemsBySeasonAndStyle(season, style, req.body?.sample, req.body?.category)

    const sapData = await sap.getItemsBySeasonAndStyle(season, style, req.body?.category, req.body?.sample)
    console.log(sapData)
    const bomToInet = compareEngine.compareBomWithInet(bomData, inetData)
    const bomToSap = compareEngine.compareBomWithSap(inetData, sapData)
    res.send({
        bomToInet,
        bomToSap
    })
}

const murCompare = async (req, res, next) => {
    const { season, style } = req.params
    // const data = await mur.getData(req.body.file)
    // const matchedStyle = mur.filterByStyle(data, season, style)
    const matchedStyle = await nice.getMurDataBySeasonAndStyle(season, style, req.body.file)

    const dt = mur.groupItemByKeys(matchedStyle)
    let withSuppliers = await mur.poppulateVendors(dt)
    if(req.body?.category)
        withSuppliers = mur.filterByCategory(withSuppliers, req.body?.category)
    console.log(withSuppliers)
    const murData = mur.mapToMasterFormat(withSuppliers)
    const inetData = await inet.getItemsBySeasonAndStyle(season, style, req.body?.sample, req.body?.category)
    const sapData = await sap.getItemsBySeasonAndStyle(season, style, req.body?.category, req.body?.sample)
    // console.log(sapData)
    const bomToInet = compareEngine.compareBomWithInet(murData, inetData)
    const bomToSap = compareEngine.compareBomWithSap(inetData, sapData)
    res.send({
        bomToInet,
        bomToSap
    })
}

const compareSap = async (req, res, next) => {
    await sap.getAllItems()
}

const getCategoryByFileName = async (req, res, next) => {
    // const categories = await bom.getCategories(req.params.name)
    const seasonsAndStyles = await nice.getSeasonsAndStyles(req.params.name)
    const result = seasonsAndStyles.reduce((acc, item) => {
        // If the season doesn't exist in the accumulator, create an array for it
        if (!acc[item.season]) {
            acc[item.season] = [];
        }
        
        // Add the style to the season's array
        acc[item.season].push(item.style);
        
        return acc;
    }, {});
    res.send(result)
}

const getCategoryByMurFileName = async (req, res, next) => {
    // const categories = await murIndex.getCategories(req.params.name)
    const seasonsAndStyles = await nice.getSeasonsAndStylesMur(req.params.name)
    const result = seasonsAndStyles.reduce((acc, item) => {
        // If the season doesn't exist in the accumulator, create an array for it
        if (!acc[item.season]) {
            acc[item.season] = [];
        }
        
        // Add the style to the season's array
        acc[item.season].push(item.style);
        
        return acc;
    }, {});

    res.send(result)
}


module.exports = {
    compare,
    compareSap,
    getCategoryByFileName,
    getCategoryByMurFileName,
    murCompare
}