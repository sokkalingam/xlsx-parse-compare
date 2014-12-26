/*Define dependencies.*/
var fileSystem  = require('fs');
var path        = require('path');
var express     = require("express");
var multer      = require('multer');
var app         = express();
var bodyParser  = require('body-parser');
var mkdirp      = require('mkdirp');

var models      = require('./models.js');
var done        = false;
var fileNameA, fileNameB;

/*Configure the multer.*/

app.use(bodyParser.urlencoded({ extended: false }));

app.use(multer({ dest: './uploads/',
 rename: function (fieldname, filename) {
    return filename+Date.now();
  },
onFileUploadStart: function (file) {
  console.log(file.originalname + ' is starting ...')
},
onFileUploadComplete: function (file) {
  console.log(file.fieldname + ' uploaded to  ' + file.path)
  done=true;
}
}));

/*Handling routes.*/

app.get('/',function(req,res){
  mkdirp('uploads', function(){
    res.sendFile(__dirname + '/index.html');
  });
});

app.post('/api/xlsx',function(req,res){
  if(done==true){
    fileNameA = req.files['xlsx file A'].name;
    fileNameB = req.files['xlsx file B'].name;
    console.log(req.files);
    console.log('measure_id : ' + req.body.measure_id);
    var measure_id = req.body.measure_id;
    models.process(fileNameA, fileNameB, measure_id, res);
  }
});

/*Run the server.*/
app.listen(3001,function(){
    console.log("Working on port 3001");
});


  