$(function() {
  $('#content').click();
  $('#logStart').val(new Date(new Date().setDate(0)).format('yyyy-mm-dd'));
  $('#logEnd').val(new Date().format('yyyy-mm-dd'));
  $('input[name=level]:checked').map(x => x.value);
  $('#serverlog').DataTable({
    pagingType: "numbers",
    pageLength: 50,
    dom: "ilfptp",
    order: [[ 0, 'desc' ]],
    search: { regex: true },
    ajax: {
      url: "/ajoumeow/api/record/log",
      beforeSend: xhr => xhr.setRequestHeader('x-access-token', Cookies.get('jwt')),
      data: d => {
        const level = Array.from($('input[name=level]:checked'), x => x.value);
        const type = Array.from($('input[name=type]:checked'), x => x.value)
        d.level = level ? level : null,
        d.type = type ? type : [];
        d.start = $('#logStart').val() + ' 00:00:00';
        d.end = $('#logEnd').val() + ' 23:59:59';
      },
      dataSrc: 'data',
      error: err => alertify.error(`${err.responseJSON.msg}<br>${err.responseJSON.data}`)
    },
    columns: [
      { data: "timestamp" },
      { data: "level" },
      { data: "IP" },
      { data: "endpoint" },
      { data: "description" },
      { data: "method" },
      { data: "status" },
      { data: "query" },
      { data: "result" }
    ],
    columnDefs: [{
      targets: 0,
      render: (data, type, row, meta) => { return new Date(data).format('yyyy-mm-dd HH:MM:ss') } 
    }, {
      targets: [ 7, 8 ],
      render: (data, type, row, meta) => {
        if(data && data.length > 30) return data.substr(0, 30) + '...';
        else return data } 
    }]
  });
});

$('#filter').click(function() {
  $('#serverlog').dataTable().fnClearTable();
  $('#serverlog').DataTable().ajax.reload();
});
$('#serverlog').on('click', 'td', function () {
  MicroModal.show('detail');
  $('#detail-content').text($('#serverlog').DataTable().cell(this).data());
});