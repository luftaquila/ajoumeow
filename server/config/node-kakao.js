import dotenv from 'dotenv'
import nodeKakao from 'node-kakao'

dotenv.config()l

const kakaoClient = new nodeKakao.TalkClient(
  process.env.TalkClientName,
  process.env.TalkClientUUID
);

export default kakaoClient;