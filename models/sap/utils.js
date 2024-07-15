const toMainFormat = (d) => {
    return {
        season: d.Season,
        style: d.Style,
        combi: d.Combi,
        materia_code: d.MatrCode,
        color_code: d.Color,
        vendor: d.BrandID,
        // part: d.PartNo,
        cons: d.Consumption,
        source: d
    }
}
const transformToMainFormat = (data) => data.map(toMainFormat)

module.exports = {
    transformToMainFormat
}