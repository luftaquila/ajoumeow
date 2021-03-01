$(function() {
  $('#content').click();
    
  $('#statistics').DataTable({
    paging: false,
    lengthChange: false,
    order: [[ 1, 'desc' ]],
    ajax: {
      url: '/ajoumeow/api/record/statistics',
      beforeSend: xhr => xhr.setRequestHeader('x-access-token', Cookies.get('jwt')),
      data: d => {
        d.type = $('input[name=statisticsType]:checked').val();
        d.value = $('input[name=statisticsType]:checked').attr('data-value');
      },
      dataSrc: 'data',
      error: err => alertify.error(`${err.responseJSON.msg}<br>${err.responseJSON.data}`)
    },
    columns: [
      { data: "name" },
      { data: "score" }
    ]
  });
  
  $.ajax({
    url: '/ajoumeow/api/record/statistics',
    data: { type: 'summary' },
    success: res => {
      $('#activityTime').text(res.data.time + '시간');
      $('#activeMember').text(res.data.people + '명');
    },
    error: err => alertify.error(`${err.responseJSON.msg}<br>${err.responseJSON.data}`)
  });
});

$('input[name=statisticsType]').click(function() { $('#statistics').DataTable().ajax.reload(); });
$('.statisticsDate').change(function() {
  let start = $('#statisticsStartDate').val(), end = $('#statisticsEndDate').val();
  if(start && end) {
    $('#custom_total').attr('data-value', start + '|' + end);
    $('#statistics').DataTable().ajax.reload();
  }
  else $('#custom_total').attr('data-value', '');
});

$('#pick').click(async function() {
  // 표 데이터 저장
  let list = $('#statistics').DataTable().ajax.json().data;
  // 마일리지 오름차순 정렬
  list.sort((a, b) => a.score - b.score);
  // 누적확률 acc 및 마일리지 총합 sum 계산
  let sum = 0;
  for(let item of list) item.acc = sum += item.score;
  // 랜덤 key 추출
  let key = Math.random() * sum;
  // 누적확률 일치 값 추출
  for(let item of list) {
    if(item.acc > key) {
      key = item; break;
    }
  }
  
  if(key.name) {
    MicroModal.show('pop');
    $('#popclose').hide();
    
    $('#popgif').attr('src', '/ajoumeow/res/image/random.png');
    $('#poptext').html('당첨자는 이렇게 뽑습니다.<br><br>고양이를 부르는 중입니다<span class="dotdotdot"></span>');
    await sleep(3000);
    
    $('#popgif').attr('src', '/ajoumeow/res/image/loading.gif');
    $('#poptext').html('기지개 켜는 중<span class="dotdotdot"></span>');
    await sleep(1500);
    
    $('#poptext').html('캔 따는 중<span class="dotdotdot"></span>');
    await sleep(2000);
    
    $('#poptext').html('레이저포인터 쫓는 중<span class="dotdotdot"></span>');
    await sleep(1500);
    
    $('#popgif').attr('src', '/ajoumeow/res/image/thinking.gif');
    $('#poptext').html('생각하는 척 하는 중<span class="dotdotdot"></span><br><span style="color: transparent">당첨 확률 : 0%</span>');
    
    await sleep(5000);
    $('#popclose').show();
    $('#poptext').html('당첨자는 ' + key.name + '님이니라.<br>당첨 확률 : ' + Math.round(key.score / sum * 1000) / 10 + '%');
  }
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
