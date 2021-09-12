import fs from 'fs'
import dotenv from 'dotenv'
import { parse, stringify } from 'envfile'
import schedule from 'node-schedule'
import dateformat from 'dateformat'
import { AuthApiClient, TalkClient, KnownChatType, ChatBuilder, ReplyContent, Long } from 'node-kakao'
import imghash from 'imghash'
import axios from 'axios'

//import client from '../config/node-kakao'
import util from './util/util.js'
import { Log } from './util/interface.js';

dotenv.config();
Date.prototype.getDayNum = function() { return this.getDay() ? this.getDay() : 7; }

const client = new TalkClient({ });
async function kakaoClient() {
  await clientLogin(client);

  clientManager(client);
  chatManager(client);
  alertManager(client);
}

async function clientLogin(client) {
  try {
    const api = await AuthApiClient.create(process.env.TalkClientName, process.env.TalkClientUUID);
    const loginRes = await api.login({ email: process.env.TalkClientLoginID, password: process.env.TalkClientLoginPW });
    if(!loginRes.success) {
      const msg = `Web API Login failure: ${loginRes.status}`
      util.logger(new Log('error', 'kakaoClient', 'kakaoClient()', '카톡 클라이언트 프로그램 실패', 'internal', -1, null, msg));
      return console.error(msg);
    }

    const clientLoginRes = await client.login(loginRes.result);
    if(!clientLoginRes.success) {
      const msg = `Client Login failure: ${clientLoginRes.status}`
      util.logger(new Log('error', 'kakaoClient', 'kakaoClient()', '카톡 클라이언트 프로그램 실패', 'internal', -1, null, msg));
      return console.error(msg);
    }

    const msg = 'Kakao login succeeded. Client program is in startup.';
    console.log(msg);
    util.logger(new Log('info', 'kakaoClient', 'kakaoClient()', '카톡 클라이언트 프로그램 시작', 'internal', 0, null, msg));
    client.channelList.get(process.env.testChannelId).sendChat(msg);
  }
  catch(e) {
    util.logger(new Log('error', 'kakaoClient', 'kakaoClient()', '카톡 클라이언트 프로그램 실패', 'internal', 0, null, e.stack));
  }
}

async function clientManager(client) {
  const client_schedule = schedule.scheduleJob('0 */6 * * *', async () => {
    client.channelList.get(process.env.testChannelId).sendChat('chk')
    .catch(async err => {
      await clientLogin(client);
      client.channelList.get(process.env.testChannelId).sendChat('chkrtr');
    });
  });
}

async function alertManager(client) {
  const alert_schedule = schedule.scheduleJob('0 13 * * *', async () => { // 3pm at every day
    try {
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
        let noUserNotifyString = '';
        for(let course of noUserCourse) { noUserNotifyString += (course + ', '); }
        noUserNotifyString = noUserNotifyString.slice(0, -2) + '코스에 신청자가 없습니다! 도와주세요ㅠㅠ\n\n';
        resultString = noUserNotifyString + resultString;
      }

      const wth = JSON.parse(fs.readFileSync('../res/weather.json').toString()).current;
      resultString += `오늘 아주대는 ${wth.weather}, ${wth.temp}℃에요.${wth.temp == wth.tempSense ? '' : ` 체감온도는 ${wth.tempSense}℃입니다!`}\n미세먼지는 ${wth.dust.pm10}㎍/㎥, 초미세먼지는 ${wth.dust.pm25}㎍/㎥입니다.`;

      client.channelList.get(process.env.talkChannelId).sendChat(resultString)
      .catch(async err => {
        await clientLogin(client);
        client.channelList.get(process.env.testChannelId).sendChat('chkrtr');
      });
      util.logger(new Log('info', 'kakaoClient', 'alert_schedule', '카톡 급식 알림 전송', 'internal', 0, null, resultString));
    }
    catch(e) {
      util.logger(new Log('error', 'kakaoClient', 'alert_schedule', '카톡 급식 알림 전송 오류', 'internal', -1, null, e.stack));
    }
  });

  const check_schedule = schedule.scheduleJob('0 20 * * *', async() => {
    try {
      const result = await util.query(`SELECT * FROM verify WHERE date BETWEEN '${dateformat(new Date(), 'yyyy-mm-dd')}' AND '${dateformat(new Date(), 'yyyy-mm-dd')}' ORDER BY date, course;`);
      let courses = new Set(['1코스', '2코스', '3코스']), message = '';
      
      for(const data of result) courses.delete(data.course);
      
      if(courses.size) {
        for(const course of courses) message += `${course.replace('코스', '')}, `;
        message = `${message.slice(0, -2)}코스가 인증되지 않았습니다.\n\n`;
        
        for(const course of courses) {
          message += `${course} 신청자는 `;
          const users = await util.query(`SELECT * FROM record WHERE date BETWEEN '${dateformat(new Date(), 'yyyy-mm-dd')}' AND '${dateformat(new Date(), 'yyyy-mm-dd')}' AND course='${course}'`);
          if(users.length) {
            for(const user of users) message += `${user.name}, `;
            message = `${message.slice(0, -2)} 님입니다.\n`;
          }
          else message += '없습니다.\n';
        }
      }
      
      message = message.slice(0, -1);
      
      client.channelList.get(process.env.staffChannelId).sendChat(message)
      .catch(async err => {
        await clientLogin(client);
        client.channelList.get(process.env.testChannelId).sendChat('chkrtr');
      });
      util.logger(new Log('info', 'kakaoClient', 'alert_schedule', '카톡 미인증 알림 전송', 'internal', 0, null, message));
    }
    catch (e) {
      util.logger(new Log('error', 'kakaoClient', 'alert_schedule', '카톡 미인증 알림 전송 오류', 'internal', -1, null, e.stack));
    }
  });
}

function chatManager(client) {
  client.on('chat', (chat, channel) => {
    channel.markRead(chat.chat);

    if(KnownChatType[chat.chat.type].includes('PHOTO')) registerImage(chat, channel);
    else if(channel.channelId == process.env.verifyChannelId || channel.channelId == process.env.testChannelId || channel.channelId == process.env.staffChannelId) autoVerify(chat, channel);
  });

  client.on('channel_added', channel => {
    try {
      if(channel.getDisplayName().includes('미유미유') && channel.getDisplayName().includes('인증')) {
        client.channelList.normal.leaveChannel(client.channelList.get(process.env.verifyChannelId), false);
        process.env.verifyChannelId = channel.channelId;

        let envFile = parse(fs.readFileSync('./.env'));
        envFile.verifyChannelId = channel.channelId;
        fs.writeFileSync('./.env', stringify(envFile));
        util.logger(new Log('info', 'kakaoClient', 'self user_join: verify', '카톡 인증방 초대 추적', 'internal', 0, null, channel.channelId));
      }

      else if(channel.getDisplayName().includes('미유미유') && channel.getDisplayName().includes('공지')) {
        client.channelList.normal.leaveChannel(client.channelList.get(process.env.noticeChannelId), false);
        process.env.noticeChannelId = channel.channelId;

        let envFile = parse(fs.readFileSync('./.env'));
        envFile.noticeChannelId = channel.channelId;
        fs.writeFileSync('./.env', stringify(envFile));
        util.logger(new Log('info', 'kakaoClient', 'self user_join: notice', '카톡 공지방 초대 추적', 'internal', 0, null, channel.channelId));
      }

      else if (channel.getDisplayName().includes('미유미유') && channel.getDisplayName().includes('단톡')) {
        client.channelList.normal.leaveChannel(client.channelList.get(process.env.talkChannelId), false);
        process.env.talkChannelId = channel.channelId;

        let envFile = parse(fs.readFileSync('./.env'));
        envFile.talkChannelId = channel.channelId;
        fs.writeFileSync('./.env', stringify(envFile));
        util.logger(new Log('info', 'kakaoClient', 'self user_join: common', '카톡 단톡방 초대 추적', 'internal', 0, null, channel.channelId));
      }

      else if (channel.getDisplayName().includes('미유미유') && channel.getDisplayName().includes('임원진')) {
        client.channelList.normal.leaveChannel(client.channelList.get(process.env.staffChannelId), false);
        process.env.staffChannelId = channel.channelId;

        let envFile = parse(fs.readFileSync('./.env'));
        envFile.staffChannelId = channel.channelId;
        fs.writeFileSync('./.env', stringify(envFile));
        util.logger(new Log('info', 'kakaoClient', 'self user_join: common', '카톡 임원진 초대 추적', 'internal', 0, null, channel.channelId));
      }
    }
    catch(e) {
      util.logger(new Log('error', 'kakaoClient', 'self user_join', '카톡 채팅방 초대 추적 오류', 'internal', -1, null, e.stack));
    }
  });

  client.on('user_join', (feedChatlog, channel, user, feed) => {
    console.log(feedChatlog, channel, user, feed);
  });
}

async function registerImage(chat, channel) {
  return; // Disable photo verifying
  try {
    if(KnownChatType[chat.chat.type].includes('MULTI')) { // MULTIPHOTO
      for(const i in chat.attachment().imageUrls) {
        processImage({
          url: chat.attachment().imageUrls[i],
          s: chat.attachment().sl[i],
          w: chat.attachment().wl[i],
          h: chat.attachment().hl[i]
        }, chat, channel);
      }
    }
    else processImage(chat.attachment(), chat, channel); // single PHOTO

    async function processImage(img, chat, channel) {
      try {
        const dbwrite = channel.channelId == process.env.verifyChannelId;
        // get image buffer from kakao server
        let buffer = await axios.get(img.url, { responseType: 'arraybuffer'});
        buffer = Buffer.from(buffer.data);
        const phash = await imghash.hash(buffer);

        // image duplication check
        if(dbwrite || channel.channelId == process.env.testChannelId) {
          const test = await util.query(`SELECT *, BIT_COUNT(imgHash ^ ${`0x${phash}`}) as hd FROM verifyImage HAVING hd < 5 ORDER BY hd, timestamp ASC;`);
          if(test.length && test[0].chatLogId != chat.chat.logId && new Date() - test[0].timestamp > 1000 * 3600) { // if test fails and not on the same chat and not in a hour
            if(dbwrite) util.logger(new Log('info', 'kakaoClient', 'client.on(message)', '유사 이미지 검출', 'internal', 0, null, 'ERR_SIMILAR_IMAGE_DETECTED'));
            channel.sendChat( new ChatBuilder().append(new ReplyContent({ logId: test[0].chatLogId, sender: { userId: test[0].chatSenderId }, text: '원본 사진', type: KnownChatType[test[0].chatType] })).text(`이전에 등록된 이미지와 ${(1 - (test[0].hd / 32)) * 100}% 유사한 이미지를 검출했습니다.\n\n기존 이미지:\n  등록일: ${dateformat(test[0].timestamp, 'yyyy-mm-dd HH:MM:ss')}\n  채팅방: ${test[0].chatChannelName}\n  전송자: ${test[0].chatSenderName}`).build(KnownChatType.REPLY) );
          }
        }

        // add image to DB
        util.logger(new Log('info', 'kakaoClient', 'client.on(message)', '이미지 등록', 'internal', 0, chat.chat.logId, phash));
        await util.query(`INSERT INTO verifyImage(chatType, chatLogId, chatSenderId, chatSenderName, chatChannelName, imgWidth, imgHeight, imgSize, imgHash, imgHashHex) VALUES('${KnownChatType[chat.chat.type]}', '${chat.chat.logId}', '${chat.getSenderInfo(channel).userId}', '${chat.getSenderInfo(channel).nickname}', '${channel.getDisplayName()}', ${img.w}, ${img.h}, '${img.s}', ${`0x${phash}`}, '${phash}');`);
      }
      catch(e) {
        console.error(e);
        channel.sendChat(e.stack);
        util.logger(new Log('error', 'kakaoClient', 'client.on(message)', '이미지 등록 오류', 'internal', -1, null, e.stack));
      }
    }
  }
  catch(e) {
    console.error(e);
    channel.sendChat(e.stack);
    util.logger(new Log('error', 'kakaoClient', 'client.on(message)', '이미지 등록 오류', 'internal', -1, null, e.stack));
  }
}

async function autoVerify(chat, channel) {
  try {
    if(chat.text.includes('자니')) return channel.sendChat('아니요 ㅎㅎ');
    if( !chat.text.includes('코스') || (!chat.text.includes('인증') && !chat.text.includes('삭제')) ) return;

    // Recognizable datestring: m월d일, m월 d일, m/d
    let targetDate = chat.text.match(/\b(\d+)\/(\d+)\b/) || chat.text.match(/(\d+)월 (\d+)일/) || chat.text.match(/(\d+)월(\d+)일/);
    if(!targetDate) return;

    const targetMonth = targetDate[1], targetDay = targetDate[2], currentYear = new Date().getFullYear();
    const dateList = [new Date(currentYear, Number(targetMonth) - 1, Number(targetDay)), new Date(Number(currentYear) - 1, Number(targetMonth) - 1, Number(targetDay)), new Date(Number(currentYear) + 1, Number(targetMonth) - 1, Number(targetDay))]
    dateList.sort((a, b) => { return Math.abs(new Date() - a) - Math.abs(new Date() - b); });
    targetDate = dateList[0]; // closest target date with year prediction

    // targetDate validation in verify mode
    if(chat.text.includes('인증')) {
      if(targetDate.getTime() > new Date().setHours(0, 0, 0, 0)) {
        util.logger(new Log('info', 'kakaoClient', 'client.on(message)', '자동 급식 인증 실패', 'internal', 0, null, 'ERR_FUTURE_TARGET_DATE'));
        return channel.sendChat( new ChatBuilder().append(new ReplyContent(chat.chat)).text(`${dateformat(targetDate, 'yyyy년 m월 d일')}은 아직 오지 않은 미래입니다. 혹시 시간여행자?!`).build(KnownChatType.REPLY) );
      }
      else if(targetDate.getTime() < new Date().setHours(0, 0, 0, 0)) {
        util.logger(new Log('info', 'kakaoClient', 'client.on(message)', '자동 급식 인증 실패', 'internal', 0, null, 'ERR_PAST_TARGET_DATE'));
        return channel.sendChat( new ChatBuilder().append(new ReplyContent(chat.chat)).text(`${dateformat(targetDate, 'yyyy년 m월 d일')}은 지난 날짜이므로 자동으로 인증하지 않습니다.`).build(KnownChatType.REPLY) );
      }
    }

    // detect target courses and members
    const filters = ['사진', '요일', '코스', '인증', '삭제', '없'];
    let targetCourses = chat.text.match(/\b(?=\d*[코스])\w+\b/g);
    let targetMembers = chat.text.match(/(?<![가-힣])[가-힣]{2,3}(?![가-힣])/g);
    if(targetMembers) targetMembers = targetMembers.filter(m => {
      for(const f of filters) { if( m.includes(f) ) return false; }
      return true;
    });
    if(!targetCourses.length || !targetMembers.length) return;

    // targetMember validation
    for(let i in targetMembers) { // get member student id with name
      let result = await util.query(`SELECT name, ID FROM \`namelist_${await util.getSettings('currentSemister')}\` WHERE name='${targetMembers[i]}';`);
      if(result.length == 1) targetMembers[i] = { name: targetMembers[i], id: result[0].ID };
      else if(!result.length) {
        if(chat.text.includes('인증')) {
          util.logger(new Log('info', 'kakaoClient', 'client.on(message)', '자동 급식 인증 실패', 'internal', 0, null, 'ERR_NO_ENTRY_DETECTED'));
          return channel.sendChat( new ChatBuilder().append(new ReplyContent(chat.chat)).text(`${targetMembers[i]}님이 회원 명단에 없어 자동으로 인증하지 못했습니다.`).build(KnownChatType.REPLY) );
        }
        else if(chat.text.includes('삭제')) {
          util.logger(new Log('info', 'kakaoClient', 'client.on(message)', '자동 급식 인증 삭제 실패', 'internal', 0, null, 'ERR_NO_ENTRY_DETECTED'));
          return channel.sendChat( new ChatBuilder().append(new ReplyContent(chat.chat)).text(`${targetMembers[i]}님이 회원 명단에 없어 인증 기록을 삭제하지 못했습니다.`).build(KnownChatType.REPLY) );
        }
      }
      else {
        if(chat.text.includes('인증')) {
          util.logger(new Log('info', 'kakaoClient', 'client.on(message)', '자동 급식 인증 실패', 'internal', 0, null, 'ERR_SAME_NAME_EXISTS'));
          return channel.sendChat( new ChatBuilder().append(new ReplyContent(chat.chat)).text(`${targetMembers[i]}님과 이름이 같은 사람이 있어 대화형 자동 인증이 불가능합니다. 관리자 콘솔에서 인증해 주세요.`).build(KnownChatType.REPLY) );
        }
        else if(chat.text.includes('삭제')) {
          util.logger(new Log('info', 'kakaoClient', 'client.on(message)', '자동 급식 인증 삭제 실패', 'internal', 0, null, 'ERR_SAME_NAME_EXISTS'));
          return channel.sendChat( new ChatBuilder().append(new ReplyContent(chat.chat)).text(`${targetMembers[i]}님과 이름이 같은 사람이 있어 대화형 삭제가 불가능합니다. 관리자 콘솔에서 삭제해 주세요.`).build(KnownChatType.REPLY) );
        }
      }
    }

    // Score table
    let score = { weekday: { solo: 1.5, dual: 1}, weekend: { solo: 2, dual: 1.5} }

    // Detect target date is weekand and number of people
    let isWeekEnd = targetDate.getDayNum() > 5 ? 'weekend' : 'weekday';
    let isSolo = targetMembers.length == 1 ? 'solo' : 'dual';

    // writing payload
    let payload = [];
    for(let course of targetCourses) {
      for(let member of targetMembers) {
        payload.push({
          ID: member.id, name: member.name,
          date: dateformat(targetDate, 'yyyy-mm-dd'),
          course: course + '코스',
          score: score[isWeekEnd][isSolo]
        });
      }
    }

    // db writing and reply
    const dbwrite = (channel.channelId == process.env.verifyChannelId || channel.channelId == process.env.staffChannelId);
    if(chat.text.includes('인증')) {
      let resultString = greetings(), prevCourse = null;
      resultString += `${dateformat(payload[0].date, 'yyyy년 m월 d일')} 급식 활동을 등록했습니다.`;
      for(let i in payload) {
        if(dbwrite) await util.query(`INSERT INTO verify(ID, date, name, course, score) VALUES(${payload[i].ID}, '${payload[i].date}', '${payload[i].name}', '${payload[i].course}', '${payload[i].score}');`);
        if(prevCourse != payload[i].course) resultString += `\n${payload[i].course} `;
        resultString += `${payload[i].name}, `;
        if(!payload[Number(i) + 1] || (payload[Number(i) + 1] && payload[i].course != payload[Number(i) + 1].course)) resultString = `${resultString.slice(0, -2)} 회원님 (${prevCourse == payload[i].course ? '각 ' : ''}${payload[i].score}점)`;
        prevCourse = payload[i].course;
      }
      channel.sendChat( new ChatBuilder().append(new ReplyContent(chat.chat)).text(resultString).build(KnownChatType.REPLY) );
      if(dbwrite) util.logger(new Log('info', 'kakaoClient', 'client.on(message)', '자동 급식 인증', 'internal', 0, null, resultString));
    }

    else if(chat.text.includes('삭제')) {
      let targets = [];
      for(let i in payload) {
        const res = await util.query(`SELECT name, date, course, ID from verify WHERE ID=${payload[i].ID} AND date='${payload[i].date}' AND name='${payload[i].name}' AND course='${payload[i].course}';`);
        if(res[0]) targets.push(res[0]);
      }
      let resultString = targets.length ? '다음 급식 기록을 삭제했습니다.' : '삭제할 데이터가 없습니다.';
      for(let o of targets) {
        let result = '';
        if(dbwrite) result = await util.query(`DELETE FROM verify WHERE ID=${o.ID} AND date='${dateformat(o.date, 'yyyy-mm-dd')}' AND name='${o.name}' AND course='${o.course}';`);
        resultString += `\n${dateformat(o.date, 'yyyy-mm-dd')} ${o.name} ${o.course}`;
      }
      resultString += `\nOkPacket { affectedRows: ${targets.length}, insertId: 0, warningStatus: ${targets.length ? '0' : '1'} }`;

      channel.sendChat( new ChatBuilder().append(new ReplyContent(chat.chat)).text(resultString).build(KnownChatType.REPLY) );
      if(dbwrite) util.logger(new Log('info', 'kakaoClient', 'client.on(message)', '자동 급식 인증 삭제', 'internal', 0, null, resultString));
    }
  }
  catch(e) {
    channel.sendChat(e.stack);
    util.logger(new Log('error', 'kakaoClient', 'client.on(message)', '자동 급식 인증 오류', 'internal', -1, null, e.stack));
  }
}

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

export default kakaoClient
export { client }
