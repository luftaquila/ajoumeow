관리자 사용설명서
====================

임원진 여러분을 위한 관리자 메뉴 사용설명서입니다.

### 빠른 목차
[1. 관리자 권한 - 나! 나도 임원진이에요!](https://github.com/luftaquila/ajoumeow#1-%EA%B4%80%EB%A6%AC%EC%9E%90-%EA%B6%8C%ED%95%9C)

[2. 급식 인증 및 삭제 - 밥 주새오](https://github.com/luftaquila/ajoumeow#2-%EA%B8%89%EC%8B%9D-%EC%9D%B8%EC%A6%9D-%EB%B0%8F-%EC%82%AD%EC%A0%9C)

[3. 설정 - 학기 바꿨더니 로그인이 안 되는데요?](https://github.com/luftaquila/ajoumeow#3-%EC%84%A4%EC%A0%95)

[4. 회원 관리 - 맘에 안 드는 너, 숙청.](https://github.com/luftaquila/ajoumeow#4-%ED%9A%8C%EC%9B%90-%EA%B4%80%EB%A6%AC)

[5. 1365 - 봉사시간 모아야 군대가서 꿀빤다](https://github.com/luftaquila/ajoumeow#5-1365)

[6. 신입 모집 - 새내기 주세요!!!](https://github.com/luftaquila/ajoumeow#6-%EC%8B%A0%EC%9E%85-%EB%AA%A8%EC%A7%91)

[7. 서버 로그 - #&*(%#@?](https://github.com/luftaquila/ajoumeow#7-%EC%84%9C%EB%B2%84-%EB%A1%9C%EA%B7%B8)

[8. Dashboard - 리워드 제비뽑기 확률X망겜](https://github.com/luftaquila/ajoumeow#8-dashboard)

[9. 카카오톡 봇 - 미유미유의 망령](https://github.com/luftaquila/ajoumeow#9-%EC%B9%B4%EC%B9%B4%EC%98%A4%ED%86%A1-%EB%B4%87)

## 0. 들어가기
⚠️ 개발자가 나 쓰자고 만든 거라 버그가 많을 수 있습니다.

기능이 원하는 대로 작동하지 않는다면 개발자를 소환해 주세요.

만약 동아리가 먼 미래에까지 살아남아 이 글을 읽는 분들이 개발자가 누군지 모르신다면(쥬륵) 연락 주세요.

개발자 연락처
* <mail@luftaquila.io>
* [카카오톡](http://qr.kakao.com/talk/RmgKn.t2Sxgy8I7hwdhuYZQF1vc-) / ID: luftaquila
* [아주대학교 전자공학과 18학번 오병준](https://luftaquila.io)

<br>

관리자 콘솔은 임원진 여러분에 한해 접속 권한이 부여됩니다.

사이트의 사이드바(☰) 하단에 [관리자 콘솔](#) 을 탭해 이동합니다.

또는 링크 [luftaquila.io/ajoumeow/console](https://luftaquila.io/ajoumeow/console)에서 접속할 수 있습니다.

관리자 콘솔 링크는 급식인증방 공지로 설정해 두면 인증에 편리합니다.

그럼 관리자 권한을 부여받는 방법부터 알아봅시다.

## 1. 관리자 권한
동아리를 위해 고생하는 임원진 분들께는 특권이 몇 개 부여됩니다.
* 일반 사용자는 아직 지나지 않은 날짜의 본인이 신청한 급식만 삭제할 수 있지만,  
관리자는 지난 날짜와 타인이 신청한 모든 급식을 삭제할 수 있습니다.
* 급식표에서 모든 회원을 가림 처리하지 않고 실명으로 표시합니다.
* 관리자 콘솔에 접속할 수 있습니다.


??? : 어마어마한 특권이네요! 그럼 관리자 권한은 어떻게 받죠?
* 새 관리자 등록은 기존 임원진만 가능합니다.  
임원진 교체 시 🔥반드시🔥 신규 임원진에게 관리자 권한을 부여하고 가세요.
* 관리자 권한은 콘솔의 `회원 관리` 탭에서 `직책`이 `회원`이 아닌 모든 사람에게 부여됩니다.
* 새 임원진이 일반 회원으로 등록한 후에, 기존 임원진이 `회원 관리` 탭에서 직책을 변경하세요.
* 새 임원진은 관리자 권한을 획득한 후 기존 임원진의 직책을 수정하세요.
* 회원 정보를 변경하는 방법은 [4. 회원 관리](https://github.com/luftaquila/ajoumeow/blob/master/README.md#4-%ED%9A%8C%EC%9B%90-%EA%B4%80%EB%A6%AC)를 참고하세요.

## 2. 급식 인증 및 삭제
급식 활동은 미유미유의 핵심입니다.

여기서의 `급식 인증`은 회원의 카톡방 인증을 말하는 것이 아니라,  
관리자가 승인하여 실제로 급식을 했다고 시스템에 등록하는 것을 말합니다.

관리자의 급식 인증이 완료된 활동만 시스템에서 인정되어 자동으로 마일리지가 부여되고,  
시스템이 생성하는 1365 봉사활동 인증서 생성에 포함됩니다.

급식 인증 탭에는 세 가지 하위 기능이 있습니다.

### 급식 인증
  1. 날짜 선택 필드에서 날짜를 선택하면 해당일의 급식 신청자가 모두 표시됩니다.
  1. 인증하고자 하는 회원(**카톡 급식인증방에 인증한 회원**)만 좌측의 체크박스에 체크합니다.
      * 기본값은 다 체크된 상태입니다. 실제로 활동하지 않은 회원은 체크를 해제하세요.
      * 실제 급식을 했지만 목록에 표시되지 않을 경우 `+ 추가` 를 탭해 수동으로 인증 기록을 추가할 수 있습니다.
        * 동명이인 식별을 위해 인증 추가는 학번으로만 가능합니다 ㅠ
        * 학번을 맞게 입력하면 이름은 자동완성됩니다. 회원 관리 탭에서 이름을 검색하면 학번을 알아낼 수 있습니다.
  1. 시험 기간이나 방학 및 공휴일, 악천후 등 급식이 어려울 땐 버닝 타임🔥 이벤트로 마일리지를 상향 지급합니다. 이럴 땐 상향 지급 체크박스를 체크하세요.
  1. `인증` 을 탭해 서버로 인증 기록을 전송합니다.
  
#### ✔ 주의사항
* 급식 인증은 기타 인증 메뉴로 인증하면 안 됩니다!

기타 인증 메뉴로 인증하면 급식 마일리지 및 봉사활동 확인서에서 누락됩니다.

* 같은 날 같은 코스 급식자는 무조건 한 번에! 인증해야 합니다.
  * 동일 코스의 급식자를 따로 인증하면 2인이 아닌 1인 급식으로 마일리지가 잘못 지급됩니다.
  
### 기타 인증
동아리박람회나 봉사활동 등 급식 외 활동에 대한 마일리지를 지급합니다.
* 날짜는 오늘 날짜가 아니라 활동한 날짜로 설정하세요.
* `+ 추가` 를 탭해 입력 필드를 추가합니다.
* 인원이 둘 이상일 때 `>지급 사유 통일하기`를 누르면 모든 지급 사유가 첫 번째 항목의 사유로 자동 입력됩니다.

### 인증 삭제
이미 인증한 기록을 삭제합니다.
* 삭제할 기록이 있는 날짜를 선택하면 해당일에 인증된 모든 기록이 표시됩니다.
* 삭제할 기록만 체크한 후, `삭제` 버튼을 탭합니다.


## 3. 설정
시스템의 각종 설정값을 바꿀 수 있습니다.
* ⚠️`현재 학기` 값은 학기가 바뀌면 항상 업데이트 해 주세요.  
명단 작성 등 전산 전체에서 중요하게 사용되는 값입니다.
* ⚠️`현재 학기` 값을 변경하면 모든 회원은 로그아웃됩니다.  
변경된 새 학기 회원 목록에 새로 등록해야 로그인할 수 있습니다.  
반드시 학기를 변경한 후 회원들에게 회원 등록을 다시 해야 한다고 공지하세요.
* `공지사항` 값을 변경하면 사이트 방문 시 최초 1회 공지 팝업이 표시됩니다.

## 4. 회원 관리
현재 회원 목록을 관리하고 지난 학기 회원 목록을 열람합니다.

다운로드 버튼을 누르면 엑셀(.xlsx) 파일로 명단을 다운로드합니다.

### 현재 학기
목록에 등록된 회원만 로그인할 수 있습니다.
* 학번 외 모든 항목은 수정할 수 있습니다.  
학번 수정은 제명 후 재등록으로만 가능합니다.
* 수정할 값을 탭하면 입력창이 활성화됩니다.
* 수정할 값을 입력한 후 엔터를 눌러야 반영됩니다.

#### 회원 삭제
페이지 하단의 회원 삭제란에 학번을 입력하고 제명 버튼을 누르면 바로 회원이 제명됩니다.

### 지난 학기들
열람 및 다운로드만 가능합니다.

## 5. 1365
1365 봉사활동 확인서를 자동으로 작성하고 다운로드합니다.

인증서를 생성할 년/월 및 명단 데이터를 선택한 후 다운로드 버튼을 누르세요.

다운로드 버튼을 누르면 10초 내외로 다운로드가 시작됩니다.
* 팝업 차단을 해제해야 다운로드가 가능합니다. (아마도)

## 6. 신입 모집
신입 모집 설문지 링크와 QR코드가 있습니다.

⚠️ 모집을 시작하기 전에 반드시 `설정` 탭에서 `현재 학기` 및 `신입 모집` 설정을 업데이트하세요.

⚠️ 모집 전에 `현재 학기`를 최신화해야 신청서가 학기별로 제대로 분류됩니다.

현재 학기를 바꾸고, 기존 회원들이 새학기 회원 등록을 하는 동안 신입 모집을 동시에 진행하면 됩니다.

### 연락처 다운로드
신입 회원 단톡 초대를 위해 목록에서 일일히 전화번호를 저장하는 불상사를 막기 위해 개발했습니다.

연락처 파일을 생성할 학기를 선택하고, 파일 유형을 선택한 뒤 다운로드 버튼을 누르세요.

* Google 연락처 파일을 사용하는 경우
  1. [contacts.google.com](https://contacts.google.com/) 접속
  1. 좌측 상단 메뉴에서 가져오기 선택
  1. 다운로드한 연락처 파일 선택 후 가져오기 선택
  1. 핸드폰에서 연락처 동기화하면 `[년도]-[학기]` 미유미유 라벨에 `[학번][이름]` 형식으로 가입신청자 연락처가 저장됩니다.
  1. 카톡방 초대가 끝나면 라벨을 삭제해서 간단하게 연락처를 모두 제거할 수 있습니다.
  
* Outlook/네이버 연락처 파일을 사용하는 경우
  1. 제가 개발해놓고 써본 적이 없긴 하지만, 네이버 주소록에서 가져오기 기능으로 추가가 가능할 겁니다.
  
## 7. 서버 로그
서버 로그를 열람합니다.
* 체크된 범주의 로그만 표시합니다.
* 오류 체크박스에 체크하면 오류 기록만 표시됩니다.

## 8. Dashboard
심심할 때 보면 나름 재밌는 통계 몇 개를 보여줍니다.

활동 통계 카드의 `이 목록으로 제비뽑기` 버튼을 누르면, 해당 범주의 목록으로 리워드 제비뽑기를 시행합니다.

뽑힐 확률은 마일리지의 총합 대비 비율입니다. 즉, `본인 마일리지` ÷ `목록의 마일리지 총합` × 100(%) 입니다.

리워드 지급 정책에 따라 자유롭게 이용하시면 됩니다.

    
## 9. 카카오톡 봇
미유미유 카카오톡 채팅방에 `미유미유의 망령` 닉네임으로 봇이 실행중입니다.  

봇을 계속 사용하고 싶다면 채팅방에 미유미유의 망령을 초대하세요.

봇은 채팅방 이름의 `단톡`, `공지`, `인증` 이라는 문구를 인식하여 채팅방을 구분합니다.  

주요 기능은 다음과 같습니다.
* 급식인증방에 올라오는 회원들의 인증을 자동으로 시스템에 등록합니다.  
봇은 `인증` 이라는 문구가 포함된 채팅에서 이름과 날짜, 코스를 추출합니다.  
추출 과정에 오류가 발생할 수 있으니 관리자가 수시로 확인해 주세요.  
⚠️ 봇은 번거로운 인증을 대신 수행해 줄 뿐입니다. 데이터의 유효성과 누락 유무는 관리자가 확인해야 합니다.
* 새 회원이 단톡에 초대되면 환영 메시지를 보냅니다.  
단, 5초 이내에 반복적으로 초대되는 경우 최초 1회만 시행합니다.
* 학기가 변경되면 기존 회원 재등록 공지 메시지를 공지방에 보냅니다.

봇은 카카오톡 공식 API를 이용하는 것이 아니므로 언제든지 작동을 중지할 수 있습니다.
    
    
    
