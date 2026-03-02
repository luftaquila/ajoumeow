import { ref } from 'vue'
import { getWeather } from '../api/index.js'

const weather = ref(null)

export function useWeather() {
  async function loadWeather() {
    try {
      weather.value = await getWeather()
    } catch (e) {
      console.error('Failed to load weather:', e)
    }
  }

  function getWeatherForDate(dateString) {
    if (!weather.value) return null
    return weather.value.forecast.find(o => o.date === dateString) || null
  }

  return {
    weather,
    loadWeather,
    getWeatherForDate,
  }
}
