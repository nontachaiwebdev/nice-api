// const ITEM_BY_SEASON_AND_STYLE = `SELECT smomstr.SmOrderNo, smomstr.season, smomstr.Customer, smycway.ColorGrp,smomstr.SmpType, smomstr.Style,
// smomstr.GmtType, smomstr.SysLMUser, smomstr.SysLMDate, smomstr.SysOwner, smomstr.\`Status\`, smomstr.ExtDesc1 AS Category,
// smobom.PartName, smobom.MatrCode, smobom.MatrColor, smobom.Unit, smobom.MatrSize, smycway.GmtColor, smycway.Color Color_Code,
// sygcolor.Description Color_Name, sycsupp.\`Code\` Supplier_Code, sycsupp.\`Name\` Supplier_Name, smobom.UCons as cons
// FROM smomstr Left JOIN smobom ON smomstr.SmOrderNo = smobom.SmOrderNo Left JOIN smycway ON smobom.SmOrderNo = smycway.SmOrderNo
// AND smobom.MatrColor = smycway.ColorGrp Left JOIN sycsupp ON smobom.Supplier = sycsupp.\`Code\` 
// Left JOIN sygcolor ON smycway.Color  = sygcolor.Color
// where smomstr.season = ':season' and smomstr.Style = ':style'`

const ITEM_BY_SEASON_AND_STYLE = `
    SELECT sm.SmOrderNo, sm.season, sm.Customer
    ,sm.SmpType, sm.Style,
    sm.GmtType, sm.SysLMUser, sm.SysLMDate, sm.SysOwner, sm.\`Status\`, sm.ExtDesc1 Category,
    sb.PartName, sb.MatrCode, sb.MatrColor, sb.Unit, sb.MatrSize, sw.GmtColor, sw.Color Color_Code,
    sc.Description Color_Name, su.\`Code\` Supplier_Code, su.\`Name\` Supplier_Name,CardNo, syg.Category
    FROM smomstr sm
    Left JOIN smobom sb ON sm.SmOrderNo = sb.SmOrderNo 
    Left JOIN smycway sw ON sb.SmOrderNo = sw.SmOrderNo AND sb.MatrColor = sw.ColorGrp 
    Left JOIN sycsupp su ON sb.Supplier = su.\`Code\` 
    Left JOIN (select Cardno,Color,Description from sygcolor where cardno='') sc ON sw.Color  = sc.Color
    INNER JOIN sygmcls syg ON sb.MatrClass = syg.Code
    WHERE
    sm.Style = ':style' AND
    sm.season = ':season' AND
    sm.\`Status\` <> 'X' 
    AND sw.color <> '*'
    AND sw.GmtColor is not null
    AND sm.SmpType = '13'
    UNION 
    SELECT sm.SmOrderNo, sm.season, sm.Customer
    ,sm.SmpType, sm.Style,
    sm.GmtType, sm.SysLMUser, sm.SysLMDate, sm.SysOwner, sm.\`Status\`, sm.ExtDesc1 Category,
    sb.PartName, sb.MatrCode, '' MatrColor, sb.Unit, sb.MatrSize, sy.color GmtColor, sb.matrcolor Color_Code,
    sc.Description Color_Name, su.\`Code\` Supplier_Code, su.\`Name\` Supplier_Name,CardNo, syg.Category
    FROM smomstr sm
    Left JOIN smobom sb ON sm.SmOrderNo = sb.SmOrderNo 
    LEFT JOIN smycolor sy ON sb.smorderno = sy.smorderno
    Left JOIN sycsupp su ON sb.Supplier = su.\`Code\` 
    Left JOIN (select Cardno,Color,Description from sygcolor where Cardno='') sc ON sy.Color  = sc.Color
    INNER JOIN sygmcls syg ON sb.MatrClass = syg.Code
    WHERE
    sm.Style = ':style' AND
    sm.season = ':season' AND
    sm.\`Status\` <> 'X'
    AND sm.SmpType = '13' 
    AND (LENGTH(sb.matrcolor) > 2 or sb.matrcolor is null or sb.matrcolor ='')
`

// smomstr.SmpType

const GET_VENDORS = `SELECT Company, TableName, Code, MapCode
FROM nicetraining.ngcodemap
WHERE Code IN (:vendors);`

module.exports = {
    ITEM_BY_SEASON_AND_STYLE,
    GET_VENDORS
}



