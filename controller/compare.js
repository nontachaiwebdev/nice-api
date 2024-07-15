const engine = require('../engine')
const inet = require('../models/inet')
const sap = require('../models/sap')
const bom = require('../models/bom')
const compareEngine = require('../engine/compare')

const compare = async (req, res, next) => {
    const { season, style } = req.params
    const bomData = await bom.getBySeason(season, style)
    const inetData = await inet.getItemsBySeasonAndStyle(season, style, req.body?.sample)
    const sapData = await sap.getItemsBySeasonAndStyle(season, style)
    const bomToInet = compareEngine.compareBomWithInet(bomData, inetData)
    const bomToSap = compareEngine.compareBomWithSap(bomData, sapData)
    res.send({
        bomToInet,
        bomToSap
    })
}

const compareSap = async (req, res, next) => {
    await sap.getAllItems()
}



module.exports = {
    compare,
    compareSap
}