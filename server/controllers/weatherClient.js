import fs from 'fs/promises'
import axios from 'axios'
import schedule from 'node-schedule'
import dateformat from 'dateformat'
import util from './util/util.js'

function weatherClient() {
  util.logger(new Log('info', 'weatherClient', 'weatherClient()', '날씨 크롤링 프로그램 시작', 'internal', 0, null, null));
  const weather_schedule = schedule.scheduleJob('*/30 * * * *', async () => { // every 30 minutes
    try {
      const currentWeather = axios.get('https://weather.kweather.co.kr/weather/kweather/get_current_weather/119');
      const currentDust = axios.get('https://weather.kweather.co.kr/finedust/detail/get_current_table_data/4111755000');
      const threeDayWeather = axios.get('https://weather.kweather.co.kr/weather/kweather/get_forecast_halfd/41117550');
      const weekWeather = axios.get('https://weather.kweather.co.kr/weather/kweather/get_forecast_week/41117550');
      
      Promise.all([currentWeather, currentDust, threeDayWeather, weekWeather]).then(responses => {
        let data = { current: {}, forecast: [] };
        const year = new Date().getFullYear(), current = new Date();
        
        // processing currentWeather
        data.current.weather = responses[0].data.weather;
        data.current.temp = responses[0].data.weather;
        data.current.tempSense = responses[0].data.tempSense;
        data.current.icon = responses[0].data.icon;
        
        // processing currentDust
        const dustTarget = responses[1].data.guList.find(x => x.gCode == "4111700000").dongList.find(x => x.dCode == "4111755000");
        data.current.dust.pm10 = dustTarget.pm10Value;
        data.current.dust.pm25 = dustTarget.pm25Value;
        
        // processing threeDayWeather
        for(let date of responses[2].weatherList) {
          // exact date estimation 
          const [total, month, day] = date[date.length - 1].date.match(/\b(\d+)\/(\d+)\b/);
          let dateList = [new Date(year, Number(month) - 1, Number(day)), new Date(Number(year) - 1, Number(month) - 1, Number(day)), new Date(Number(year) + 1, Number(month) - 1, Number(day))];
          dateList.sort((a, b) => { return Math.abs(current - a) - Math.abs(current - b); });
          data.forecast.append({
            date: dateformat(dateList[0], 'yyyy-mm-dd'),
            weather: date.weather,
            temp: Math.round((date.tempMax + date.tempMin) / 2),
            icon: date.icon
          });
        }
        
        // processing weekWeather
        for(let date of responses[3].weatherList.filter(x => !x.ampm)) {
          // exact date estimation 
          const [total, month, day] = date.date.match(/\b(\d+)\/(\d+)\b/);
          let dateList = [new Date(year, Number(month) - 1, Number(day)), new Date(Number(year) - 1, Number(month) - 1, Number(day)), new Date(Number(year) + 1, Number(month) - 1, Number(day))];
          dateList.sort((a, b) => { return Math.abs(current - a) - Math.abs(current - b); });
          data.forecast.append({
            date: dateformat(dateList[0], 'yyyy-mm-dd'),
            weather: date.weather,
            temp: Math.round((date.tempMax + date.tempMin) / 2),
            icon: date.icon
          });
        }
        fs.writeFile('../../res/weather.json', JSON.stringify(data)).then(() => {
          util.logger(new Log('info', 'weatherClient', 'weather_schedule', '날씨 크롤링 완료', 'internal', 0, null, data));
        });
      });
    }
    catch(e) {
      util.logger(new Log('error', 'weatherClient', 'weather_schedule', '날씨 크롤링 오류', 'internal', -1, null, e.stack));
    }
  });
}

export default weatherClient