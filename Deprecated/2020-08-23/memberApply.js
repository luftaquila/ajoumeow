function applySetup() {
    $.ajax({ // Request settings
        url: 'https://luftaquila.io/ajoumeow/api/requestSettings',
        type: "POST",
        dataType: 'json',
        cache: false,
        success: function(res) {
          settings = res;
            var current = settings['currentSemister'].split('-'), past;
            if(Number(current[1]) == 2) past = current[0] + '-' + '1';
            else past = (Number(current[0]) - 1) + '-' + '2';
            $.ajax({ // 이번학기 신규가입자 명단 요청
                url: "https://script.google.com/macros/s/AKfycbwOT83RGEPIgdu1oTM9VvBqyRN6jcEXRkGlpdqG1EUCr1HdaBxX/exec",
                data: encodeURI('type=requestAllSheetContent&semister=' + settings['currentSemister'] + '학기'),
                type: "POST",
                dataType: 'text',
                success: function(response) { newMemberList = response.split('\n').map((line) => line.split(',')); }
            });  
            $.ajax({ // 이전학기 가입자 명단 요청
                url: 'https://luftaquila.io/ajoumeow/api/requestNameList',
                data: { 'semister' : 'past' },
                type: "POST",
                dataType: 'json',
                success: function(response) { memberList = response; }
            });
        },
        error: function(req, stat, err) { alertify.error('responseCode : ' + req.status + '<br>Error : ' + req.responseText); }
    });
}

function memberApply() {
    MicroModal.show('applyForm');
    if(!$('input:radio[name=isNew]:checked').length) $('.inputField').prop('disabled', true);
    var collegeDict = {
        '공과대학' : ['기계공학과', '산업공학과', '화학공학과', '신소재공학과', '응용화학생명공학과', '환경안전공학과', '건설시스템공학과', '교통시스템공학과', '건축학과', '건축공학과', '융합시스템공학과'],
        '정보통신대학' : ['전자공학과', '소프트웨어학과', '사이버보안학과', '미디어학과', '국방디지털융합학과'],
        '자연과학대학' : ['수학과', '물리학과', '화학과', '생명과학과'],
        '경영대학' : ['경영학과', 'e-비즈니스학과', '금융공학과', '글로벌경영학과'],
        '인문대학' : ['국어국문학과', '영어영문학과', '불어불문학과', '사학과', '문화콘텐츠학과'],
        '사회과학대학' : ['경제학과', '행정학과', '심리학과', '사회학과', '정치외교학과', '스포츠레저학과'],
        '의과대학' : ['의학과'],
        '간호대학' : ['간호학과'],
        '약학대학' : ['약학과'],
        '국제학부' : ['국제통상전공', '지역연구전공(일본)', '지역연구전공(중국)'],
        '다산학부대학' : ['다산학부대학'],
        '기타' : ['기타']
    }
    eventWatcher();
    var applyCollegeHtml = '';
    for(var college in collegeDict) applyCollegeHtml += '<option value="' + college + '">' + college + '</option>';
    $('#applyCollege').html(applyCollegeHtml).change();
  
    function eventWatcher() {
        $('#applyCollege').change(function() {
            var applyDepartmentHtml = '';
            for(var i in collegeDict[$(this).val()]) applyDepartmentHtml += '<option value="' + collegeDict[$(this).val()][i] + '">' + collegeDict[$(this).val()][i] + '</option>';
            $('#applyDepartment').html(applyDepartmentHtml);
        });
        $('#applyContact').keyup(function(event) {
            event = event || window.event;
            this.value = autoHypen(this.value.trim());
            function autoHypen(str) {
                str = str.replace(/[^0-9]/g, '');
                if( str.length < 4) { return str; }
                else if(str.length < 8) { return str.substr(0, 3) + '-' + str.substr(3); }
                else { return str.substr(0, 3) + '-' + str.substr(3, 4) + '-' + str.substr(7); }
                return str;
            }
        });
        $('#applySubmit').click(function() {
            if(!$.trim($('#applyName').val())) alertify.error('이름을 입력하세요.');
            else if(!new RegExp(/\d{9}/ig).test($('#applyStudentNumber').val())) alertify.error('학번이 올바르지 않습니다');
            else if(!new RegExp(/^[0-9][0-9]([0][1-9]|[1][0-2])[0-3][0-9]$/ig).test($('#applyBirthday').val())) alertify.error('생년월일이 올바르지 않습니다.<br>주민번호 앞 6자리를 입력하세요.');
            else if(!new RegExp(/010-\d{4}-\d{4}/ig).test($('#applyContact').val())) alertify.error('연락처가 올바르지 않습니다.');
            else if(!$('#applyDepartment').val()) alertify.error('학과를 선택하세요');
            else if(!$('#applyVolunteer').val()) alertify.error('1365 아이디를 입력하세요.<br>봉사시간 지급을 윈치 않으면<br>공백(스페이스) 하나를 입력하세요.');
            else if($('input:checkbox[name=rule]:checked').length != 2) alertify.error('회칙과 개인정보 수집 및 이용에 모두 동의해 주세요');
            
            else {
                var payload = '';
                var isMember = memberList.find(o => o.ID == $('#applyStudentNumber').val());
                if($('#newMember').prop('checked')) {
                    if(!isMember) {
                        payload = 
                            '단과대학=' + $('#applyCollege').val() +
                            '&학과=' + $('#applyDepartment').val() +
                            '&학번=' + $('#applyStudentNumber').val() +
                            '&이름=' + $.trim($('#applyName').val()) + 
                            '&전화번호=' + $('#applyContact').val() +
                            '&생년월일=' + $('#applyBirthday').val() +
                            '&1365 아이디=' + $.trim($('#applyVolunteer').val()) +
                            '&가입 학기=' + '20' + settings['currentSemister'] + '학기' +
                            '&직책=' + $('#applyRole').val();
                            console.log(payload);
                    }
                    else alertify.error('신규 가입 회원이 아닙니다.');
                }
                else if($('#oldMember').prop('checked')) {
                    if(isMember) {
                        payload = 
                            '단과대학=' + $('#applyCollege').val() +
                            '&학과=' + $('#applyDepartment').val() +
                            '&학번=' + $('#applyStudentNumber').val() +
                            '&이름=' + $.trim($('#applyName').val()) + 
                            '&전화번호=' + $('#applyContact').val() +
                            '&생년월일=' + $('#applyBirthday').val() +
                            '&1365 아이디=' + $.trim($('#applyVolunteer').val()) +
                            '&가입 학기=' + isMember.register +
                            '&직책=' + $('#applyRole').val();
                            console.log(payload);
                    }
                    else alertify.error('기존 회원이 아닙니다.');
                }
                if(payload) {
                    MicroModal.close('applyForm');
                    $('#toApply').html('');
                    Cookies.set('fillName', $.trim($('#applyName').val(), {expires: 365}));

                    $('input:radio[name=isNew]:checked').prop('checked', false);
                    $('.inputField').val('');
                    $.ajax({
                      url:"https://luftaquila.io/ajoumeow/api/apply",
                        //url: "https://script.google.com/macros/s/AKfycbzxfoEcT8YkxV7lL4tNykzUt_7qwMsImV9-3BzFNvtclJOHrqM/exec",
                        data: encodeURI(/*'type=applyMember&' + */payload),
                        type: "POST",
                        dataType: 'json',
                        cache: false,
                        success: function(response) {
                          if(response.affectedRows) alertify.success('등록이 완료되었습니다.');
                          else if(response.error == 'ER_DUP_ENTRY') aleryify.error('ERR::DATA_EXISTS<br>이미 등록된 학번입니다.');
                          else alertify.error('ERR::' + response.error + '<br>관리자에게 문의하세요.');
                        },
                        error: function(req, stat, err) { alertify.error('ERR::APPLY_FAILURE<br>관리자에게 문의하세요.<br><br>responseCode : ' + req.status + '<br>Error : ' + req.responseText); }
                    });
                }
            }
        });
        $('input:radio[name=isNew]').click(function() {
          if($('#oldMember').prop('checked')) {
            $('.inputField').attr('disabled', true);
            $('#applyStudentNumber').attr('disabled', false);
          }
          else {
            $('.inputField').attr('disabled', false);
          }
        });
        $('#applyName').keyup(function(event) {
            if($('#newMember').prop('checked')) {
                for(var i in newMemberList) {
                    if($('#applyName').val() == newMemberList[i][0]) {
                        $('#applyStudentNumber').val(newMemberList[i][3]);
                        $('#applyCollege').val(newMemberList[i][1]);
                        
                        var applyDepartmentHtml = '';
                        for(var j in collegeDict[$('#applyCollege').val()]) applyDepartmentHtml += '<option value="' + collegeDict[$('#applyCollege').val()][j] + '">' + collegeDict[$('#applyCollege').val()][j] + '</option>';
                        $('#applyDepartment').html(applyDepartmentHtml).val(newMemberList[i][2]);
                        $('#applyContact').val(newMemberList[i][4]);
                    }
                }
            }
        });
        $('#applyStudentNumber').keyup(function(event) {
          if($('#oldMember').prop('checked')) {
            var target = memberList.find(o => o.ID == $('#applyStudentNumber').val());
            if(target) {
              $('#applyName').val(target.name);
              $('#applyCollege').val(target.college);
              var applyDepartmentHtml = '';
              for(var j in collegeDict[$('#applyCollege').val()]) applyDepartmentHtml += '<option value="' + collegeDict[$('#applyCollege').val()][j] + '">' + collegeDict[$('#applyCollege').val()][j] + '</option>';
              $('#applyDepartment').html(applyDepartmentHtml).val(target.department);
              $('#applyContact').val(target.phone);
              $('#applyBirthday').val(target.birthday);
              $('#applyVolunteer').val(target['1365ID']);
              $('#applyRole').val(target.role);
              return;
            }
          }
        });
    }
}