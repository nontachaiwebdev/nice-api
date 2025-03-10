const { Client } = require("basic-ftp")
const fs = require('fs')
const { Readable, Writable } = require('stream')
const { Buffer } = require('buffer');
const nice = require('../models/nice')
const moment = require('moment')
const XLSX = require('xlsx')
const stream = require('stream')
const ExcelJS = require('exceljs');
const niceDBConnection = require('../models/nice/connection')

const FTP_HOST = '192.168.19.62'
const FTP_USERNAME = 'mavenfield01'
const FTP_PASSWORD = 'P@$$1234'

const getConnection = () => {
    return new Promise(async (resolve, reject) => {
        const client = new Client()
        client.ftp.verbose = true
        try {
            await client.access({
                host: FTP_HOST,
                user: FTP_USERNAME,
                password: FTP_PASSWORD,
                secure: false
            })
            // await client.ensureDir('group_two')

            // await client.uploadFrom("README.md", "README_FTP.md")
            // await client.downloadTo("README_COPY.md", "README_FTP.md")
            resolve(client)
        }
        catch(err) {
            reject(err)
        }
        // client.close()
    })
}

/**
 * Process Excel file in a more efficient way
 * @param {Buffer} buffer - Excel file buffer
 * @param {string} groupId - Group ID
 * @param {number} fileId - File ID in database
 */
const processExcelFile = async (buffer, groupId, fileId) => {
    try {
        console.log(`Starting Excel processing for file ID ${fileId}`);
        
        // First, send the response to the client
        // Then process the file in the background
        
        // Use a worker thread for processing large files
        const connection = await niceDBConnection()
        return new Promise((resolve, reject) => {
            // Set up minimal options for initial reading - just to get structure
            const options = {
                type: 'buffer',
                cellFormula: false,
                cellHTML: false,
                cellStyles: false,
                cellDates: false,
                sheetStubs: false,
                bookDeps: false,
                bookFiles: false,
                bookProps: false,
                bookSheets: true, // We need sheet names
                bookVBA: false,
                password: '',
                WTF: false,
                sheets: [0] // Only read the first sheet's info
            };
            
            // First just get the sheet names and structure
            console.time('Initial sheet structure read');
            const workbook = XLSX.read(buffer, options);
            console.timeEnd('Initial sheet structure read');
            
            if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                console.error('No sheets found in Excel file');
                return resolve({ success: false, error: 'No sheets found' });
            }
            
            const sheetName = workbook.SheetNames[0];
            console.log(`Processing sheet: ${sheetName}`);
            
            // Now process the data in smaller chunks using streams
            // This is the key optimization for XLSB files
            console.log('Starting chunked processing...');
            
            // Process in batches with delays to prevent memory issues
            const BATCH_SIZE = 5000; // Smaller batch size for huge files
            let currentRow = 0;
            let headers = null;
            let batch = [];
            let totalProcessed = 0;
            
            // Create a custom stream parser for XLSB
            const processNextChunk = async () => {
                console.log('processNextChunk')
                try {
                    // Read a chunk of the file
                    const chunkOptions = {
                        type: 'buffer',
                        cellFormula: false,
                        cellHTML: false,
                        cellStyles: false,
                        cellDates: false,
                        sheetStubs: false,
                        bookDeps: false,
                        bookFiles: false,
                        bookProps: false,
                        bookSheets: false,
                        bookVBA: false,
                        password: '',
                        WTF: false,
                        sheets: [sheetName],
                        sheetRows: currentRow + BATCH_SIZE,
                        raw: true
                    };
                    
                    console.time(`Read chunk at row ${currentRow}`);
                    const chunkWorkbook = XLSX.read(buffer, chunkOptions);
                    console.timeEnd(`Read chunk at row ${currentRow}`);
                    
                    const sheet = chunkWorkbook.Sheets[sheetName];

                    console.log('batch', batch.length)
                    
                    if (!sheet || !sheet['!ref']) {
                        console.log('No more data in sheet or reached end');
                        
                        // Process any remaining rows in the batch
                        if (batch.length > 0) {
                            console.log(`Processing final batch of ${batch.length} rows`);
                            if (groupId === 'group_two') {
                                await nice.bulkInsertExcelData(batch, fileId, 1000, connection);
                            } else {
                                await nice.bulkInsertBomData(batch, fileId, 1000, connection);
                            }
                            totalProcessed += batch.length;
                        }
                        
                        console.log(`Completed processing ${totalProcessed} total rows`);
                        return resolve({ success: true, rowsProcessed: totalProcessed });
                    }
                    
                    // Convert to JSON with header option if we don't have headers yet
                    if (!headers) {
                        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                        if (data.length > 0) {
                            headers = data[0];
                            console.log(`Found ${headers.length} headers`);
                            
                            // Process rows starting from index 1 (after headers)
                            for (let i = 1; i < data.length; i++) {
                                const row = data[i];
                                const rowData = {};
                                
                                for (let j = 0; j < headers.length; j++) {
                                    if (headers[j] && row[j] !== undefined) {
                                        rowData[headers[j]] = row[j];
                                    }
                                }
                                
                                if (Object.keys(rowData).length > 0) {
                                    batch.push(rowData);
                                }
                                // console.log('batch', batch)
                                if (batch.length >= BATCH_SIZE) {
                                    console.log(`Processing batch of ${batch.length} rows`);
                                    if (groupId === 'group_two') {
                                        await nice.bulkInsertExcelData(batch, fileId, 1000, connection);
                                    } else {
                                        console.log('batch ----')
                                        await nice.bulkInsertBomData(batch, fileId, 1000, connection);
                                        console.log('batch ----')
                                    }
                                    totalProcessed += batch.length;
                                    batch = [];
                                }
                            }
                        }
                    } else {
                        // We already have headers, just get the data rows
                        const range = XLSX.utils.decode_range(sheet['!ref']);
                        
                        // Skip the header row if this is the first chunk
                        const startRow = currentRow === 0 ? range.s.r + 1 : range.s.r;
                        
                        for (let r = startRow; r <= range.e.r; r++) {

                            if (r <= currentRow) {
                                continue;
                            }
                            
                            const rowData = {};
                            let hasData = false;
                            
                            for (let c = range.s.c; c <= range.e.c; c++) {
                                const cellAddress = XLSX.utils.encode_cell({ r, c });
                                if (sheet[cellAddress] && headers[c] && sheet[cellAddress].v !== undefined) {
                                    rowData[headers[c]] = sheet[cellAddress].v;
                                    hasData = true;
                                }
                            }
                            
                            if (hasData && Object.keys(rowData).length > 0) {
                                batch.push(rowData);
                            }
                            
                            if (batch.length >= BATCH_SIZE) {
                                console.log(`Processing batch of ${batch.length} rows`);
                                if (groupId === 'group_two') {
                                    await nice.bulkInsertExcelData(batch, fileId, 1000, connection);
                                } else {
                                    await nice.bulkInsertBomData(batch, fileId, 1000, connection);
                                }
                                totalProcessed += batch.length;
                                batch = [];
                            }
                        }
                    }
                    
                    // Update current row for next chunk
                    currentRow += BATCH_SIZE;
                    
                    // Use setTimeout to prevent memory buildup and allow GC to run
                    setTimeout(processNextChunk, 500);
                    
                } catch (error) {
                    console.error('Error processing chunk:', error);
                    reject(error);
                }
            };
            
            // Start processing
            processNextChunk();
        });
        
    } catch (error) {
        console.error('Error in Excel processing:', error);
        throw error;
    }
};

const upload = async (req, res, next) => {
    const formData = req.body;
    const stream = Readable.from(req.file.buffer)
    const cli = await getConnection()
    let fileName = `${moment().format('YY-MM-DDHHmmss')}.xlsb`
    console.log('Upload file to pdf.')
    await cli.uploadFrom(stream, `${req.params.group_id}/${fileName}`)
    await cli.close()
    console.log('Done Upload file to pdf.')
    const fileData = await nice.insertFile(req.params.group_id, fileName, req.params.user_id)

    await processExcelFile(req.file.buffer, req.params.group_id, fileData.insertId)
    // console.log('Before insert data')
    // try {
    //     const workbook = XLSX.read(req.file.buffer)
    //     const sheet_name_list = workbook.SheetNames
    //     const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]])
    //     console.log('data', data)
    //     if(req.params.group_id === 'group_two') {
    //         await nice.bulkInsertExcelData(data, fileData.insertId)
    //     } else {
    //         console.log('insert datas')
    //         await nice.bulkInsertBomData(data, fileData.insertId)
    //     }
    // } catch(err) {
    //     console.log('Error', err)
    // }
    // bulkInsertExcelData
    // fileData.insertId
    res.end()
}

const getList = async (req, res, next) => {
    const files = await nice.getFilesByGroup(req.params.group_id)
    // const cli = await getConnection()
    // const list = await cli.list(`/${req.params.group_id}`)
    // await cli.close()
    res.send({ list: files })
}

const _appendBuffer = function(buffer1, buffer2) {
    var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp.buffer;
}

const downloadFile = async (req, res, next) => {
    let buffer = []
    const fileName = req.query.path.split('/')[1]
    // const writableStream = fs.createWriteStream(`../temp/${fileName}`)
    const writableStream = new Writable()
    // writableStream.on('end', () => res.end())
    writableStream._write = (chunk, encoding, next) => {
        buffer.push(chunk)
        next()
    }
    const cli = await getConnection()
    await cli.downloadTo(writableStream, req.query.path)
    await cli.close()
    // res.send({ list })
    res.attachment(fileName)
    const readStream = Readable.from(Buffer.concat(buffer))
    readStream.on('end', () => res.end())
    // fs.createReadStream(file).pipe(res)
    readStream.pipe(res)
    // res.end()
}

const getFileBuffer = (fileName) => {
    return new Promise(async (resolve, reject) => {
        let buffer = []
        // const fileName = req.query.path.split('/')[1]
        const writableStream = new Writable()
        writableStream._write = (chunk, encoding, next) => {
            buffer.push(chunk)
            next()
        }
        const cli = await getConnection()
        await cli.downloadTo(writableStream, fileName)
        await cli.close()
        // res.attachment(fileName)
        // const readStream = Readable.from(Buffer.concat(buffer))
        resolve(Buffer.concat(buffer))
    })
    // fs.createReadStream(file).pipe(res)
    // readStream.pipe(res)
}

const removeFile = async (req, res, next) => {
    const cli = await getConnection()
    await cli.remove(req.query.path)
    await cli.close()
    res.end()
}

const getUserFiles = async (req, res, next) => {
    const files = await nice.getFiles()
    res.send({ files })
}

module.exports = {
    upload,
    getList,
    downloadFile,
    removeFile,
    getUserFiles,
    getFileBuffer
}