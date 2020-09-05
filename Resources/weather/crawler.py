import os
import re
import math
import time
import json
import glob
import urllib.request
import datetime
import threading
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support import expected_conditions as EC
chrome_options = webdriver.ChromeOptions()
chrome_options.add_argument('--headless')
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')

def wth():
  try:
    print('Work started at', time.time())
    
    # load previous data
    data  = {}
    try:
      with open("/home/luftaquila/HDD/ajoumeow/Resources/weather/weather.json") as f:
        data = json.load(f)
    except: pass
    
    # load driver
    driver = webdriver.Chrome(executable_path='/usr/bin/chromedriver', options=chrome_options)
    
    # request and process weather page
    driver.get('http://www.kweather.co.kr/kma/kma_digital.html?area2_name=%EC%88%98%EC%9B%90%EC%8B%9C+%EC%98%81%ED%86%B5%EA%B5%AC%0D%0A%09%091034%7C%EB%A7%A4%ED%83%841%EB%8F%99%0D%0A%09%091035%7C%EB%A7%A4%ED%83%842%EB%8F%99%0D%0A%09%091036%7C%EB%A7%A4%ED%83%843%EB%8F%99%0D%0A%09%091037%7C%EB%A7%A4%ED%83%844%EB%8F%99%0D%0A%09%091040%7C%EC%98%81%ED%86%B51%EB%8F%99%0D%0A%09%091041%7C%EC%98%81%ED%86%B52%EB%8F%99%0D%0A%09%091038%7C%EC%9B%90%EC%B2%9C%EB%8F%99%0D%0A%09%091039%7C%EC%9D%B4%EC%9D%98%EB%8F%99%0D%0A%09%091042%7C%ED%83%9C%EC%9E%A5%EB%8F%99%0D%0A%09&area1=area_8&area2=19&area3=1038%7C%EC%9B%90%EC%B2%9C%EB%8F%99&x=27&y=14')
    WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.ID, 'main')))
    html = driver.find_element(By.CSS_SELECTOR, 'div#Container').get_attribute('innerHTML')    
    container = BeautifulSoup(html, 'html.parser')
        
    # save current weather
    data['current_weather'] = {}
    data['current_weather']['temp'], data['current_weather']['stat'] = container.select_one('div.kma_digital_present ul.kma_digital_predent_wtext li').string.split(' ')
    data['current_weather']['temp'] = math.floor(float(data['current_weather']['temp'].replace('℃', '')))
    
    # delete folder 'icon'
    for f in glob.glob('/home/luftaquila/HDD/ajoumeow/Resources/weather/icon/*.png'): os.remove(f)
    
    # save current weather icon
    current_src = container.select_one('div.kma_digital_present ul.kma_digital_predent_icon img')['src'].replace('..', 'http://www.kweather.co.kr', 1)
    urllib.request.urlretrieve(current_src, "/home/luftaquila/HDD/ajoumeow/Resources/weather/icon/now.png")
    
    # save weather forecast
    forecast = container.select('div.kma_digital_content_02')
    forecast = forecast[len(forecast) - 1].select('table.kma_digital_week_cont_table')

    if not 'weather_forecast' in data: data['weather_forecast'] = []
    for day in forecast:
      date, temp = day.select('tr.kma_digital_bg_02')
      date = re.sub('\(.\)', '', date.td.string.replace(' ', '')).replace('월', '-').replace('일', '')
      
      stat = day.select('tr.kma_digital_bg_01 td')
      stat = stat[len(stat) - 1].select_one('span.kma_digital_week_wtext').string
      
      temp_min = temp.td.select_one('span.lifestyle_min').string.replace('℃', '')
      temp_max = temp.td.select_one('span.lifestyle_max').string.replace('℃', '')
      temp = str(math.floor((int(temp_min) + int(temp_max)) / 2)) + '℃'
      
      icon = day.select('div.kma_digital_week_icon img')
      icon = icon[len(icon) - 1]['src'].replace('..', 'http://www.kweather.co.kr', 1)
      urllib.request.urlretrieve(icon, "/home/luftaquila/HDD/ajoumeow/Resources/weather/icon/" + date + ".png")
      
      tgt = list(filter(lambda x: x['day'] == date, data['weather_forecast']))
      if tgt: tgt = { 'day': date, 'temp': temp, 'stat': stat }
      else: data['weather_forecast'].append({ 'day': date, 'temp': temp, 'stat': stat })

    # request current dust page
    driver.get('http://kweather.co.kr/air/air_area_realtime_popup6_kiot.html?acode=4111755000&pm=pm25')
    WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.CSS_SELECTOR, 'div#timeline_pm10 svg g path')))
    data['current_weather']['dust'] = {}
    data['current_weather']['dust']['pm10'] = driver.find_element(By.ID, 'nowdata_pm10_value').text.replace('㎍/㎥', '')
    data['current_weather']['dust']['pm25'] = driver.find_element(By.ID, 'nowdata_pm25_value').text.replace('㎍/㎥', '')
    
    data['update'] = int(time.time())

    # write data into file
    with open("/home/luftaquila/HDD/ajoumeow/Resources/weather/weather.json", "w") as f:
      f.write(json.dumps(data, ensure_ascii = False))

    driver.quit()
    print('Work finished at', time.time())
    
    #threading.Timer(3600, wth).start()
    
  except: pass
  
wth()
