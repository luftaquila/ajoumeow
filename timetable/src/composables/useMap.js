import { ref } from 'vue'
import Cookies from 'js-cookie'

const mapLoaded = ref(false)
const watchId = ref(null)
let maps = {}

function loadTmapScript() {
  return new Promise((resolve, reject) => {
    if (window.Tmapv2) return resolve()
    const script = document.createElement('script')
    script.src = `https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=${import.meta.env.VITE_TMAP_API_KEY}`
    script.onload = resolve
    script.onerror = reject
    document.body.appendChild(script)
  })
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

export function useMap() {
  async function loadMap(containerEl) {
    if (!mapLoaded.value) {
      await loadTmapScript()
      maps = {}
      await initMap(containerEl)
      mapLoaded.value = true
    } else {
      trackDevice()
    }
  }

  async function initMap(containerEl) {
    const Tmapv2 = window.Tmapv2

    maps.map = new Tmapv2.Map(containerEl, {
      center: new Tmapv2.LatLng(37.283237, 127.045953),
      height: '400px',
      zoom: 17,
      httpsMode: true,
      zIndexMarker: 10,
      zIndexInfoWindow: 15,
    })

    trackDevice()

    // Load points data
    const jwt = Cookies.get('jwt')
    const res = await fetch('/api/record/map', { headers: { 'x-access-token': jwt } })
    const points = await res.json()

    for (const [course, data] of Object.entries(points)) {
      if (course === 'home') {
        drawMarker('home', new Tmapv2.LatLng(data.lat, data.lon), 'DodgerBlue', 'home.jpg', data.name, data.detail)
      } else {
        let course_coords = []
        for (const p of data.data) {
          const coord = new Tmapv2.LatLng(p.lat, p.lon)
          course_coords.push(coord)
          drawMarker(p.name, coord, data.color, `${p.name}.jpg`, p.name, p.detail)
        }

        try {
          const route = await fetch('https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json&callback=result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              appKey: import.meta.env.VITE_TMAP_API_KEY,
              startX: maps.home.pos.lng(),
              startY: maps.home.pos.lat(),
              endX: course_coords[course_coords.length - 1].lng(),
              endY: course_coords[course_coords.length - 1].lat(),
              passList: course_coords.slice(0, course_coords.length - 1).map(x => `${x.lng()},${x.lat()}`).join('_'),
              startName: '출발',
              endName: '도착',
            }),
          }).then(r => r.json())

          let route_points = []
          for (const f of route.features) {
            if (f.geometry.type === 'LineString') {
              for (const p of f.geometry.coordinates) route_points.push(new Tmapv2.LatLng(p[1], p[0]))
            }
          }
          new Tmapv2.Polyline({
            path: route_points,
            strokeColor: data.color,
            strokeWeight: 3,
            map: maps.map,
          })
        } catch (e) {
          console.error('Route fetch error:', e)
        }
        await delay(300)
      }
    }
  }

  function drawMarker(obj, pos, iconColor, infoImage, infoTitle, infoDescription) {
    const Tmapv2 = window.Tmapv2
    maps[obj] = { pos }
    maps[obj].marker = new Tmapv2.Marker({
      position: pos,
      iconHTML: `<i class="fas fa-map-marker" style="font-size: 1.75rem; color: ${iconColor}"></i>`,
      iconSize: new Tmapv2.Size(30, 30),
      map: maps.map,
    })

    const showInfo = () => {
      if (maps[obj].info) return
      maps[obj].info = new Tmapv2.InfoWindow({
        position: pos,
        content: `
          <div class='infowindow' style='position: static; display: flex; flex-direction: column; font-size: 14px; box-shadow: 5px 5px 5px #00000040; border-radius: 10px; width: 250px; background: #FFFFFF 0% 0% no-repeat padding-box;'>
            <span style="position: absolute; font-size: 1.5rem; color: white; margin: 0.5rem; height: 2rem; width: 2rem; top: 0; right: 0; cursor: pointer;" onclick="this.closest('.infowindow').style.display='none'"><i class="fal fa-times" aria-hidden="true"></i></span>
            <img src='/res/image/map/${infoImage}' style='width: 100%; height: auto; border-radius: 15px; padding: 5px;'>
            <div class='info-box' style='padding: 10px;'>
              <h3>${infoTitle}</h3>
              ${infoDescription}
            </div>
          </div>`,
        border: '0px',
        type: 2,
        map: maps.map,
      })
    }

    maps[obj].marker.addListener('click', showInfo)
    maps[obj].marker.addListener('touchstart', showInfo)
  }

  function trackDevice() {
    const Tmapv2 = window.Tmapv2
    if (!Tmapv2) return
    watchId.value = navigator.geolocation.watchPosition(
      position => {
        const current = new Tmapv2.LatLng(position.coords.latitude, position.coords.longitude)
        if (maps.current) maps.current.setPosition(current)
        else {
          maps.current = new Tmapv2.Marker({
            position: current,
            iconHTML: `<i id='current' class="fas fa-map-marker-smile" style="font-size: 1.5rem; color: MediumOrchid"></i>`,
            iconSize: new Tmapv2.Size(30, 30),
            map: maps.map,
          })
        }
      },
      () => {},
      { enableHighAccuracy: true },
    )
  }

  function resetGPS() {
    if (watchId.value !== null) {
      navigator.geolocation.clearWatch(watchId.value)
      watchId.value = null
    }
  }

  return {
    mapLoaded,
    watchId,
    loadMap,
    trackDevice,
    resetGPS,
  }
}
