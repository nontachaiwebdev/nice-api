const engine = require('../engine')
const inet = require('../models/inet')
const sap = require('../models/sap')
const bom = require('../models/bom')
const compareEngine = require('../engine/compare')
const mur = require('../models/mur/utils')
const murIndex = require('../models/mur')

const compare = async (req, res, next) => {
    const { season, style } = req.params
    const bomData = await bom.getBySeason(season, style, req.body.file, req.body?.category)
    const inetData = await inet.getItemsBySeasonAndStyle(season, style, req.body?.sample, req.body?.category)
    const sapData = await sap.getItemsBySeasonAndStyle(season, style, req.body?.category)
    const bomToInet = compareEngine.compareBomWithInet(bomData, inetData)
    const bomToSap = compareEngine.compareBomWithSap(bomData, sapData)
    res.send({
        bomToInet,
        bomToSap
    })
}

const murCompare = async (req, res, next) => {
    const { season, style } = req.params
    const data = await mur.getData(req.body.file)
    const matchedStyle = mur.filterByStyle(data, season, style)
    const dt = mur.groupItemByKeys(matchedStyle)
    let withSuppliers = await mur.poppulateVendors(dt)
    if(req.body?.category)
        withSuppliers = mur.filterByCategory(withSuppliers, req.body?.category)
    const murData = mur.mapToMasterFormat(withSuppliers)
    const inetData = await inet.getItemsBySeasonAndStyle(season, style, req.body?.sample, req.body?.category)
    const sapData = await sap.getItemsBySeasonAndStyle(season, style)
    const bomToInet = compareEngine.compareBomWithInet(murData, inetData)
    const bomToSap = compareEngine.compareBomWithSap(murData, sapData)
    res.send({
        bomToInet,
        bomToSap
    })
}

const compareSap = async (req, res, next) => {
    await sap.getAllItems()
}

const getCategoryByFileName = async (req, res, next) => {
    const categories = await bom.getCategories(req.params.name)
    res.send(categories)
}

const getCategoryByMurFileName = async (req, res, next) => {
    const categories = await murIndex.getCategories(req.params.name)
    res.send(categories)
}


module.exports = {
    compare,
    compareSap,
    getCategoryByFileName,
    getCategoryByMurFileName,
    murCompare
}