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
    if(!e.parameter['점수'] && !e.parameter['신청'] && !e.parameter['수정'] && !e.parameter['삭제']) {
      var data = doc.getSheetByName('Record').getRange('G2:I').getValues(), csv = "";
      for (i in data) { csv += data[i][0] + ',' + Utilities.formatDate(data[i][1], "GMT+09:00", "yyyy. M. d") + ',' + data[i][2] + '\n'; }
      return ContentService
            .createTextOutput(csv)
            .setMimeType(ContentService.MimeType.CSV);
    }
    else if(e.parameter['점수']) {
      for (i in headers) { row.push(e.parameter[headers[i]]); }
      sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);
    }
    else {
      if(e.parameter['신청']) {
        for (i in headers) {
          if(i == 0) {
            row.push(new Date());
            continue;
          }
          row.push(e.parameter[headers[i]]);
        }
        sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);
      }
      else if(e.parameter['수정']) {
        var data = sheet.getRange('B2:D').getValues();
        for (var i = data.length - 1; i >= 0; i--) {
          if(JSON.stringify(new Date(new Date(e.parameter['날짜']) - 32400000)) == JSON.stringify(data[i][1])) {
            if(e.parameter['이름'] == data[i][0]) {
              if(e.parameter['코스'] == data[i][2]) {
                sheet.getRange('B' + (i + 2)).setValue(e.parameter['수정 이름']);
                sheet.getRange('C' + (i + 2)).setValue(e.parameter['수정 날짜']);
                sheet.getRange('D' + (i + 2)).setValue(e.parameter['수정 코스']);
                var log = [ new Date(), '수정', e.parameter['이름'], e.parameter['날짜'], e.parameter['코스'], e.parameter['수정 이름'], e.parameter['수정 날짜'], e.parameter['수정 코스'] ];
                doc.getSheetByName('Edit Log').getRange(doc.getSheetByName('Edit Log').getLastRow() + 1, 1, 1, 8).setValues([log]);
                doc.getSheetByName('Edit Log').getRange('A:H').setHorizontalAlignment('center');
                break;
              } else continue;
            } else continue;
          } else continue;
        }
      }
      else if(e.parameter['삭제']) {
        var data = sheet.getRange('B2:D').getValues();
        for (var i = data.length - 1; i >= 0; i--) {
          if(JSON.stringify(new Date(new Date(e.parameter['날짜']) - 32400000)) == JSON.stringify(data[i][1])) {
            if(e.parameter['이름'] == data[i][0]) {
              if(e.parameter['코스'] == data[i][2]) {
                sheet.deleteRow(i + 2);
                var log = [ new Date(), '삭제', e.parameter['이름'], e.parameter['날짜'], e.parameter['코스'] ];
                doc.getSheetByName('Edit Log').getRange(doc.getSheetByName('Edit Log').getLastRow() + 1, 1, 1, 5).setValues([log]);
                doc.getSheetByName('Edit Log').getRange('A:H').setHorizontalAlignment('center');
                break;
              } else continue;
            } else continue;
          } else continue;
        }
      }
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
