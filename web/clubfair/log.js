if(Cookies.get('id')) {
  $.ajax(`/api/manager/${Cookies.get('id')}`).then(response => {
    if (!response.name) throw new Error(response);
    else log(response);
  })
}
else {
  Swal.fire({
    title: '관리자 코드',
    input: 'number',
    confirmButtonText: '로그인',
    showLoaderOnConfirm: true,
    allowOutsideClick: false,
    preConfirm: login => {
      return $.ajax(`/api/manager/${login}`).then(response => {
        if (!response.name) throw new Error(response);
        return response;
      }).catch(error => Swal.showValidationMessage( `${error.responseText}` ) );
    },
  }).then(result => log(result.value));
}

async function log(result) {
  Cookies.set('id', result.id);

  $('#manager').text(result.name);
  $('#body').css('display', 'block');

  logs = await $.ajax('/api/sell');
  let total = 0, statistic = {};
  for(const log of logs.reverse()) {
    total += log.price;

    for(item of JSON.parse(log.detail)) {
      if(statistic[item.name]) statistic[item.name] += Number(item.quantity);
      else statistic[item.name] = Number(item.quantity);
    }

    $('#history tbody').append(`<tr><td><input id='log-${log.id}' class='chk' type='checkbox'><label for='log-${log.id}'> ${log.id}</label></td><td><label for='log-${log.id}'>${datestring(log.timestamp)}</label></td><td><label for='log-${log.id}'>${log.manager}</label></td><td><label for='log-${log.id}'>₩${log.price.toLocaleString()}</label></td><td><label for='log-${log.id}'>${process_detail(log.detail)}</label></td><td><label for='log-${log.id}'>${log.note}</label></td></tr>`);
  }

  for (const [key, value] of Object.entries(statistic)) {
    $('#statistics tbody').append(`<tr><td>${key}</td><td>${value}개</tr>`);
  }
  $('#sell').text(total.toLocaleString());


  $('#delete').click(function() {
    let delete_list = [];
    for(const item of $('.chk:checked')) delete_list.push(Number($(item).attr('id').replace('log-', '')));
    if(!delete_list.length) return Swal.fire({ icon: 'info', text: '선택한 기록이 없습니다.' });

    Swal.fire({
      icon: 'warning',
      title: '판매 내역 삭제',
      html: `선택한 ${delete_list.length}개 내역을 삭제합니다.<br>해당 내역에 대한 재고는 복구됩니다.`,
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      confirmButtonColor: '#d33',
      showCancelButton: true
    }).then(async result => {
      if(result.isConfirmed) {
        try {
          const del = await $.ajax('/api/sell', {
            type: 'DELETE',
            data: { delete: delete_list }
          });
          location.reload();
        } catch(e) { Swal.fire({ icon: 'error', title: 'ERROR', text: e.responseText }); }
      }
    });
  });
}

function process_detail(str) {
  const data = JSON.parse(str);
  let html = '';
  for(const item of data) html += `${item.name} ${item.quantity}개<br>`;
  return html.slice(0, html.length - 4);
}
function datestring(str) { return new Date(str).toLocaleString('ko-KR'); }