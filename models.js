var xlsxj = require("xlsx-to-json");
var rmrf  = require('rimraf');

var fileAdone, fileBdone, errorsFound, found;
var response, measure_id;
var rowsInA,rowsInB,rowsToBeNotFound,messages;

var to_json = function(fileName, cb){
  xlsxj({
    input: 'uploads/' + fileName,
    output: 'uploads/' + fileName + ".json"
  }, function(err, result) {
    if(err) {
      console.error(err);
    }else {
      console.log("To Json is done for " + fileName);
      cb(result);
    }
  });
};

var processFileA = function (result){
  rowsInA = [];
  rowsToBeNotFound = [];

  for(i in result){
    row    = result[i];
    var content = {
      acc_no : row['Account Number'],
      den    : row['Expected Denominator'],
      num    : row['Expected Numerator']
    };
    console.log("acc_no : " + content.acc_no);
    if (content.acc_no){
      console.log("Inside " + content.acc_no);
      console.log("Den: " + content.den + ", Num: " + content.num);
      if (content.den === '--' && content.num === '--'){
        console.log("Inside --");
        rowsToBeNotFound.push(content);
      } else if(content.den && content.num) {
        console.log("Inside den and num");
        rowsInA.push(content);
      }
    }
  }
  fileAdone = true;
  compare();
};

var processFileB = function (result){
  rowsInB = [];

  console.log("processFileB");
  console.log("fileBdone : " + fileBdone);
  first_row = result[0];

  if(!measure_id){
    measure_id = first_row['measure_id'];
  }

  messages.push("Displaying details for measure_id: " + measure_id);
  messages.push("Denominator: " + first_row['denominator'] + "\t" +
                "Numerator: " + first_row['numerator'] + "\t" +
                "Exclusion: " + first_row['exclusion'] + "\t" +
                "Performance Rate: " + first_row['performance_rate'] + "\n");
  for(i in result){
    row    = result[i];
    var content = {
      acc_no      : row['pt_id'],
      den         : row['in_denominator'],
      num         : row['in_numerator'],
      measure_id  : row['measure_id']
    };
    console.log("acc_no : " + content.acc_no);
    if (content.acc_no){
      console.log("Inside " + content.acc_no);
      console.log("Den: " + content.den + ", Num: " + content.num);
      rowsInB.push(content);
    }
  }
  fileBdone = true;
  compare();
};

var compare = function(){

  if (fileAdone && fileBdone) 
  {
    console.log("Comparing...");
    errorsFound = false;
    

    console.log("Lengths " + rowsInA.length + " " + rowsToBeNotFound.length + " " + rowsInB.length);

    if (rowsInA.length === 0 &&
        rowsToBeNotFound.length === 0) 
    {
      messages.push("ERROR: File A doesn't seem to have 'Account Number' column");
      errorsFound = true;
    };

    if (rowsInB.length === 0)
    {
      messages.push("ERROR: File B doesn't seem to have 'pt_id' column");
      errorsFound = true;
    };

    console.log("rowsToBeNotFound");
    for (i in rowsToBeNotFound)
    {
      a = rowsToBeNotFound[i];

      for (j in rowsInB)
      {
        b = rowsInB[j];
        console.log("a.acc_no: " + a.acc_no + ", b.acc_no: " + b.acc_no);
        console.log("measure_id " + measure_id + ", b.measure_id: " + b.measure_id);
        if( a.acc_no   === b.acc_no &&
            measure_id === b.measure_id)
        {
            console.log("ERROR: Acc No: " + a.acc_no + " was found in File B");
            messages.push("ERROR: Acc No: " + a.acc_no + " was found in File B");
            errorsFound = true;
        }
      }
    }

    messages.push("\n\n");
    console.log("rowsInA");
    for(i in rowsInA)
    {
      a = rowsInA[i];
      found = false;

      for(j in rowsInB)
      {
        b = rowsInB[j];
        console.log("a.acc_no: " + a.acc_no + ", b.acc_no: " + b.acc_no);
        console.log("a.den: " + a.den + ", a.num: " + a.num);
        console.log("b.den: " + b.den + ", b.num: " + b.num);
        console.log("measure_id " + measure_id + ", b.measure_id: " + b.measure_id);
        if(a.acc_no     === b.acc_no  &&
            a.den       === b.den     &&
            a.num       === b.num     &&
            measure_id  === b.measure_id)
        {
          found = true;
          break;
        }

      }

      if (!found) 
      {
        messages.push("ERROR: Not Found Acc No: " + a.acc_no +
                    "\tDen: " + a.den + "\tNum: " + a.num +
                    "\tMeasure ID: " + measure_id);
        for(i in rowsInB){
          b = rowsInB[i];
          if (b.acc_no === a.acc_no) {
            messages.push("\t   Found Acc No: " + b.acc_no + 
                          "\tDen: " + b.den + 
                          "\tNum: " + b.num + 
                          "\tMeasure ID: " + b.measure_id);     
          };
        }

        errorsFound = true;
      }      
    }

    if (!errorsFound) { messages.push("Congrats, No errors found"); }
    
    for(i in messages){
      response.write(messages[i] + "\n");
    }
    response.end();
    // deleteFolder();
  } 
  else {
    console.log('Nothing to compare');
  }

};

var deleteFolder = function(){
  rmrf('uploads', function(){});
};


var process = function (fileNameA, fileNameB, mes_id, res){
    response = res;
    measure_id = mes_id;
    fileAdone = false;
    fileBdone = false;
    messages = [];
    to_json(fileNameA, processFileA);
    to_json(fileNameB, processFileB);
};


exports.process = process;