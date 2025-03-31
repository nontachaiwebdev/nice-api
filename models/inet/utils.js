const toMainFormat = (d) => {
    return {
        season: d.season,
        style: d.Style,
        combi: d.GmtColor,
        materia_code: d.MatrCode,
        color_code: d.Color_Code,
        vendor: d.Supplier_Code,
        cons: d.cons,
        part: d.PartName,
        // msc_code: d[fields.MSC_CODE],
        // part: d.PartNo,
        source: d
    }
}
const transformToMainFormat = (data) => data.map(toMainFormat)

module.exports = {
    transformToMainFormat
}