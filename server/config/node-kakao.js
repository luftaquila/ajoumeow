import dotenv from 'dotenv'
import * as nodeKakao from 'node-kakao'

dotenv.config();

const kakaoClient = new nodeKakao.TalkClient(
  process.env.TalkClientName,
  process.env.TalkClientUUID
);

export default kakaoClient;