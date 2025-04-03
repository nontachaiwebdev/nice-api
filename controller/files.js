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
const XlsxStreamReader = require('xlsx-stream-reader');
const path = require('path')

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

const processExcelFileNew = async (buffer, groupId, fileId) => {
    try {
        console.log(`Starting Excel processing for file ID ${fileId}`);
        
        // Use a worker thread for processing large files
        const connection = await niceDBConnection();
        
        // First, get just the workbook structure and sheet names
        console.time('Initial sheet structure read');
        const workbookInfo = XLSX.read(buffer, {
            type: 'buffer',
            bookSheets: true,
            cellFormula: false,
            cellHTML: false,
            cellStyles: false,
            cellDates: false,
            sheetStubs: false,
        });
        console.timeEnd('Initial sheet structure read');
        
        if (!workbookInfo.SheetNames || workbookInfo.SheetNames.length === 0) {
            console.error('No sheets found in Excel file');
            return { success: false, error: 'No sheets found' };
        }
        
        const sheetName = workbookInfo.SheetNames[0];
        console.log(`Processing sheet: ${sheetName}`);

        // Use a stream-based approach for XLSB files
        return new Promise((resolve, reject) => {
            try {
                // Define batch parameters
                const BATCH_SIZE = 1000; // Smaller batch size
                let totalProcessed = 0;
                let batch = [];
                let headers = null;
                
                // Create a row handler that processes one row at a time
                const rowHandler = async (row, seqno) => {
                    try {
                        // First row contains headers
                        if (seqno === 0) {
                            headers = row;
                            return;
                        }
                        
                        // Process data row
                        const rowData = {};
                        let hasData = false;
                        
                        // Map row values to header keys
                        for (let i = 0; i < headers.length; i++) {
                            if (headers[i] && row[i] !== undefined) {
                                rowData[headers[i]] = row[i];
                                hasData = true;
                            }
                        }
                        
                        // Add valid rows to the batch
                        if (hasData && Object.keys(rowData).length > 0) {
                            batch.push(rowData);
                        }
                        
                        // Process batch when it reaches the size limit
                        if (batch.length >= BATCH_SIZE) {
                            console.log(`Processing batch of ${batch.length} rows (total so far: ${totalProcessed})`);
                            
                            console.log('batch', batch)
                            if (groupId === 'group_two') {
                                await nice.bulkInsertExcelData(batch, fileId, BATCH_SIZE, connection);
                            } else {
                                await nice.bulkInsertBomData(batch, fileId, BATCH_SIZE, connection);
                            }
                            
                            totalProcessed += batch.length;
                            batch = [];
                            
                            // Force garbage collection if available (Node.js with --expose-gc flag)
                            if (global.gc) {
                                global.gc();
                            }
                        }
                    } catch (error) {
                        console.error(`Error processing row ${seqno}:`, error);
                        throw error;
                    }
                };
                
                // Process final batch function
                const processFinalBatch = async () => {
                    if (batch.length > 0) {
                        console.log(`Processing final batch of ${batch.length} rows`);
                        
                        if (groupId === 'group_two') {
                            await nice.bulkInsertExcelData(batch, fileId, BATCH_SIZE, connection);
                        } else {
                            await nice.bulkInsertBomData(batch, fileId, BATCH_SIZE, connection);
                        }
                        
                        totalProcessed += batch.length;
                    }
                    
                    console.log(`Completed processing ${totalProcessed} total rows`);
                    return { success: true, rowsProcessed: totalProcessed };
                };
                
                // Stream process using sheet_to_json with stream option
                console.time('Stream processing');
                
                // Create a readable stream from the buffer
                const bufferStream = new stream.PassThrough();
                bufferStream.end(buffer);
                
                // Use sheet_to_json with a row callback to process one row at a time
                const parseOptions = {
                    header: 1,           // Use array of values
                    raw: false,          // Convert values
                    dateNF: 'yyyy-mm-dd',// Date format
                    defval: null,        // Default value
                    blankrows: false     // Skip blank rows
                };
                
                // Use XLSX-Populate or SheetJS Stream Reader for XLSB files
                // This is a conceptual implementation - actual implementation depends on the library
                
                // Option 1: If using xlsx-stream-reader
                // if (buffer.toString().includes('XLSB') || fileId.endsWith('.xlsb')) {
                    const workBookReader = new XlsxStreamReader();
                    
                    workBookReader.on('worksheet', function(workSheetReader) {
                        console.log('workSheetReader', workSheetReader)
                        if (workSheetReader.id === 1) { // First sheet
                            workSheetReader.on('row', function(row) {
                                console.log('row', row)
                                rowHandler(row.values, row.index - 1);
                            });
                            
                            workSheetReader.on('end', async function() {
                                const result = await processFinalBatch();
                                resolve(result);
                            });
                            
                            workSheetReader.process();
                        } else {
                            workSheetReader.skip();
                        }
                    });
                    
                    workBookReader.on('error', function(error) {
                        reject(error);
                    });
                    
                    console.log('Starting...')
                    bufferStream.pipe(workBookReader);
                // } 
                // Option 2: For other Excel formats
                // else {
                //     // Create a sheet reader
                //     const sheet = workbookInfo.Sheets[sheetName];
                //     const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                    
                //     // Process rows asynchronously with setImmediate to avoid blocking
                //     const processRowsAsync = async (startIdx) => {
                //         const endIdx = Math.min(startIdx + 100, rows.length);
                        
                //         for (let i = startIdx; i < endIdx; i++) {
                //             await rowHandler(rows[i], i);
                //         }
                        
                //         if (endIdx < rows.length) {
                //             setImmediate(() => processRowsAsync(endIdx));
                //         } else {
                //             const result = await processFinalBatch();
                //             console.timeEnd('Stream processing');
                //             resolve(result);
                //         }
                //     };
                    
                //     // Start processing rows
                //     processRowsAsync(0);
                // }
            } catch (error) {
                console.error('Error in stream processing:', error);
                reject(error);
            }
        });
        
    } catch (error) {
        console.error('Error in Excel processing:', error);
        throw error;
    }
};

async function readExcelRowRangeWithExcelJS(filePath, startRow, endRow) {
    const rows = [];
    let rowIndex = 0;
    let headers = null;
    
    const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
      sharedStrings: 'cache',
      hyperlinks: false,
      worksheets: 'emit'
    });
    
    for await (const worksheetReader of workbookReader) {
      // Process only the first worksheet
      for await (const row of worksheetReader) {
        rowIndex++;
        
        // Get headers from the first row
        if (rowIndex === 1) {
          headers = row.values.slice(1); // ExcelJS uses 1-based indexing for values
          
          // If we need the header row and it's in our range
          if (startRow === 1) {
            rows.push([...headers]);
          }
          continue;
        }
        
        // Skip rows before our range
        if (rowIndex < startRow) {
          continue;
        }
        
        // Stop after we've read all rows in our range
        if (rowIndex > endRow) {
          break;
        }
        
        // Process rows in our range
        if (headers) {
          // For data rows, convert to objects with header keys
          const rowData = {};
          row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
            if (headers[colNumber - 1]) {
              rowData[headers[colNumber - 1]] = cell.value;
            }
          });
          rows.push(rowData);
        } else {
          // If no headers, just store the raw values
          const rowValues = [];
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            rowValues[colNumber - 1] = cell.value;
          });
          rows.push(rowValues);
        }
      }
      
      // We only process the first worksheet
      break;
    }
    
    return rows;
}

async function splitExcelBufferStreaming(buffer, outputDir, baseFileName, maxRowsPerFile = 50000, fileId, groupId) {
    try {
        const connection = await niceDBConnection();
      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Create a readable stream from the buffer
      const bufferStream = new stream.PassThrough();
      bufferStream.end(buffer);
      
      const outputFiles = [];
      let headers = null;
      let currentRows = [];
      let fileIndex = 0;
      let rowCount = 0;
      
      // Function to write current rows to a file
      const writeChunkToFile = async () => {
        if (currentRows.length === 0) return;
        
        try {
          // Create a new workbook
          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet('Sheet1');
          
          // Add headers
          if (headers) {
            worksheet.addRow(headers);
          }
          
          // Add data rows
          for (const row of currentRows) {
            worksheet.addRow(row);
          }
          
          // Generate output filename
          const outputFileName = `${baseFileName}_part${fileIndex + 1}.xlsx`;
          const outputPath = path.join(outputDir, outputFileName);
          
          // Write to file
          await workbook.xlsx.writeFile(outputPath);
          console.log(`Created file ${outputPath} with ${currentRows.length} data rows`);
          
          outputFiles.push(outputPath);
          
          // Reset for next file
          currentRows = [];
          fileIndex++;
        } catch (error) {
          console.error('Error writing chunk to file:', error);
          throw error;
        }
      };
      
      // Create a workbook reader from the buffer stream
      const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(bufferStream, {
        sharedStrings: 'cache',
        hyperlinks: false,
        worksheets: 'emit'
      });
      
      console.log('Before Process')
      // Process the workbook
      for await (const worksheetReader of workbookReader) {
        console.log('worksheetReader', worksheetReader)
        let rowIndex = 0;
        
        // Process each row in the worksheet
        for await (const row of worksheetReader) {
          rowIndex++;
          
          // Get headers from the first row
          if (rowIndex === 1) {
            // ExcelJS uses 1-based indexing for values array
            headers = [];
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
              headers[colNumber - 1] = cell.value;
            });
            
            // Filter out undefined values
            headers = headers.filter(h => h !== undefined);
            console.log(`Found ${headers.length} headers`);
            continue;
          }
        //   console.log('headers', headers)
          
          // Process data row
          const rowValues = {};
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            if (colNumber <= headers.length) {
                rowValues[headers[colNumber - 1]] = cell.value;
            //   rowValues[colNumber - 1] = cell.value;
            }
          });
          
        //   console.log('rowValues', rowValues)
          // Add row to current batch
          currentRows.push(rowValues);
          rowCount++;

          
          // If we've reached the max rows per file, write to file
          if (currentRows.length >= maxRowsPerFile) {
            // await writeChunkToFile();
            if (groupId === 'group_two') {
                console.log('insert mur data')
                await nice.bulkInsertExcelData(currentRows, fileId, 5000, connection);
                currentRows = [];
            } else {
                console.log('insert bom data')
                await nice.bulkInsertBomData(currentRows, fileId, 5000, connection);
                currentRows = [];
            }
          }
        }
        
        // We only process the first worksheet
        break;
      }
      
      // Write any remaining rows
      if (currentRows.length > 0) {
        // await writeChunkToFile();
        if (groupId === 'group_two') {
            console.log('insert mur data')
            await nice.bulkInsertExcelData(currentRows, fileId, 5000, connection);
        } else {
            console.log('insert bom data')
            await nice.bulkInsertBomData(currentRows, fileId, 5000, connection);
        }
      }
      
      console.log(`Successfully split Excel buffer into ${fileIndex} files with ${rowCount} total rows`);
      return outputFiles;
      
    } catch (error) {
      console.error('Error splitting Excel buffer:', error);
      throw error;
    }
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
    const extension = formData['name'].split('.').pop()
    const stream = Readable.from(req.file.buffer)
    const cli = await getConnection()
    let fileName = `${moment().format('YY-MM-DDHHmmss')}.${extension}`
    await cli.uploadFrom(stream, `${req.params.group_id}/${fileName}`)
    await cli.close()
    const fileData = await nice.insertFile(req.params.group_id, fileName, req.params.user_id)
    const files = await splitExcelBufferStreaming(req.file.buffer, './test', 'bom', 50000, fileData.insertId, req.params.group_id)
    // await processExcelFileNew(req.file.buffer, req.params.group_id, fileData.insertId)

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