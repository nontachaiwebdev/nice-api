const express = require('express')
const app = express()
const port = 4000
require('dotenv').config();
const compareEngine = require('./controller/compare')
const source = require('./controller/source')
const cors = require('cors')
const bodyParser = require('body-parser')
const fs = require('fs')
var path = require('path')
var mime = require('mime')
const users = require('./controller/users') 
const files = require('./controller/files')
const multer = require('multer')
const upload = multer()

const corsOptions = {
    // origin: 'http://localhost:3000',
    origin: 'http://192.168.19.90:3000',
    credentials: true,
};
app.use(cors(corsOptions))

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// app.get('/download/:name', function(req, res){
//     const path = `${__dirname}/source`;
//     // const filename = path.basename(file);
//     // const mimetype = mime.getType(file);

//     // res.setHeader('Content-disposition', 'attachment; filename=' + filename);
//     // res.setHeader('Content-type', mimetype);

//     // const filestream = fs.createReadStream(file);
//     // filestream.pipe(res)
//     res.download(path, req.params.name)
// })
app.use('/download', express.static('source'))
app.post('/compare/g2/:season/:style', compareEngine.murCompare)
app.post('/compare/:season/:style', compareEngine.compare)
app.get('/compare/sources', source.getSources)
app.get('/compare/ms', compareEngine.compareSap)
app.get('/compare/style/mur/:name', compareEngine.getCategoryByMurFileName)
app.get('/compare/style/:name', compareEngine.getCategoryByFileName)
app.post('/user', users.createUser)

app.post('/auth', users.authen)
app.get('/profile/:token', users.getProfile)
// app.get('/ftp/connect', files.connect)
app.get('/ftp/user', files.getUserFiles)
app.get('/ftp/file', files.downloadFile)
app.post('/ftp/:user_id/:group_id/upload', upload.single('file'), files.upload)
app.get('/ftp/:group_id', files.getList)
app.delete('/ftp/remove', files.removeFile)

// app.post('/schedule', )

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})