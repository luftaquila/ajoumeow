function volunteerMaker() {
  console.info('Start Generating Document...');
  var SCRIPT_PROP = PropertiesService.getScriptProperties();
  var doc = SpreadsheetApp.openById(SCRIPT_PROP.getProperty("key"));
  var volSheet = doc.getSheetByName('1365');

  var receiverData = doc.getSheetByName('Receiver').getRange('A2:C').getValues();
  var targetYear = Number(volSheet.getRange('A1').getValue());
  var targetMonth = Number(volSheet.getRange('C1').getValue());

  var dataArray = [], nameAssigned = ['start'];

  volSheet.deleteRows(4, volSheet.getLastRow() - 3);

  for(i in receiverData) {
    if(Number(Utilities.formatDate(receiverData[i][0], "GMT+09:00", "yyyy. MM. dd").substring(0, 4)) == targetYear && Number(Utilities.formatDate(receiverData[i][0], "GMT+09:00", "yyyy. MM. dd").substring(6, 8)) == targetMonth && receiverData[i][2] != "수동 입력") {
      receiverData[i][0] = Utilities.formatDate(receiverData[i][0], "GMT+09:00", "yyyy. MM. dd");
      dataArray.push(receiverData[i]);
    }
  }

  dataArray.sort(function(x, y) {
    var xp = x[1], yp = y[1];
    return xp == yp ? 0 : xp < yp ? -1 : 1;
  });

  for(i in dataArray) {
    var flag = 0;
    var targetDate = Number(dataArray[i][0].substring(10, 12));

    for(j in nameAssigned) {
      flag = 0;
      if(dataArray[i][1] == nameAssigned[j]) {
        flag = Number(j);
        break;
      }
    }

    if(flag) {
      volSheet.getRange('D' + (3 + flag)).setValue(dataArray[i][1]);
      volSheet.getRange(3 + flag, 5 + targetDate).setValue(Number(volSheet.getRange(3 + flag, 5 + targetDate).getValue()) + 1);
    }
    else {
      var targetRow = volSheet.getLastRow() + 1;
      nameAssigned.push(dataArray[i][1]);
      volSheet.getRange('D' + targetRow).setValue(dataArray[i][1]);
      volSheet.getRange(targetRow, 5 + targetDate).setValue(Number(volSheet.getRange(targetRow, 5 + targetDate).getValue()) + 1);
    }
  }

  var nameList = doc.getSheetByName(volSheet.getRange('AE1').getValue()).getRange('D2:G').getValues();
  volSheet.getRange('E4:E').setNumberFormat('@');

  for(i in nameAssigned) {
    var flag;
    for(j in nameList) {
      if(nameAssigned[i] == nameList[j][0]) {
        flag = Number(j) + 1;
        break;
      }
      flag = null;
    }
    if(Number(i) && flag) {
      var scoreSum = 0;
      var scoreBoard = volSheet.getRange(3 + Number(i), 6, 1, 31).getValues()[0];
      for(var j in scoreBoard) {
        scoreSum += Number(scoreBoard[j]);
      }
      volSheet.getRange('AK' + (3 + Number(i))).setValue(scoreSum);
      volSheet.getRange('C' + (3 + Number(i))).setValue(nameList[flag - 1][3]);
      volSheet.getRange('E' + (3 + Number(i))).setValue(nameList[flag - 1][2]);
    }
  }

  var isAssigned = volSheet.getRange('C4:C').getValues();

  for(i in isAssigned) {
    volSheet.getRange('B' + (4 + Number(i))).setValue((isAssigned[i] != "") ? 'O' : 'X');
    volSheet.getRange('A' + (4 + Number(i))).setValue(Number(i) + 1);
  }

  volSheet.appendRow(['상기와 같이 ' + targetYear + ' 년도 ' + targetMonth + '월 봉사활동을 하였음을 확인합니다.']);
  volSheet.appendRow([new Date().getFullYear() + '. ' + (new Date().getMonth() + 1) + '. ' + new Date().getDate() + '.']);
  volSheet.appendRow(['담당자 :                                     ']);
  volSheet.setRowHeights(volSheet.getLastRow() - 2, 3, 40);
  volSheet.getRange(volSheet.getLastRow() - 2, 1, 1, 37).merge();
  volSheet.getRange(volSheet.getLastRow() - 1, 1, 1, 37).merge();
  volSheet.getRange(volSheet.getLastRow(), 1, 1, 4).merge();
  volSheet.getRange(volSheet.getLastRow(), 5).setValue('전화번호 :                                        ');
  volSheet.getRange(volSheet.getLastRow(), 5, 1, 16).merge();
  volSheet.getRange(volSheet.getLastRow(), 21).setValue('기관명 :                                          ');
  volSheet.getRange(volSheet.getLastRow(), 21, 1, 17).merge();
  console.info('Finished Generating Document');
}
