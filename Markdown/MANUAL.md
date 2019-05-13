아주대학교 미유미유
=================

아주대학교 고양이동아리 미유미유 급식일정관리 시스템 사용설명서  

개발자 연락처
* [Github](https://github.com/luftaquila)  
* [Facebook](http://www.facebook.com/luftaquila)  
* <luftaquila@protonmail.ch>  

## 0. 개요
> 본 시스템은 Google Spreadsheet를 데이터베이스로, [Google Apps Script](https://github.com/luftaquila/ajoumeow/tree/master/Resources/Google%20Apps%20Script) 서비스를 DB 수정 및 CORS정책 우회를 위한 프록시 서버로 사용하고 있습니다.
[데이터베이스](https://docs.google.com/spreadsheets/d/1tubdLyELoYAPi8f3PVeh6jfIbQiQ3au3frIVEbnj20A/edit?usp=sharing) 또는 [스크립트 프로젝트](https://script.google.com/d/1TPa1Y82h5m5IQqZAvVxKipTICYfSxSup2qCbqFhavFd0m50G9TRQymbV/edit) 접근 권한이 필요한 경우 위 연락처로 연락하세요.  
사이트 동작 알고리즘은 [main.js](https://github.com/luftaquila/ajoumeow/tree/master/Resources/README.md) 문서를 참조하세요.  
관리자 메뉴 사용설명서는 [ADMIN.md](https://github.com/luftaquila/ajoumeow/blob/master/Markdown/ADMIN.md)를 참조하세요.
>

## 1. 페이지 최초 방문
페이지를 해당 브라우저에서 처음 방문했을 경우 이름을 묻는 팝업이 출력됩니다.
* 입력한 이름은 신청 시 이름 자동완성에 사용되며 365일간 쿠키로 개별 디바이스에 저장됩니다.
* 쿠키는 이후 신청시마다 새로 저장되어 마지막으로 신청한 이름을 기억합니다.

## 2. 페이지 상단 메뉴
### 1. 탭 선택
* `급식` 탭은 3주간의 급식 일정표를 표시합니다.  
해당일이 평일이면 평일 급식표를, 주말이면 주말 급식표를 먼저 표시합니다.  
화면을 좌우로 슬라이드하면 평일/주말 급식표를 전환할 수 있습니다.  
* `사료` 탭은 사료 소분 일정을 표시합니다. 현재 기능 준비중입니다.
* `민원` 탭은 익명 건의사항 제출 설문지를 표시합니다.

### 2. 새로고침 아이콘
페이지 데이터 로딩 중 회전하는 새로고침 아이콘입니다.  
로딩을 완료하면 정지합니다.
* 클릭하면 급식표 정보를 다시 로드할 수 있습니다.

### 3. 날짜 및 날씨 정보
항상 페이지 상단에 표시되는 아주대학교 날씨정보입니다.
* `날짜`, `날씨 아이콘`, `날씨`, `기온`, `미세먼지 농도`로 구성되어 있습니다.  

* `날짜` 는 해당일의 날짜를 m월 d일 dddd 형식으로 표시합니다.  
ex) 5월 12일 수요일

* `날씨 아이콘` 및 `날씨`는 페이지를 보는 시점의 날씨가 아닌, 3시간 단위의 **수원시 영통구 원천동** 기상청 예보 데이터입니다.  
`맑음`, `구름 조금`, `구름 많음`, `눈`, `비`, `흐림`, `눈/비` 의 7개 날씨 상태와 아이콘이 존재합니다.  
ex) 16시 30분에 페이지를 방문하면 표시되는 날씨는 18시 00분 예보 데이터입니다.  

* `기온`은 [OpenWeatherMap](https://openweathermap.org/city/1835553)에서 가져온 수원시 기온을 섭씨 단위로 표시합니다.  
매 10분마다 갱신됩니다.

* `미세먼지 농도`는 [에어코리아](https://www.airkorea.or.kr/index)가 제공하는 수원시청 관측소의 PM10과 PM2.5정보를 표시합니다.  
매 1시간마다 갱신됩니다.

## 3. 급식 신청, 수정 및 삭제
### 0. 주의사항
* 급식자는 반드시 **급식표상 해당일에 이름이 존재**해야 마일리지 지급이 가능합니다.
* 해당일에 신청이 되어 있어도 급식 인증에 이름이 없으면 마일리지를 지급하지 않습니다.  

* **모든 신청, 수정, 삭제 내역은 데이터베이스에 기록됩니다.**
* 데이터 전송 후 자동으로 급식표가 새로고침됩니다.

### 1. 신청
급식표에서 빈 셀을 선택하면 신청 창이 표시됩니다.
1. `이름`은 최초 방문시 입력한 이름으로 자동완성되지만, 필요 시 수정할 수 있습니다.
    * 이름을 수정한 후 신청 내용을 전송하면 다음부터는 수정한 이름으로 자동완성됩니다.
1. `신청` 버튼을 눌러 입력한 내용을 전송합니다.

### 2. 수정
선택한 날짜 및 코스의 급식자를 수정합니다.
1. 급식표에서 신청자가 존재하는 셀을 선택하면 수정 및 삭제 창이 표시됩니다.
1. 수정할 이름을 `이름` 필드에 입력합니다.
1. `수정` 버튼을 눌러 입력한 내용을 전송합니다.

* 날짜 및 코스를 수정하려면 해당 내용을 삭제한 후 새로 신청하십시오.

### 3. 삭제
이미 제출한 신청 내용을 삭제합니다.
1. 급식표에서 신청자가 존재하는 셀을 선택하면 수정 및 삭제 창이 표시됩니다.
1. `삭제` 버튼을 누르면 삭제 확인 알림이 표시됩니다.
1. `확인` 버튼을 누르면 입력한 내용을 전송합니다.

### + 입력 필터링
입력한 내용이 유효성 검사를 통과하지 못하면 경고창을 출력하며, 데이터를 전송하지 않습니다.  
* 접근 권한이 없는 셀은 선택해도 신청 메뉴가 표시되지 않습니다.

1. 이름 미입력
    * 이름 입력 필드가 비어 있거나 공백만 존재할 경우 **이름을 입력하세요.** 에러를 출력합니다.

1. 이름에 금지된 문자 사용  
콤마(,)는 데이터 처리에 이용되어 이름 입력 필드에 사용할 수 없습니다.
    * 콤마 입력 시 **이름에 콤마(,)는 사용할 수 없습니다.** 에러를 출력합니다.

1. 당일 급식 삭제 시도  
갑작스런 취소로 인한 급식 동행자의 불편을 막기 위해 급식 당일에 신청 내용의 삭제는 불가합니다.
    * 시도 시 **당일 삭제는 불가능합니다.** 에러를 출력합니다.

1. 전일 오후 6시 이후 취소 혹은 수정 시도  
동일한 이유로 급식 전날 6시 이후 취소는 불가능합니다.
    * 시도 시 **급식 전일 오후 6시 이후 취소는 불가능합니다.** 에러를 출력합니다.


## 4. 페이지 하단 메뉴
### 1. 업데이트 시간
* 마지막으로 급식표가 새로고침된 시간을 TT hh시 MM분 ss초 형식으로 표시합니다.  

### 2. 공지사항
업데이트 내역 및 공지사항을 표시합니다.
* [Notice]()를 누르면 공지사항 팝업을 표시합니다.
* 버전 업데이트 후 최초 1회 페이지 로드 시 자동으로 공지사항 팝업을 표시합니다.

### 3. 마일리지 지급 기록
특정 회원의 마일리지 지급 기록을 표시합니다.
* [Statistics](https://luftaquila.github.io/ajoumeow/statistics)를 눌러 이동합니다.
* 드롭다운 목록에서 기록을 볼 회원 이름을 선택합니다.
* 드롭다운 목록은 2018년 9월 1일 이후 급식 기록이 있는 회원만 표시됩니다.

### 4. 랭킹
마일리지 순위 1 ~ 3등 및 마일리지 현황을 표시합니다.
* [Rank]()를 눌러 팝업을 표시합니다.
* [마일리지 현황 보기]()를 누르면 마일리지 현황 및 통계를 표시합니다.
* `3일간 보지 않기`를 누르면 3일간 페이지 방문 시 팝업이 표시되지 않습니다.
* 페이지에서 [Rank]()를 눌러 팝업을 띄우면 `3일간 보지 않기` 옵션이 해제됩니다.

### 5. 지도
급식소 위치를 보여주는 지도를 표시합니다.
* [Map]()을 눌러 팝업을 표시합니다.
* 지도에서 급식소 위치(★)를 클릭하면 해당 급식소의 상세 사진이 표시됩니다.

### 6. 프린터
동방 프린터 사용 가이드 페이지로 이동합니다.
* [Printer](https://github.com/luftaquila/ajoumeow/releases)를 눌러 이동합니다.

### 8. 사용설명서
본 사용설명서 페이지로 이동합니다.
* [Manual](https://github.com/luftaquila/ajoumeow)을 눌러 이동합니다.

### 9. About
버전 정보 및 페이지 개발자 정보를 표시합니다.
* [About](https://luftaquila.github.io/ajoumeow/about.html)을 눌러 이동합니다.