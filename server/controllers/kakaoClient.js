import fs from 'fs'
import dotenv from 'dotenv'
import { parse, stringify } from 'envfile'
import schedule from 'node-schedule'
import dateformat from 'dateformat'
import { AttachmentTemplate, ReplyAttachment, ChatType, Long } from 'node-kakao'
import imghash from 'imghash'
import axios from 'axios'

import client from '../config/node-kakao'
import util from './util/util.js'
import { Log } from './util/interface.js';

dotenv.config();
Date.prototype.getDayNum = function() { return this.getDay() ? this.getDay() : 7; }

async function kakaoClient() {
  const msg = 'Kakao login successful. Client program is in startup.';
  console.log(msg);
  util.logger(new Log('info', 'kakaoClient', 'kakaoClient()', '카톡 클라이언트 프로그램 시작', 'internal', 0, null, msg));

  const alert_schedule = schedule.scheduleJob('0 15 * * *', async () => { // 3pm at every day
    try {
      const target = client.channelManager.map.get(process.env.talkChannelId);
      const result = await util.query("SELECT * FROM record WHERE date BETWEEN '" + dateformat(new Date(), 'yyyy-mm-dd') + "' AND '" + dateformat(new Date(), 'yyyy-mm-dd') + "' ORDER BY date, course, timestamp;");
      let resultString = '안녕하세요! 오늘 급식 신청해주신 분들은\n';
      let noUserCourse = [];
      for(let i = 1; i < 4; i++) {
        const course = result.filter(o => o.course == i + '코스');
        if(course.length) {
          resultString += i + '코스 ';
          for(let obj of course) resultString += obj.name + ', ';
          resultString = resultString.slice(0, -2) + ' 님\n';
        }
        else noUserCourse.push(i);
      }
      resultString += '입니다. 오늘도 잘 부탁드려요 :D\n\n';
      
      if(noUserCourse.length) {
        if(noUserCourse.length == 3) resultString = '';
        for(let course of noUserCourse) { resultString += (course + ', '); }
        resultString = resultString.slice(0, -2) + '코스에 신청자가 없습니다! 도와주세요ㅠㅠ\n\n';
      }
    
      const wth = JSON.parse(fs.readFileSync('../res/weather.json').toString()).current;
      resultString += `오늘 아주대는 ${wth.weather}, ${wth.temp}℃에요. 체감온도는 ${wth.tempSense}℃입니다!\n미세먼지는 ${wth.dust.pm10}㎍/㎥, 초미세먼지는 ${wth.dust.pm25}㎍/㎥입니다.`;
    
      await target.sendText(resultString);
      util.logger(new Log('info', 'kakaoClient', 'alert_schedule', '카톡 급식 알림 전송', 'internal', 0, null, resultString));
    }
    catch(e) {
      util.logger(new Log('error', 'kakaoClient', 'alert_schedule', '카톡 급식 알림 전송 오류', 'internal', -1, null, e.stack));
    }
  });
  
  client.on('message', async chat => {
    try {
      chat.markChatRead(); // Read incoming chat
      if(chat.channel.id == process.env.verifyChannelId || chat.channel.id == process.env.testChannelID) {
        // add image to DB
        for(let att of chat.attachmentList) {
          if(att.MediaType == 'image/jpg' || att.MediaType == 'image/png') {
            let buffer = await axios.get(att.ImageURL, { responseType: 'arraybuffer'});
            buffer = Buffer.from(buffer.data);
            const phash = await imghash.hash(buffer);
            const test = await util.query(`SELECT *, BIT_COUNT(imgHash ^ ${`0x${phash}`}) as hd FROM verifyImage HAVING hd < 8 ORDER BY hd ASC;`);
            if(test.length) {
              util.logger(new Log('info', 'kakaoClient', 'client.on(message)', '유사 이미지 검출', 'internal', 0, null, 'ERR_SIMILAR_IMAGE_DETECTED'));
              await chat.channel.sendTemplate(new AttachmentTemplate(new ReplyAttachment(ChatType[test[0].chatType], Long.fromString(test[0].chatLogId), Long.fromString(test[0].chatSenderId), false, '원본 이미지', [], Long.ZERO), `유사한 이미지를 검출했습니다.\n유사도: ${(1 - (test[0].hd / 32)) * 100}%\nlogId: ${test[0].chatLogId}`));
            }
            else await util.query(`INSERT INTO verifyImage(chatType, chatLogId, chatSenderId, imgWidth, imgHeight, imgSize, imgHash, imgHashHex) VALUES('${ChatType[chat.Type]}', '${chat.logId}', '${chat.sender.id}', ${att.Width}, ${att.Height}, '${att.Size}', ${`0x${phash}`}, '${phash}');`);
          }
        }
        
        // Only handle message with keywords
        if(chat.text.includes('인증') && chat.text.includes('코스') && ((chat.text.includes('월') && chat.text.includes('일')) || chat.text.includes('/'))) {
          // Recognizable datestring: m월d일, m월 d일, m/d
          let targetDate = chat.text.match(/\b(\d+)\/(\d+)\b/) || chat.text.match(/(\d+)월 (\d+)일/) || chat.text.match(/(\d+)월(\d+)일/);
          if(targetDate) { // if date detected
            let targetMonth = targetDate[1];
            let targetDay = targetDate[2];
            let currentYear = new Date().getFullYear();
            let current = new Date();
            const dateList = [new Date(currentYear, Number(targetMonth) - 1, Number(targetDay)), new Date(Number(currentYear) - 1, Number(targetMonth) - 1, Number(targetDay)), new Date(Number(currentYear) + 1, Number(targetMonth) - 1, Number(targetDay))]
            dateList.sort((a, b) => { return Math.abs(current - a) - Math.abs(current - b); });
            targetDate = dateList[0]; // get nearest target date
            
            // targetDate validation
            if(targetDate.getTime() > new Date().setHours(0, 0, 0, 0)) {
              util.logger(new Log('info', 'kakaoClient', 'client.on(message)', '자동 급식 인증 실패', 'internal', 0, null, 'ERR_FUTURE_TARGET_DATE'));
              return chat.channel.sendTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat), `${dateformat(targetDate, 'yyyy년 m월 d일')}은 아직 오지 않은 미래입니다. 혹시 시간여행자?!`));
            }

            // detect target courses and members
            let targetCourses = chat.text.match(/\b(?=\d*[코스])\w+\b/g);
            let targetMembers = chat.text.match(/(?<![가-힣])[가-힣]{3}(?![가-힣])/g);
            targetMembers = targetMembers.filter(o => !(new RegExp('사진').test(o)) && !(new RegExp('요일').test(o)) );
            if(targetCourses && targetMembers) { // if courses and members are detected
              // Score table
              let score = { weekday: { solo: 1.5, dual: 1}, weekend: { solo: 2, dual: 1.5} }
            
              // Detect target date is weekand and number of people
              let isWeekEnd = targetDate.getDayNum() > 5 ? 'weekend' : 'weekday';
              let isSolo = targetMembers.length == 1 ? 'solo' : 'dual';

              // targetMember validation
              for(let i in targetMembers) { // get member student id with name
                let result = await util.query(`SELECT name, ID FROM \`namelist_${await util.getSettings('currentSemister')}\` WHERE name LIKE '%${targetMembers[i]}%';`);
                if(result.length == 1) targetMembers[i] = { name: targetMembers[i], id: result[0].ID };
                else if(!result.length) {
                  util.logger(new Log('info', 'kakaoClient', 'client.on(message)', '자동 급식 인증 실패', 'internal', 0, null, 'ERR_NO_ENTRY_DETECTED'));
                  return chat.channel.sendTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat), targetMembers[i] + ' 회원님이 회원 명단에 없어 자동 인증에 실패했습니다.'));
                }
                else {
                  util.logger(new Log('info', 'kakaoClient', 'client.on(message)', '자동 급식 인증 실패', 'internal', 0, null, 'ERR_SAME_NAME_EXISTS'));
                  return chat.channel.sendTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat), targetMembers[i] + ' 회원님 동명이인이 존재해 자동 인증이 불가능합니다. 관리자가 직접 인증해 주세요.'));
                }
              }
              
              // writing payload
              let payload = [];
              for(let course of targetCourses) { 
                for(let member of targetMembers) {
                  payload.push({
                    ID: member.id, name: member.name,
                    date: dateformat(targetDate, 'yyyy-mm-dd'), course: course + '코스',
                    score: score[isWeekEnd][isSolo]
                  });
                }
              }
              
              // add verify data to DB
              let resultString = greetings();
              resultString += '급식 활동을 등록했습니다.';
              for(let obj of payload) {
                if(chat.channel.id == process.env.verifyChannelId) await util.query(`INSERT INTO verify(ID, date, name, course, score) VALUES(${obj.ID}, '${obj.date}', '${obj.name}', '${obj.course}', '${obj.score}');`);
                resultString += '\n' + dateformat(payload[0].date, 'yyyy년 m월 d일 ') + obj.name + '님 ' + obj.course + '(' + obj.score + '점)';
              }
              chat.channel.sendTemplate(new AttachmentTemplate(ReplyAttachment.fromChat(chat), resultString));
              if(chat.channel.id == process.env.verifyChannelId) util.logger(new Log('info', 'kakaoClient', 'client.on(message)', '자동 급식 인증', 'internal', 0, null, resultString));
            }
          }
        }
      }
    }
    catch(e) {
      util.logger(new Log('error', 'kakaoClient', 'client.on(message)', '자동 급식 인증 오류', 'internal', -1, null, e.stack));
    }
  });
  
  client.on('user_join', async (channel, user) => {
    let info = channel.getUserInfo(user);
    if(!info) return;
    
    let channelName = channel.Name, channelId = channel.Id;
    let userName = info.Nickname, userId = info.Id;
    
    if(userId == process.env.myUserId) {
      try {
        // if myself invited to chatroom, update channelId
        channelId = channelId.toString();
      
        if(channelName.includes('미유미유') && channelName.includes('인증')) {
          await client.channelManager.map.get(process.env.verifyChannelId).leave();
          process.env.verifyChannelId = channelId;
        
          let envFile = parse(fs.readFileSync('./.env'));
          envFile.verifyChannelId = channelId;
          fs.writeFileSync('./.env', stringify(envFile));
          util.logger(new Log('info', 'kakaoClient', 'self user_join: verify', '카톡 인증방 초대 추적', 'internal', 0, null, channelId));
        }
        
        else if(channelName.includes('미유미유') && channelName.includes('공지')) {
          await client.channelManager.map.get(process.env.noticeChannelId).leave();
          process.env.noticeChannelId = channelId;
        
          let envFile = parse(fs.readFileSync('./.env'));
          envFile.noticeChannelId = channelId;
          fs.writeFileSync('./.env', stringify(envFile));
          util.logger(new Log('info', 'kakaoClient', 'self user_join: notice', '카톡 공지방 초대 추적', 'internal', 0, null, channelId));
        }
        
        else if(channelName.includes('미유미유') && channelName.includes('단톡')) {
          await client.channelManager.map.get(process.env.talkChannelId).leave();
          process.env.talkChannelId = channelId;
        
          let envFile = parse(fs.readFileSync('./.env'));
          envFile.talkChannelId = channelId;
          fs.writeFileSync('./.env', stringify(envFile));
          util.logger(new Log('info', 'kakaoClient', 'self user_join: common', '카톡 단톡방 초대 추적', 'internal', 0, null, channelId));
        }
      }
      catch(e) {
        util.logger(new Log('error', 'kakaoClient', 'self user_join', '카톡 채팅방 초대 추적 오류', 'internal', -1, null, e.stack));
      }
    }
  });
  
  function greetings() {
    /*
    // 주말일 때
    let weekend = ['주말에 수고하셨어요!'];
    // 날씨가 추울 때
    let coldweather = ['추운 날씨에 고생하셨어요!'];
    // 그냥
    let normal = ['수고하셨습니다!'];
    
    let target = cold ? coldweather : (new Date().isWeekend ? weekend : normal);
    let greet = target[Math.floor(Math.random() * target.length)];
    */
    return '수고하셨습니다!\n';
  }
}

export default kakaoClient