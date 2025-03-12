const query = require('./query')
const bcrypt = require('bcryptjs')
const getConnection = require('./connection')

const createUser = (body) => {
    return new Promise(async (resolve, reject) => {
        try {
            const salt = bcrypt.genSaltSync(10)
            const hash = bcrypt.hashSync(body.password, salt)
            const data = await query.createUser(body, hash)
            resolve(data)
        } catch (err) {
            reject(err)
        }
    })
}

const getUserByEmail = (email) => {
    return new Promise(async (resolve, reject) => {
        try {
            const data = await query.getByEmail(email)
            resolve(data)
        } catch (err) {
            reject(err)
        }
    })
}

const insertFile = (group, name, user_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const data = await query.insertFile(group, name, user_id)
            resolve(data)
        } catch (err) {
            reject(err)
        }
    })
}

const getFiles = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const data = await query.getFiles()
            console.log(data)
            resolve(data)
        } catch (err) {
            reject(err)
        }
    })
}


async function bulkInsertExcelData(records, fileId, batchSize = 500) {
    try {
        // Prepare the SQL statement
        const sql = `
            INSERT INTO mur_data (
                file_id,
                working_season,
                product_division,
                brand,
                article_creation_center,
                article_key_category_cluster,
                article_key_category,
                article_business_segment,
                sports_category,
                sales_line,
                product_group,
                model,
                working_number,
                article_cc_developer,
                sustainability_and_ethics_compliance,
                product_specialty,
                direct_development,
                brand_partner,
                model_status,
                model_season_lifecycle_state,
                material_type,
                material_code,
                material_name,
                material_description,
                material_overall_composition,
                material_construction,
                material_weight,
                material_weight_uom,
                material_first_season,
                material_hangtags,
                material_remarks,
                material_supplier_remark,
                material_developer,
                material_requestor,
                material_general_look_and_handfeel_approval,
                t2_supplier_group,
                t2_supplier_code,
                t2_supplier_name,
                t2_supplier_country,
                t2_supplier_lo,
                supplier_material_code,
                material_supplier_lead_time,
                material_supplier_current_lcs,
                material_earliest_buy_ready_date,
                article,
                colorway_name,
                article_status,
                article_development_type,
                article_technology_concept,
                fabric_activation,
                article_season_lifecycle_state,
                article_timeline,
                earliest_buy_ready_article,
                article_first_colorway,
                bom_main_material_flag,
                bom_part_id,
                bom_part_group_number,
                bom_multi_color_flag,
                pfp,
                bom_part_name,
                material_complex_flag,
                bom_part_color_code,
                bom_part_color_name,
                first_buy_ready_color_date,
                part_remarks,
                t1_factory_code,
                t1_factory_name,
                t1_factory_country,
                t1_factory_lo,
                t1_factory_priority,
                development_factory,
                model_lo_developer,
                t2_supplier_factory_type,
                article_factory_lead_time,
                material_supplier_uom,
                yield
            ) VALUES ?
        `;

        // Convert records to array format and normalize data
        const values = records.map(record => [
            fileId,
            record['Working Season'] || null,
            record['Product Division'] || null,
            record['Brand'] || null,
            record['Article Creation Center'] || null,
            record['Article Key Category Cluster'] || null,
            record['Article Key Category'] || null,
            record['Article Business Segment'] || null,
            record['Sports Category'] || null,
            record['Sales Line'] || null,
            record['Product Group'] || null,
            record['Model'] || null,
            record['Working Number'] || null,
            record['Article CC Developer'] || null,
            record['Sustainability and Ethics Compliance (All)'] || null,
            record['Product Specialty (All)'] || null,
            record['Direct Development'] || null,
            record['Brand Partner (All)'] || null,
            record['Model Status'] || null,
            record['Model Season Lifecycle State'] || null,
            record['Material Type'] || null,
            record['Material CODE'] || null,
            record['Material NAME'] || null,
            record['Material Description'] || null,
            record['Material Overall Composition'] || null,
            record['Material Construction'] || null,
            record['Material Weight'] || null,
            record['Material Weight UoM'] || null,
            record['Material First Season'] || null,
            record['Material Hangtags'] || null,
            record['Material Remarks'] || null,
            record['Material Supplier Remark'] || null,
            record['Material Developer'] || null,
            record['Material Requestor'] || null,
            record['Material General Look And Handfeel Approval'] || null,
            record['T2 Supplier Group'] || null,
            record['T2 Supplier CODE'] || null,
            record['T2 Supplier NAME'] || null,
            record['T2 Supplier Country'] || null,
            record['T2 Supplier LO'] || null,
            record['Supplier Material CODE'] || null,
            record['Material Supplier Lead Time'] || null,
            record['Material Supplier Current LCS'] || null,
            record['Material Earliest Buy Ready Date'] || null,
            record['Article'] || null,
            record['Colorway Name'] || null,
            record['Article Status'] || null,
            record['Article Development Type'] || null,
            record['Article Technology Concept (All)'] || null,
            record['Fabric Activation'] || null,
            record['Article Season Lifecycle State'] || null,
            record['Article Timeline'] || null,
            record['Earliest Buy Ready Article'] || null,
            record['Article First Colorway'] || null,
            record['BOM Main Material Flag'] || null,
            record['BOM Part ID'] || null,
            record['BOM Part Group Number'] || null,
            record['BOM Multi Color Flag'] || null,
            record['PFP'] || null,
            record['BOM Part Name'] || null,
            record['Material Complex Flag'] || null,
            record['BOM Part Color CODE'] || null,
            record['BOM Part Color NAME'] || null,
            record['First Buy Ready Color Date'] || null,
            record['Part Remarks'] || null,
            record['T1 Factory CODE'] || null,
            record['T1 Factory NAME'] || null,
            record['T1 Factory Country'] || null,
            record['T1 Factory LO'] || null,
            record['T1 Factory Priority'] || null,
            record['Development Factory'] || null,
            record['Model LO Developer'] || null,
            record['T2 Supplier Factory Type'] || null,
            record['Article Factory Lead Time'] || null,
            record['Material Supplier UoM'] || null,
            record['Yield'] || null
        ]);

        // Process in batches
        const batches = [];
        for (let i = 0; i < values.length; i += batchSize) {
            batches.push(values.slice(i, i + batchSize));
        }

        const connection = await getConnection()
        // Insert batches
        let totalInserted = 0;
        for (const batch of batches) {
            const [result] = await connection.query(sql, [batch]);
            totalInserted += result.affectedRows;
            console.log(`Inserted batch of ${result.affectedRows} records`);
        }

        return {
            success: true,
            totalInserted,
            message: `Successfully inserted ${totalInserted} records`
        };

    } catch (error) {
        console.error('Bulk insert error:', error);
        throw {
            success: false,
            error: error.message,
            details: error
        };
    }
}

async function bulkInsertBomData(records, fileId, batchSize = 250, connection) {
    try {
        // Prepare the SQL statement
        const sql = `
            INSERT INTO bom_data (
                file_id,
                bom_id,
                bom_itm_id,
                bom_row_nbr,
                msc_code,
                msc_level_1,
                msc_level_2,
                msc_level_3,
                silhouette,
                season_cd,
                season_yr,
                style_nm,
                style_nbr,
                style_cw_cd,
                colorway_status,
                plug_cw_cd,
                prmry,
                scndy,
                logo,
                factory,
                status,
                component_ord,
                use_desc,
                description,
                item_type_1,
                is_code,
                it_code,
                item_nbr,
                item_color_ord,
                item_color_nm,
                item_color_abrv,
                vend_cd,
                vend_lo,
                vend_nm,
                developer,
                bom_update_dt,
                bom_itm_update_dt,
                bom_itm_setup_dt,
                hk_bom_update_dt,
                hk_bom_itm_update_dt,
                hk_bom_itm_setpup_dt,
                parent_fcty,
                parent_factory,
                parent_box,
                factory_box,
                box_folder_id,
                sheet_name,
                qty,
                item_color_cd
            ) VALUES ?
        `;

        // Convert records to array format and normalize data
        const values = records.map(record => [
            fileId,
            record.BOM_ID || null,
            record.BOM_ITM_ID || null,
            record.BOM_ROW_NBR || null,
            record.MSC_CODE || null,
            record.MSC_LEVEL_1 || null,
            record.MSC_LEVEL_2 || null,
            record.MSC_LEVEL_3 || null,
            record.SILHOUETTE || null,
            record.SEASON_CD || null,
            record.SEASON_YR || null,
            record.STYLE_NM || null,
            record.STYLE_NBR || null,
            record.STYLE_CW_CD || null,
            record['Colorway status'] || null,
            record.PLUG_CW_CD || null,
            record.PRMRY || null,
            record.SCNDY || null,
            record.LOGO || null,
            record.FACTORY || null,
            record.STATUS || null,
            record.COMPONENT_ORD || null,
            record.USE || null,
            record.DESCRIPTION || null,
            record.ITEM_TYPE_1 || null,
            record.IS || null,
            record.IT || null,
            record.ITEM_NBR || null,
            record.ITEM_COLOR_ORD || null,
            record.ITEM_COLOR_NM || null,
            record.ITEM_COLOR_ABRV || null,
            record.VEND_CD || null,
            record.VEND_LO || null,
            record.VEND_NM || null,
            record.DEVELOPER || null,
            record.BOM_UPDATE_DT || null,
            record.BOM_ITM_UPDATE_DT || null,
            record.BOM_ITM_SETUP_DT || null,
            record.HK_BOM_UPDATE_DT || null,
            record.HK_BOM_ITM_UPDATE_DT || null,
            record.HK_BOM_ITM_SETPUP_DT || null,
            record['PARENT FCTY'] || null,
            record['PARENT FACTORY'] || null,
            record['PARENT BOX'] || null,
            record['FACTORY BOX'] || null,
            record['Box Folder ID'] || null,
            record.Sheet_Name || null,
            record.QTY || null,
            record.ITEM_COLOR_CD || null
        ]);

        // Process in batches
        const batches = [];
        for (let i = 0; i < values.length; i += batchSize) {
            batches.push(values.slice(i, i + batchSize));
        }

        // const connection = await getConnection()
        // Insert batches
        let totalInserted = 0;
        for (const batch of batches) {
            const [result] = await connection.query(sql, [batch]);
            totalInserted += result.affectedRows;
            console.log(`Inserted batch of ${result.affectedRows} records`);
        }

        return {
            success: true,
            totalInserted,
            message: `Successfully inserted ${totalInserted} records`
        };

    } catch (error) {
        console.error('Bulk insert error:', error);
        console.log(records.length, records[records.length - 1])
        console.log(records.filter((record) => !record.BOM_ID || record.BOM_ID === ''))
        throw {
            success: false,
            error: error.message,
            details: error
        };
    }
}

/**
 * Get all unique seasons and styles from the bom_data table
 * @param {string} fileName - Optional file name to filter by
 * @returns {Promise<Array>} - Array of objects with season and style
 */
const getSeasonsAndStyles = async (fileName = null) => {
    try {
        const connection = await getConnection();
        
        let query = `
            SELECT 
                CONCAT(season_cd, RIGHT(season_yr, 2)) AS season,
                style_nbr AS style,
                COUNT(*) AS count,
                MAX(season_cd) AS season_cd,
                MAX(season_yr) AS season_yr
            FROM bom_data
        `;
        
        const params = [];
        
        // Add file filter if provided
        if (fileName) {
            query += ` 
                JOIN files ON bom_data.file_id = files.id 
                WHERE files.file_name = ?
            `;
            params.push(fileName);
        }
        
        // Group by season and style
        query += `
            GROUP BY 
                CONCAT(season_cd, RIGHT(season_yr, 2)),
                style_nbr
            ORDER BY 
                season_cd DESC, 
                season_yr DESC, 
                style_nbr ASC
        `;
        
        const [rows] = await connection.query(query, params);
        return rows;
    } catch (error) {
        console.error('Error getting seasons and styles:', error);
        throw error;
    }
};

/**
 * Helper function to format dates to the required string format
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string
 */
const formatDate = (date) => {
    if (!date) return '';
    
    // If date is already a string, return it
    if (typeof date === 'string') return date;
    
    // Format date as 'YYYY-MM-DD HH:MM:SS'
    const d = new Date(date);
    return d.toISOString()
        .replace('T', ' ')
        .substring(0, 19);
};


/**
 * Get all BOM data based on season, style, and filename
 * @param {string} season - Season code (e.g., "HO24")
 * @param {string} style - Style number
 * @param {string} fileName - File name to filter by
 * @returns {Promise<Array>} - Array of BOM data records in the specified format
 */
const getBomDataBySeasonStyleAndFile = async (season, style, fileName) => {
    try {
        const connection = await getConnection();
        
        // Extract season code and year from the season parameter (e.g., "HO24" -> "HO" and "24")
        const seasonCode = season.substring(0, 2);
        const seasonYear = '20' + season.substring(2);
        
        const query = `
            SELECT 
                bom_data.*,
                files.file_name
            FROM 
                bom_data
            JOIN 
                files ON bom_data.file_id = files.id
            WHERE 
                season_cd = ? 
                AND RIGHT(season_yr, 2) = ?
                AND style_nbr = ?
                AND files.file_name = ?
            ORDER BY 
                bom_data.id
        `;
        
        const [rows] = await connection.query(query, [
            seasonCode, 
            season.substring(2), 
            style, 
            fileName
        ]);
        
        // Transform the data to match the required format
        const transformedRows = rows.map(row => {
            // Convert snake_case to UPPER_SNAKE_CASE and format specific fields
            return {
                BOM_ID: row.bom_id || null,
                BOM_ITM_ID: row.bom_itm_id || null,
                BOM_ROW_NBR: row.bom_row_nbr || null,
                MSC_CODE: row.msc_code || '',
                MSC_LEVEL_1: row.msc_level_1 || '',
                MSC_LEVEL_2: row.msc_level_2 || '',
                MSC_LEVEL_3: row.msc_level_3 || '',
                SILHOUETTE: row.silhouette || '',
                SEASON_CD: row.season_cd || '',
                SEASON_YR: row.season_yr || '',
                STYLE_NM: row.style_nm || '',
                STYLE_NBR: row.style_nbr || '',
                STYLE_CW_CD: row.style_cw_cd || '',
                PLUG_CW_CD: row.plug_cw_cd || '',
                PRMRY: row.prmry || '',
                LOGO: row.logo || '',
                FACTORY: row.factory || '',
                STATUS: row.status || '',
                COMPONENT_ORD: row.component_ord || null,
                USE: row.use || '',
                DESCRIPTION: row.description || '',
                ITEM_TYPE_1: row.item_type_1 || '',
                ITEM_TYPE_2: row.item_type_2 || '',
                IS: row.is || '',
                IT: row.it || '',
                ITEM_NBR: row.item_nbr || null,
                ITEM_COLOR_CD: row.item_color_cd || '',
                VEND_CD: row.vend_cd || '',
                VEND_LO: row.vend_lo || '',
                VEND_NM: row.vend_nm || '',
                QTY: row.qty || null,
                UOM: row.uom || '',
                DEVELOPER: row.developer || '',
                BOM_UPDATE_DT: formatDate(row.bom_update_dt),
                BOM_ITM_UPDATE_DT: formatDate(row.bom_itm_update_dt),
                BOM_ITM_SETUP_DT: formatDate(row.bom_itm_setup_dt),
                HK_BOM_UPDATE_DT: formatDate(row.hk_bom_update_dt),
                HK_BOM_ITM_UPDATE_DT: formatDate(row.hk_bom_itm_update_dt),
                HK_BOM_ITM_SETPUP_DT: formatDate(row.hk_bom_itm_setpup_dt),
                'PARENT FCTY': row.parent_fcty || '',
                'PARENT FACTORY': row.parent_factory || '',
                'PARENT BOX': row.parent_box || '',
                'FACTORY BOX': row.factory_box || '',
                'Box Folder ID': row.box_folder_id || '',
                Sheet_Name: row.sheet_name || 'MASTERDATA'
            };
        });
        
        return transformedRows;
    } catch (error) {
        console.error('Error getting BOM data by season, style, and file:', error);
        throw error;
    }
};

/**
 * Get all unique seasons and styles from the mur_data table
 * @param {string} fileName - Optional file name to filter by
 * @returns {Promise<Array>} - Array of objects with season and style
 */
const getSeasonsAndStylesMur = async (fileName = null) => {
    try {
        const connection = await getConnection();
        
        let query = `
            SELECT 
                working_season AS season,
                working_number AS style,
                COUNT(*) AS count,
                MAX(working_season) AS max_season
            FROM mur_data
        `;
        
        const params = [];
        
        // Add file filter if provided
        if (fileName) {
            query += ` 
                JOIN files ON mur_data.file_id = files.id 
                WHERE files.file_name = ?
            `;
            params.push(fileName);
        }
        
        // Group by season and style
        query += `
            GROUP BY 
                working_season,
                working_number
            ORDER BY 
                MAX(working_season) DESC, 
                working_number ASC
        `;
        
        const [rows] = await connection.query(query, params);
        return rows;
    } catch (error) {
        console.error('Error getting seasons and styles from MUR data:', error);
        throw error;
    }
};

/**
 * Get MUR data based on season and style
 * @param {string} season - Season code (e.g., "FA24")
 * @param {string} style - Style number (e.g., "F18MNCAP400IU")
 * @param {string} fileName - Optional file name to filter by
 * @returns {Promise<Array>} - Array of MUR data records in the specified format
 */
const getMurDataBySeasonAndStyle = async (season, style, fileName = null) => {
    try {
        const connection = await getConnection();
        
        let query = `
            SELECT 
                mur_data.*,
                files.file_name
            FROM 
                mur_data
        `;
        
        const params = [];
        const conditions = [];
        
        // Add file join if fileName is provided
        if (fileName) {
            query += ` JOIN files ON mur_data.file_id = files.id `;
            conditions.push(`files.file_name = ?`);
            params.push(fileName);
        }
        
        // Add season and style conditions
        conditions.push(`working_season = ?`);
        params.push(season);
        
        conditions.push(`working_number = ?`);
        params.push(style);
        
        // Add WHERE clause
        query += ` WHERE ${conditions.join(' AND ')}`;
        
        // Add ORDER BY
        query += ` ORDER BY mur_data.id`;
        
        const [rows] = await connection.query(query, params);
        
        // Transform the data to match the required format
        const transformedRows = rows.map(row => {
            return {
                'Working Season': row.working_season || '',
                'Product Division': row.product_division || '',
                'Brand': row.brand || '',
                'Article Creation Center': row.article_creation_center || '',
                'Article Key Category Cluster': row.article_key_category_cluster || '',
                'Article Key Category': row.article_key_category || '',
                'Article Business Segment': row.article_business_segment || '',
                'Sports Category': row.sports_category || '',
                'Sales Line': row.sales_line || '',
                'Product Group': row.product_group || '',
                'Model': row.model || '',
                'Working Number': row.working_number || '',
                'Article CC Developer': row.article_cc_developer || '',
                'Sustainability and Ethics Compliance (All)': row.sustainability_and_ethics_compliance || '',
                'Product Specialty (All)': row.product_specialty || '',
                'Direct Development': row.direct_development || '',
                'Brand Partner (All)': row.brand_partner || '',
                'Model Status': row.model_status || '',
                'Model Season Lifecycle State': row.model_season_lifecycle_state || '',
                'Material Type': row.material_type || '',
                'Material CODE': row.material_code || '',
                'Material NAME': row.material_name || '',
                'Material Description': row.material_description || '',
                'Material Overall Composition': row.material_overall_composition || '',
                'Material Construction': row.material_construction || '',
                'Material Weight': row.material_weight || null,
                'Material Weight UoM': row.material_weight_uom || '',
                'Material First Season': row.material_first_season || '',
                'Material Hangtags': row.material_hangtags || '',
                'Material Remarks': row.material_remarks || '',
                'Material Supplier Remark': row.material_supplier_remark || '',
                'Material Developer': row.material_developer || '',
                'Material Requestor': row.material_requestor || '',
                'Material General Look And Handfeel Approval': row.material_general_look_and_handfeel_approval || '',
                'T2 Supplier Group': row.t2_supplier_group || '',
                'T2 Supplier CODE': row.t2_supplier_code || '',
                'T2 Supplier NAME': row.t2_supplier_name || '',
                'T2 Supplier Country': row.t2_supplier_country || '',
                'T2 Supplier LO': row.t2_supplier_lo || '',
                'Supplier Material CODE': row.supplier_material_code || '',
                'Material Supplier Lead Time': row.material_supplier_lead_time || null,
                'Material Supplier Current LCS': row.material_supplier_current_lcs || '',
                'Material Earliest Buy Ready Date': row.material_earliest_buy_ready_date || null,
                'Article': row.article || '',
                'Colorway Name': row.colorway_name || '',
                'Article Status': row.article_status || '',
                'Article Development Type': row.article_development_type || '',
                'Article Technology Concept (All)': row.article_technology_concept || '',
                'Fabric Activation': row.fabric_activation || '',
                'Article Season Lifecycle State': row.article_season_lifecycle_state || '',
                'Article Timeline': row.article_timeline || '',
                'Earliest Buy Ready Article': row.earliest_buy_ready_article || null,
                'Article First Colorway': row.article_first_colorway || '',
                'BOM Main Material Flag': row.bom_main_material_flag || '',
                'BOM Part ID': row.bom_part_id || '',
                'BOM Part Group Number': row.bom_part_group_number || null,
                'BOM Multi Color Flag': row.bom_multi_color_flag || '',
                'PFP': row.pfp || '',
                'BOM Part Name': row.bom_part_name || '',
                'Material Complex Flag': row.material_complex_flag || '',
                'BOM Part Color CODE': row.bom_part_color_code || '',
                'BOM Part Color NAME': row.bom_part_color_name || '',
                'First Buy Ready Color Date': row.first_buy_ready_color_date || null,
                'Part Remarks': row.part_remarks || '',
                'T1 Factory CODE': row.t1_factory_code || '',
                'T1 Factory NAME': row.t1_factory_name || '',
                'T1 Factory Country': row.t1_factory_country || '',
                'T1 Factory LO': row.t1_factory_lo || '',
                'T1 Factory Priority': row.t1_factory_priority || '',
                'Development Factory': row.development_factory || '',
                'Model LO Developer': row.model_lo_developer || '',
                'T2 Supplier Factory Type': row.t2_supplier_factory_type || '',
                'Article Factory Lead Time': row.article_factory_lead_time || '',
                'Material Supplier UoM': row.material_supplier_uom || '',
                'Yield': row.yield || null
            };
        });
        
        return transformedRows;
    } catch (error) {
        console.error('Error getting MUR data by season and style:', error);
        throw error;
    }
};

/**
 * Get list of files filtered by group name
 * @param {string} groupName - Group name to filter by
 * @returns {Promise<Array>} - Array of file records
 */
const getFilesByGroup = async (groupName) => {
    try {
        const connection = await getConnection();
        
        const query = `
            SELECT 
                id,
                file_name,
                group_name,
                created_by,
                created_at
            FROM 
                files
            WHERE 
                group_name = ?
            ORDER BY 
                created_at DESC
        `;
        
        const [rows] = await connection.query(query, [groupName]);
        
        return rows;
    } catch (error) {
        console.error('Error getting files by group:', error);
        throw error;
    }
};

module.exports = {
    createUser,
    getUserByEmail,
    insertFile,
    getFiles,
    bulkInsertExcelData,
    bulkInsertBomData,
    getSeasonsAndStyles,
    getBomDataBySeasonStyleAndFile,
    getSeasonsAndStylesMur,
    getMurDataBySeasonAndStyle,
    getFilesByGroup
}