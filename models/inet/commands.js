const ITEM_BY_SEASON_AND_STYLE = `SELECT smomstr.SmOrderNo, smomstr.season, smomstr.Customer, smycway.ColorGrp,smomstr.SmpType, smomstr.Style,
smomstr.GmtType, smomstr.SysLMUser, smomstr.SysLMDate, smomstr.SysOwner, smomstr.\`Status\`, smomstr.ExtDesc1 AS Category,
smobom.PartName, smobom.MatrCode, smobom.MatrColor, smobom.Unit, smobom.MatrSize, smycway.GmtColor, smycway.Color Color_Code,
sygcolor.Description Color_Name, sycsupp.\`Code\` Supplier_Code, sycsupp.\`Name\` Supplier_Name, smobom.UCons as cons
FROM smomstr Left JOIN smobom ON smomstr.SmOrderNo = smobom.SmOrderNo Left JOIN smycway ON smobom.SmOrderNo = smycway.SmOrderNo
AND smobom.MatrColor = smycway.ColorGrp Left JOIN sycsupp ON smobom.Supplier = sycsupp.\`Code\` 
Left JOIN sygcolor ON smycway.Color  = sygcolor.Color
where smomstr.season = ':season' and smomstr.Style = ':style'`

// smomstr.SmpType

const GET_VENDORS = `SELECT Company, TableName, Code, MapCode
FROM nicetraining.ngcodemap
WHERE Code IN (:vendors);`

module.exports = {
    ITEM_BY_SEASON_AND_STYLE,
    GET_VENDORS
}