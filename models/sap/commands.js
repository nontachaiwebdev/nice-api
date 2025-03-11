const GET_ITEMS_BY_SEASON_AND_STYLE = `
SELECT        
dbo.SAP_DT_MaterialMasterHeader_View.BrandID, dbo.SAP_DT_MaterialMasterHeader_View.Attibute5 AS Style, dbo.SAP_DT_MaterialMasterHeader_View.Combi, dbo.SAP_DT_MaterialSeasonData_View.Season, 
    dbo.SAP_DT_BomHeader_View.Plant, SAP_DT_MaterialMasterHeader_View_1.Attibute5 AS MatrCode, SAP_DT_MaterialMasterHeader_View_1.Combi AS Color, dbo.SAP_DT_MaterialMasterHeader_View.SIZE1, 
    SAP_DT_MaterialMasterHeader_View_1.MaterialDesc, dbo.SAP_DT_BomItem_View.PartNo, dbo.SAP_DT_BomItem_View.PartName, dbo.SAP_DT_BomItem_View.Consumption, dbo.SAP_DT_BomItem_View.UOM, 
    dbo.SAP_DT_BomItem_View.Deleted
FROM dbo.SAP_DT_MaterialMasterHeader_View AS SAP_DT_MaterialMasterHeader_View_1 RIGHT OUTER JOIN
dbo.SAP_DT_BomItem_View ON SAP_DT_MaterialMasterHeader_View_1.MaterialNo = dbo.SAP_DT_BomItem_View.Component RIGHT OUTER JOIN
dbo.SAP_DT_BomHeader_View LEFT OUTER JOIN
dbo.SAP_DT_MaterialSeasonData_View ON dbo.SAP_DT_BomHeader_View.MaterialNo = dbo.SAP_DT_MaterialSeasonData_View.MaterialNo LEFT OUTER JOIN
dbo.SAP_DT_MaterialMasterHeader_View ON dbo.SAP_DT_BomHeader_View.MaterialNo = dbo.SAP_DT_MaterialMasterHeader_View.MaterialNo ON 
dbo.SAP_DT_BomItem_View.BomCategory = dbo.SAP_DT_BomHeader_View.BomCategory AND dbo.SAP_DT_BomItem_View.AltBom = dbo.SAP_DT_BomHeader_View.AltBom AND 
dbo.SAP_DT_BomItem_View.Bom = dbo.SAP_DT_BomHeader_View.Bom AND dbo.SAP_DT_BomItem_View.Plant = dbo.SAP_DT_BomHeader_View.Plant AND 
dbo.SAP_DT_BomItem_View.MaterialNo = dbo.SAP_DT_BomHeader_View.MaterialNo LEFT OUTER JOIN
dbo.SAP_DT_MaterialPlantData_View ON dbo.SAP_DT_BomHeader_View.Plant = dbo.SAP_DT_MaterialPlantData_View.Plant AND 
dbo.SAP_DT_BomHeader_View.MaterialNo = dbo.SAP_DT_MaterialPlantData_View.MaterialNo
WHERE (dbo.SAP_DT_MaterialMasterHeader_View.Attibute5 = N':style') 
AND (dbo.SAP_DT_MaterialSeasonData_View.Season = N':season')
AND dbo.SAP_DT_BomItem_View.AltBom = :alt_bom
:category_condition; 
`

module.exports = {
    GET_ITEMS_BY_SEASON_AND_STYLE
}