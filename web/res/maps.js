first = true;
if (screen.width > screen.height) defaultOrientation = "landscape";
else defaultOrientation = "portrait";


function resetGPS() { navigator.geolocation.clearWatch(maps.watchId); }

async function loadMap() {
  if(first) {
    // load TMAP
    postscribe('#body', `<script src="https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=l7xx9c8a71eb1e3a4889a6352ddce00ab62c"></script>`, { done: initMap });
    first = false;
    maps = {};
  }
  else trackDevice();
}

async function initMap() {
  // init map
  maps.map = new Tmapv2.Map("map", {
    center: new Tmapv2.LatLng(37.283237, 127.045953),
    height: "400px",
    zoom: 17,
    httpsMode: true,
    zIndexMarker: 10,
    zIndexInfoWindow: 15
  });
  const map = maps.map;

  trackDevice();

  // load points data
  const points = await $.ajax('res/map.json');

  for(const [course, data] of Object.entries(points)) {
    // draw home marker
    if(course == 'home') drawMarker('home', map, new Tmapv2.LatLng(data.lat, data.lon), 'DodgerBlue', 'home.jpg', data.name, data.detail);
    else {
      // draw markers for every route
      let course_coords = [];
      for(const p of data.data) {
        const coord = new Tmapv2.LatLng(p.lat, p.lon);
        course_coords.push(coord);
        drawMarker(p.name, map, coord, data.color, `${p.name}.jpg`, p.name, p.detail);
      }

      // get route directions
      const route = await $.ajax('https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json&callback=result', {
        method: 'POST',
        data: {
          appKey: 'l7xx9c8a71eb1e3a4889a6352ddce00ab62c',
          startX: maps.home.pos.lng(),
          startY: maps.home.pos.lat(),
          endX: course_coords[course_coords.length - 1].lng(),
          endY: course_coords[course_coords.length - 1].lat(),
          passList: course_coords.slice(0, course_coords.length - 1).map(x => `${x.lng()},${x.lat()}`).join('_'),
          startName: '출발',
          endName: '도착'
        }
      });

      // draw route polyline
      let route_points = [];
      for(const f of route.features) {
        if(f.geometry.type == 'LineString') for(const p of f.geometry.coordinates) route_points.push(new Tmapv2.LatLng(p[1], p[0]));
        //else route_points.push(new Tmapv2.LatLng(f.geometry.coordinates[1], f.geometry.coordinates[0]));
      }
      new Tmapv2.Polyline({
        path: route_points,
				strokeColor: data.color,
				strokeWeight: 3,
				map: map
      });
      await delay(300);
    }
  }
}

function drawMarker(obj, map, pos, iconColor, infoImage, infoTitle, infoDescription) {
  maps[obj] = {};
  maps[obj].pos = pos;
  maps[obj].marker = new Tmapv2.Marker({
    position: pos,
    iconHTML: `<i class="fas fa-map-marker" style="font-size: 1.75rem; color: ${iconColor}"></i>`,
    iconSize: new Tmapv2.Size(30, 30),
    map: map
  });
  maps[obj].marker.addListener('click', e => { event() });
  maps[obj].marker.addListener('touchstart', e => { event() });

  function event() {
    if(maps[obj].info) return;
    maps[obj].info = new Tmapv2.InfoWindow({
      position: pos,
      content: `
        <div class='infowindow' style='position: static; display: flex; flex-direction: column; font-size: 14px; box-shadow: 5px 5px 5px #00000040; border-radius: 10px; top: 410px; left : 800px; width : 250px; background: #FFFFFF 0% 0% no-repeat padding-box;'>
        <span onclick="maps['${obj}'].info.setVisible(false); delete maps['${obj}'].info;" ontouchstart="maps['${obj}'].info.setVisible(false); delete maps['${obj}'].info;" style="position: absolute; font-size: 1.5rem; color: white; margin: 0.5rem; height: 2rem; width: 2rem; top: 0; right: 0;"><i class="fal fa-times" aria-hidden="true"></i></span>
          <img src='res/image/map/${infoImage}' style='width: 100%; height: auto; border-radius: 15px; padding: 5px;'>
          <div class='info-box' style='padding: 10px;'>
            <h3>${infoTitle}</h3>
            ${infoDescription}
          </div>
        </div>`,
        border: '0px',
        type: 2,
        map: map
    });
    $('div.infowindow').parent().css('border-radius', '10px');
  }
}

function trackDevice() {
  // set and watch current marker
  maps.watchId = navigator.geolocation.watchPosition(position => {
    const current = new Tmapv2.LatLng(position.coords.latitude, position.coords.longitude);
    if(maps.current) maps.current.setPosition(current);
    else {
      maps.current = new Tmapv2.Marker({
        position: current,
        iconHTML: `<i id='current' class="fas fa-map-marker-smile" style="font-size: 1.5rem; color: MediumOrchid"></i>`,
        iconSize: new Tmapv2.Size(30, 30),
        map: maps.map
      });
    }
  },
  e => {

  }, { enableHighAccuracy: true });
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));