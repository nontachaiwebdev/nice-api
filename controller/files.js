const { Client } = require("basic-ftp")
const fs = require('fs')
const { Readable, Writable } = require('stream')
const { Buffer } = require('buffer');
const nice = require('../models/nice')

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
            // console.log('---', await client.list())
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

const upload = async (req, res, next) => {
    const formData = req.body;
    const stream = Readable.from(req.file.buffer)
    const cli = await getConnection()
    // console.log('---', await cli.list('/group_two'))
    await cli.uploadFrom(stream, `${req.params.group_id}/${formData.name}`)
    await cli.close()
    await nice.insertFile(req.params.group_id, formData.name, req.params.user_id)
    res.end()
}

const getList = async (req, res, next) => {
    const cli = await getConnection()
    const list = await cli.list(`/${req.params.group_id}`)
    await cli.close()
    res.send({ list })
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
        // console.log(chunk, buffer)
        buffer.push(chunk)
        next()
    }
    const cli = await getConnection()
    await cli.downloadTo(writableStream, req.query.path)
    await cli.close()
    // res.send({ list })
    res.attachment(fileName)
    console.log(buffer)
    const readStream = Readable.from(Buffer.concat(buffer))
    readStream.on('end', () => res.end())
    // fs.createReadStream(file).pipe(res)
    readStream.pipe(res)
    // res.end()
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
    getUserFiles
}