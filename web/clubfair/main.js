first = true;

if(Cookies.get('id')) {
  $.ajax(`/api/manager/${Cookies.get('id')}`).then(response => {
    if (!response.name) throw new Error(response);
    else main(response);
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
  }).then(result => main(result.value));
}

async function main(result) {
  Cookies.set('id', result.id);
  await eventHandler();
  $('#manager').text(result.name);
  $('#container').css('display', 'table-cell');
  socket.emit('getInventory');
}

async function eventHandler() {
  socket = await io.connect('https://clubfair.luftaquila.io', { path: "/socket" });
  socket.on('inventoryStatus', data => {
    inventory = data;
    if(first) {
      let tablebody = '';
      for(const item of inventory) tablebody += `<tr id='item-${item.id}-row'><td id='item-${item.id}-name'>${item.name}</td><td id='item-${item.id}-price'>₩${item.price.toLocaleString()}</td><td id='item-${item.id}-inventory'>${item.inventory}개</td><td><button onclick="$('#item-${item.id}').val($('#item-${item.id}').val() > 0 ? $('#item-${item.id}').val() - 1 : 0);">-</button> <input id='item-${item.id}' class='item-count' data-name='${item.name}' type='number' value=0 readonly style="text-align: center; width: 1rem; height: 1.2rem;"> <button onclick="$('#item-${item.id}').val(Number($('#item-${item.id}').val()) + 1)">+</button></td>`;
      $('#table-body').html(tablebody);
      first = false;
    }
    else {
      for(const item of inventory) {
        $(`#item-${item.id}-name`).html(item.name);
        $(`#item-${item.id}-price`).text(`₩${item.price.toLocaleString()}`);
        $(`#item-${item.id}-inventory`).text(`${item.inventory}개`);
      }
    }
  });

  $('#table-body').on('click', 'button', function() {
    let total = 0;
    for(const item of inventory) total += Number($(`#item-${item.id}`).val()) * item.price;
    if($('#manual').prop('checked')) $('#total').val(total);
    else $('#total').text(total.toLocaleString());
  });

  $('#manual').change(function() {
    if(!$(this).prop('checked')) { // uncheck
      console.log('uncheck');
      $('#manual-container').css('display', 'none');
      let total = 0;
      for(const item of inventory) total += Number($(`#item-${item.id}`).val()) * item.price;
      $('#total-container').html(`<span id='total'>${total.toLocaleString()}</span>`);
    }
    else {
      console.log('check');
      const price = Number($('#total').text().replace(',', ''));
      if(price) {
        $('#total-container').html(`<input id='total' type='number' value='${price}' style='width: 3rem;'>`);
        $('#manual-container').css('display', 'table-row');
      }
      else $(this).prop('checked', false);
    }
  });

  $('#submit').click(async function() {
    let detail = [], sell;
    for(const item of $('.item-count')) {
      if(Number($(item).val())) {
        detail.push({
          id: $(item).attr('id').replace('item-', ''),
          name: $(item).data('name'),
          quantity: Number($(item).val())
        });
      }
    }

    if(!detail.length) return Swal.fire({ icon: 'error', title: 'ERROR', text: '판매 수량을 입력하세요.' });
    if($('#manual').prop('checked') && !$('#reason').val()) return Swal.fire({ icon: 'error', title: 'ERROR', text: '가격을 수동으로 입력하는 사유를 작성하세요.' });

    else {
      try {
        sell = await $.ajax('/api/sell', {
          type: 'POST',
          data: {
            detail: detail,
            price: $('#manual').prop('checked') ? Number($('#total').val()) : Number($('#total').text().replace(',', '')),
            reason: $('#manual').prop('checked') ? $('#reason').val() : '',
            manager: $('#manager').text()
          }
        });
        Swal.fire({ icon: 'success', title: '판매 완료!' });
        for(const item of $('.item-count')) $(item).val(0);
        $('#total-container').html(`<span id='total'>0</span>`);
        $('#manual-container').css('display', 'none');
        $('#manual').prop('checked', false);
        $('#reason').val('');
      } catch(e) { Swal.fire({ icon: 'error', title: 'ERROR', text: e.responseText }); }
    }
  });
}

