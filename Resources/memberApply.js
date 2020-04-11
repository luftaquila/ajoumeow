function applySetup() {
    $.ajax({ // Request settings
        url: "https://script.google.com/macros/s/AKfycbzxfoEcT8YkxV7lL4tNykzUt_7qwMsImV9-3BzFNvtclJOHrqM/exec",
        data: encodeURI('type=requestSettings'),
        type: "POST",
        dataType: 'text',
        cache: false,
        success: function(response) {
            settingList = response.split('\n').map((line) => line.split(','));
            
            var current = settingList[0][1].split('-'), past;
            if(Number(current[1]) == 2) past = current[0] + '-' + '1';
            else past = (Number(current[0]) - 1) + '-' + '2';
            
            
            $.ajax({ // 이전학기 가입자 명단 요청
                url: "https://script.google.com/macros/s/AKfycbzxfoEcT8YkxV7lL4tNykzUt_7qwMsImV9-3BzFNvtclJOHrqM/exec",
                data: encodeURI('type=requestMemebers&semister=' + past),
                type: "POST",
                dataType: 'text',
                cache: false,
                success: function(response) { memberList = response.split('\n').map((line) => line.split(',')); }
            });
            var assignDate = settingList[1][1].split('~');
            if( (new Date() > new Date(assignDate[0]) && new Date() < new Date(new Date(assignDate[1]).getTime() + 60 * 60 * 24 * 1000)) || (settingList[2][1] == 'true')) {
                $('#toApply').html('회원 등록<br><span style="font-size:0.4rem"><br></span>').click(memberApply);
            }
        }
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
            else if(!new RegExp(/^[0-9][0-9]([0][1-9]|[1][1-2])[0-3][0-9]$/ig).test($('#applyBirthday').val())) alertify.error('생년월일이 올바르지 않습니다.<br>주민번호 앞 6자리를 입력하세요.');
            else if(!new RegExp(/010-\d{4}-\d{4}/ig).test($('#applyContact').val())) alertify.error('연락처가 올바르지 않습니다.');
            else if(!$('#applyDepartment').val()) alertify.error('학과를 선택하세요');
            else if(!$('#applyVolunteer').val()) alertify.error('1365 아이디를 입력하세요.<br>봉사시간 지급을 윈치 않으면<br>공백(스페이스) 하나를 입력하세요.');
            else if($('input:checkbox[name=rule]:checked').length != 2) alertify.error('회칙과 개인정보 수집 및 이용에 모두 동의해 주세요');
            
            else {
                var payload = '', isMember = false;
                for(var i in memberList) if($.trim($('#applyName').val()) == memberList[i][3] && $('#applyStudentNumber').val() == memberList[i][2]) { isMember = i; break; }
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
                            '&가입 학기=' + '20' + settingList[0][1] + '학기';
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
                            '&가입 학기=' + memberList[i][7];
                            console.log(payload);
                    }
                    else alertify.error('기존 회원이 아닙니다.');
                }
                if(payload) {
                    MicroModal.close('applyForm');
                    $('#toApply').html('');
                    Cookies.set('fillName', $.trim($('#applyName').val(), {expires: 365}));
                    alertify.log('등록 진행 중...');
                    $('input:radio[name=isNew]:checked').prop('checked', false);
                    $('.inputField').val('');
                    $.ajax({
                        url: "https://script.google.com/macros/s/AKfycbzxfoEcT8YkxV7lL4tNykzUt_7qwMsImV9-3BzFNvtclJOHrqM/exec",
                        data: encodeURI('type=applyMember&' + payload),
                        type: "POST",
                        dataType: 'text',
                        cache: false,
                        success: function(response) { alertify.success('등록이 완료되었습니다.'); },
                        error: function(response) { alertify.error('ERR::APPLY_FAILURE<br>관리자에게 문의하세요.'); }
                    });
                }
            }
        });
        $('input:radio[name=isNew]').click(function() { $('.inputField').attr('disabled', false); });
        $('#applyName').keyup(function(event) {
            if($('#oldMember').prop('checked')) {
                for(var i in memberList) {
                    if($('#applyName').val() == memberList[i][3]) {
                        $('#applyStudentNumber').val(memberList[i][2]);
                        $('#applyCollege').val(memberList[i][0]);
                        
                        var applyDepartmentHtml = '';
                        for(var j in collegeDict[$('#applyCollege').val()]) applyDepartmentHtml += '<option value="' + collegeDict[$('#applyCollege').val()][j] + '">' + collegeDict[$('#applyCollege').val()][j] + '</option>';
                        $('#applyDepartment').html(applyDepartmentHtml).val(memberList[i][1]);
                        
                        $('#applyContact').val(memberList[i][4]);
                        $('#applyBirthday').val(memberList[i][5]);
                        $('#applyVolunteer').val(memberList[i][6]);
                        return;
                    }
                }
            } 
        });
    }
}