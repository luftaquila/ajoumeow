var SCRIPT_PROP = PropertiesService.getScriptProperties();
function doGet(e) { return handleResponse(e); }
function doPost(e) { return handleResponse(e); }
function handleResponse(e) {
  var lock = LockService.getPublicLock();
  lock.waitLock(30000);
  try {
    var doc = SpreadsheetApp.openById(SCRIPT_PROP.getProperty("key"));
    var sheet = doc.getSheetByName(e.parameter['점수'] ? 'Receiver' : 'Record');
    var headRow = e.parameter.header_row || 1;
    var headers = sheet.getRange(1, 1, 1, 4).getValues()[0];
    var nextRow = sheet.getLastRow() + 1;
    var row = [];
    if(e.parameter['점수']) {
      if(e.parameter['타입'] == '인증') {
        for (i in headers) { row.push(e.parameter[headers[i]]); }
        sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);
        sheet.getRange('A2:D').sort([1, 3, 2]);
      }
      else if(e.parameter['타입'] == '제거') {
        var data = sheet.getRange('A2:D').getValues();
        for (var i = data.length - 1; i >= 0; i--) {
          if(JSON.stringify(new Date(new Date(e.parameter['날짜']) - 32400000)) == JSON.stringify(data[i][0])) {
            if(e.parameter['이름'] == data[i][1]) {
              if(e.parameter['코스'] == data[i][2]) {
                if(e.parameter['점수'] == data[i][3]) {
                  sheet.deleteRow(i + 2);
                  break;
                } else continue;
              } else continue;
            } else continue;
          } else continue;
        }
      }
      else {
        var data = sheet.getRange('A2:D').getValues(), csv = "";
        for (i in data) { csv += Utilities.formatDate(data[i][0], "GMT+09:00", "yyyy. M. d") + ',' + data[i][1] + ',' + data[i][2] + ',' + data[i][3] + '\n'; }
        return ContentService
              .createTextOutput(csv)
              .setMimeType(ContentService.MimeType.CSV);
      }
    }
    else if(e.parameter['타입'] == '신청') {
      for (i in headers) {
        if(i == 0) {
          row.push(new Date());
          continue;
        }
        row.push(e.parameter[headers[i]]);
      }
      sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);
    }
    else if(e.parameter['타입'] == '수정') {
      var data = sheet.getRange('B2:D').getValues();
      for (var i = data.length - 1; i >= 0; i--) {
        if(JSON.stringify(new Date(new Date(e.parameter['날짜']) - 32400000)) == JSON.stringify(data[i][1])) {
          if(e.parameter['이름'] == data[i][0]) {
            if(e.parameter['코스'] == data[i][2]) {
              sheet.getRange('B' + (i + 2)).setValue(e.parameter['수정 이름']);
              var log = [ new Date(), '수정', e.parameter['이름'], e.parameter['날짜'], e.parameter['코스'], e.parameter['수정 이름'] ];
              doc.getSheetByName('Edit Log').getRange(doc.getSheetByName('Edit Log').getLastRow() + 1, 1, 1, 6).setValues([log]);
              doc.getSheetByName('Edit Log').getRange('A:F').setHorizontalAlignment('center');
              break;
            } else continue;
          } else continue;
        } else continue;
      }
    }
    else if(e.parameter['타입'] == '삭제') {
      var data = sheet.getRange('B2:D').getValues();
      for (var i = data.length - 1; i >= 0; i--) {
        if(JSON.stringify(new Date(new Date(e.parameter['날짜']) - 32400000)) == JSON.stringify(data[i][1])) {
          if(e.parameter['이름'] == data[i][0]) {
            if(e.parameter['코스'] == data[i][2]) {
              sheet.deleteRow(i + 2);
              var log = [ new Date(), '삭제', e.parameter['이름'], e.parameter['날짜'], e.parameter['코스'] ];
              doc.getSheetByName('Edit Log').getRange(doc.getSheetByName('Edit Log').getLastRow() + 1, 1, 1, 5).setValues([log]);
              doc.getSheetByName('Edit Log').getRange('A:F').setHorizontalAlignment('center');
              break;
            } else continue;
          } else continue;
        } else continue;
      }
    }
    else if(e.parameter['타입'] == '일정') {
      var data = doc.getSheetByName('Schedule').getRange('A2:C').getValues(), csv = "";
      for (i in data) { csv += data[i][0] + ',' + data[i][1] + ',' + data[i][2] + ',' + data[i][3] + '\n'; }
      return ContentService
            .createTextOutput(csv)
            .setMimeType(ContentService.MimeType.CSV);
    }
    else {
      var data = doc.getSheetByName('Record').getRange('G2:I').getValues(), csv = "";
      for (i in data) { csv += data[i][0] + ',' + Utilities.formatDate(data[i][1], "GMT+09:00", "yyyy. M. d") + ',' + data[i][2] + '\n'; }
      return ContentService
            .createTextOutput(csv)
            .setMimeType(ContentService.MimeType.CSV);
    }
    return ContentService
          .createTextOutput(JSON.stringify({"result":"success", "row": nextRow, "data": e}))
          .setMimeType(ContentService.MimeType.JSON);
  }
  catch(e) {
    return ContentService
          .createTextOutput(JSON.stringify({"result":"error", "error": e}))
          .setMimeType(ContentService.MimeType.JSON);
  }
  finally {
    lock.releaseLock();
    sheet.getRange("A:D").setHorizontalAlignment("center");
  }
}
function setup() {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    SCRIPT_PROP.setProperty("key", doc.getId());
}
Date.prototype.getWeek = function() {
  var calc = new Date(this.getFullYear(), 0, 1);
  return Math.ceil((((this - calc) / 86400000) + calc.getDay() - 1) / 7);
}
