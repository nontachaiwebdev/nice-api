const toMainFormat = (d) => {
    return {
        season: d.Season,
        style: d.Style,
        combi: d.Combi,
        materia_code: d.MatrCode,
        color_code: d.Color,
        vendor: d.MaterialDesc.split('|')[1], //MaterialDesc,
        cons: d.Consumption,
        source: d,
        size: d.SIZE1
    }
}
const transformToMainFormat = (data) => data.map(toMainFormat)

module.exports = {
    transformToMainFormat
}