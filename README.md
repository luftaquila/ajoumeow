아주대학교 미유미유
=================

아주대학교 고양이동아리 미유미유 급식일정관리 시스템 사용설명서  

개발자 연락처
* [Github](https://github.com/luftaquila)  
* [Facebook](http://www.facebook.com/luftaquila)  
* <luftaquila@protonmail.ch>  

> 본 시스템은 Github Pages를 통해 호스팅되고 있지만, 데이터베이스로 Google Spreadsheet를 사용합니다.  
또한 Google Apps Script 서비스를 DB 수정 및 CORS정책 우회를 위한 프록시 서버로 사용하고 있습니다.  
[데이터베이스 시트](https://docs.google.com/spreadsheets/d/1tubdLyELoYAPi8f3PVeh6jfIbQiQ3au3frIVEbnj20A/edit?usp=sharing) 또는 [스크립트 프로젝트](https://script.google.com/d/1TPa1Y82h5m5IQqZAvVxKipTICYfSxSup2qCbqFhavFd0m50G9TRQymbV/edit) 접근 권한이 필요한 경우 위 연락처로 연락하세요.

## 0. 페이지 최초 방문
페이지를 현재 브라우저에서 처음 방문했을 경우 이름을 묻는 팝업이 출력됩니다.
* 입력한 이름은 신청 시 이름 자동완성에 사용되며 365일간 쿠키로 개별 디바이스에 저장됩니다.
* 쿠키는 이후 신청서 제출시마다 새로 저장되어 마지막으로 신청한 이름을 기억합니다.

## 1. 페이지 상단 고정 메뉴
### 1. 탭 선택
`평일`, `주말`, `급식 신청` 세 개의 탭이 존재합니다.  
* `평일`과 `주말` 탭은 3주간의 급식 일정표를 표시합니다.
* `급식 신청` 탭에서 급식을 신청하거나 이미 신청한 내용을 수정하고 삭제할 수 있습니다.

### 2. 새로고침 아이콘
페이지 로딩 및 새로고침 중 회전하는 새로고침 아이콘입니다. 로딩을 완료하면 정지합니다.
* 클릭하면 급식표 정보를 다시 로드할 수 있습니다.

### 3. 날짜 및 날씨 정보
항상 페이지 상단에 표시되는 아주대학교 날씨정보입니다.
* `날짜`, `날씨 아이콘`, `날씨`, `기온`, `미세먼지 농도`로 구성되어 있습니다.  

* `날짜` 는 해당일의 날짜를 m월 d일 dddd 형식으로 표시합니다. dddd는 해당 요일의 풀네임입니다.  
ex) 5월 12일 수요일

* `맑음`, `구름 조금`, `구름 많음`, `눈`, `비`, `흐림`, `눈/비` 의 7개 날씨 상태와 아이콘이 존재합니다.  
`날씨 아이콘` 및 `날씨`는 페이지를 보는 시점의 날씨가 아닌, 3시간 단위의 **수원시 영통구 원천동** 기상청 예보 데이터입니다.  
ex) 16시 30분에 페이지를 방문하면 표시되는 날씨는 18시 00분 예보 데이터입니다.  

* `기온`은 [OpenWeatherMap](https://openweathermap.org/city/1835553)에서 가져온 수원시 기온을 섭씨 단위로 표시합니다. 매 10분마다 갱신됩니다.

* `미세먼지 농도`는 [에어코리아](https://www.airkorea.or.kr/index)가 제공하는 수원시청 관측소의 PM10과 PM2.5정보를 표시합니다. 매 1시간마다 갱신됩니다.

## 2. 급식 신청, 수정 및 삭제
### 0. 주의사항
* 급식을 하신 분은 반드시 해당일에 신청이 되어 있어야 마일리지 지급이 가능합니다.
* 해당일에 신청이 되어 있어도 급식 인증에 이름이 없으면 마일리지가 지급되지 않습니다.  

* **모든 신청, 수정, 삭제 내역은 데이터베이스에 기록됩니다.**
* 내용 전송 후 자동으로 급식표가 새로고침됩니다.

### 1. 신청
`이름`, `날짜`, `코스`를 입력하여 신청합니다.
1. `이름`은 최초 방문시 입력한 이름으로 자동완성되지만, 필요 시 수정할 수 있습니다.
    * 이름을 수정한 후 신청서를 제출하면 다음부터는 수정한 이름으로 자동완성됩니다.
1. `날짜` 입력 필드를 클릭하면 달력이 표시됩니다. 원하는 날짜를 클릭하면 선택됩니다.
1. `코스` 중 하나를 선택합니다.
1. `신청하기` 버튼을 눌러 입력한 내용을 전송합니다.

### 2. 수정
이미 제출한 신청 내용을 수정합니다.
1. 수정을 원하는 신청 내용을 화살표(↓) 위쪽 필드에 입력합니다.
2. 변경할 내용을 화살표 아래 필드에 입력합니다.
3. `수정하기` 버튼을 눌러 입력한 내용을 전송합니다.

### 3. 삭제
이미 제출한 신청 내용을 삭제합니다.
1. 삭제할 신청 내용을 필드에 입력합니다.
2. `삭제하기` 버튼을 눌러 입력한 내용을 전송합니다.

### + 입력 필터링 조건
입력한 내용이 필터링 조건을 충족하지 않으면 경고창을 출력하며 입력한 내용이 전송되지 않습니다.

1. 날짜 미입력
    * `신청`, `수정`, `삭제` 메뉴에서 날짜를 선택하지 않으면 **날짜를 입력하세요.** 에러를 출력합니다.
    * `수정` 메뉴에서 화살표 아래 필드의 날짜를 선택하지 않으면 **수정할 날짜를 입력하세요.** 에러를 출력합니다.  
    
2. 이름 미입력
    * 이름 입력 필드가 비어 있거나 공백만 존재할 경우 **이름을 입력하세요.** 에러를 출력합니다.
    
3. 이름에 금지된 문자 사용  
콤마(,)는 이름 입력 필드에 사용할 수 없습니다.
    * 콤마 입력 시 **이름에 콤마(,)는 사용할 수 없습니다.** 에러를 출력합니다.
    
4. 코스 미입력
    * `신청`, `수정`, `삭제` 메뉴에서 코스를 선택하지 않으면 **코스를 입력하세요.** 에러를 출력합니다.
    * `수정` 메뉴에서 화살표 아래 필드의 코스를 선택하지 않으면 **수정할 코스를 입력하세요.** 에러를 출력합니다.  
    
5. 당일 및 과거에 대한 내용 삭제 시도  
갑작스런 취소로 인한 급식 동행자의 불편을 막기 위해 급식 당일에 신청 내용의 삭제는 불가합니다.
    * 과거 신청 기록에 대한 삭제 시도도 거부됩니다.
    * 시도 시 **당일 및 지난 날짜에 대한 삭제는 불가능합니다.** 에러를 출력합니다.

6. 당일 날짜 변경 시도  
조건 5와 동일한 이유로 급식 당일에 다른 날짜로의 수정은 불가능합니다.
    * 시도 시 **당일 날짜 변경은 불가능합니다.** 에러를 출력합니다.

7. 전일 오후 6시 이후 취소 혹은 수정 시도  
조건 5와 동일한 이유로 급식 전날 6시 이후 취소나 수정은 불가능합니다.
    * 시도 시 **전일 오후 6시 이후 취소 혹은 수정은 불가능합니다.** 에러를 출력합니다.

8. 과거 내용 수정 시도  
과거 급식 내용의 수정은 불가능합니다.
    * 시도 시 **지난 날짜에 대한 수정은 불가능합니다.** 에러를 출력합니다.

9. 급식표 표시 범위 밖으로의 신청 시도  
급식 기회의 공정한 배분을 위해 급식표에 표시되지 않는 날짜의 선점은 불가능합니다.
    * 시도 시 **신청 및 수정은 급식표 표시 범위 내에서만 가능합니다.** 에러를 출합니다.

## 3. 페이지 하단 고정 메뉴
### 1. 업데이트 시간
* 마지막으로 급식표가 새로고침된 시간을 TT hh시 MM분 ss초 형식으로 표시합니다.  

### 2. 공지사항
업데이트 내역 및 공지사항을 표시합니다.
* [Notice]()를 누르면 공지사항 팝업을 표시합니다.
* 버전 업데이트 후 페이지 로드 시 최초 1회 공지사항 팝업을 표시합니다.

### 3. 마일리지 지급 기록
특정 회원의 마일리지 지급 기록을 표시합니다.
* [Statistics]()를 눌러 이동합니다.
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

### 6. 이전 급식 기록
지나간 기간의 급식표를 월별로 출력합니다.
* [History]()를 눌러 이동합니다.
* 연 / 월을 선택합니다.

### 7. About
버전 정보 및 페이지 개발자 정보를 표시합니다.
* [About]()을 눌러 이동합니다.

### 8. 구글 스프레드시트 데이터베이스
데이터베이스로 사용하는 구글 스프레드시트로 이동합니다.  
`Record`, `Receiver`, `Edit Log`, `Statistics`, `NameList` 시트가 존재합니다.
* `Record` 시트는 급식 신청 내역을 기록하는 시트입니다.
* `Receiver` 시트는 마일리지 인증 내역을 기록하는 시트입니다.
* `Edit Log` 시트는 수정 및 삭제 내역을 기록하는 시트입니다.
* `Statistics` 시트는 마일리지 합산 통계를 표시하는 시트입니다.
  * 모든 마일리지 계산은 자동으로 수행됩니다.
    + **시트의 S ~ BN열은 자동 계산에 사용되는 데이터로, 숨김 처리되어 있습니다.**  
    숨김 처리된 열의 어떠한 셀이라도 수정해서는 안 되며, 숨김 처리를 해제하지 마십시오.

  * **G ~ H** 열 *이번 학기 전체 합산* 은 이번 학기에 지급한 모든 마일리지의 총합입니다.
    + 봉사활동 등으로 별도 수동 지급한 마일리지도 합산합니다.

  * **J ~ K** 열 *이번 학기 급식 총합* 은 이번 학기에 급식 활동으로 지급한 마일리지의 총합입니다.
    + 모든 수동 지급 내역은 합산하지 않습니다.

  * 학기 기간은 수동으로 세팅해야 합니다.
    + **I1** 셀에서 이번 학기 시작일을 선택합니다. 셀을 선택하면 달력이 표시됩니다.
    + **I2** 셀에서 이번 학기 종료일을 선택합니다.
    + **O1** 셀에서 저번 학기 시작일을 선택합니다.
    + **O2** 셀에서 저번 학기 종료일을 선택합니다.
    
* `NameList` 시트는 회원 목록을 표시합니다.

### 9. 급식인증기
마일리지를 지급하는 관리자 전용 페이지입니다.
#### 1. 표준 입력
1. [Calc]()을 눌러 이동합니다.
1. 데이터 로딩이 완료되면 관리자 비밀번호를 입력합니다.
1. 날짜 선택 필드에서 날짜를 선택하면 해당일의 신청자가 모두 표시됩니다.
1. **급식 인증에 이름이 있는 회원만** 체크박스가 선택된 상태로 둔 후, `Confirm` 버튼을 눌러 전송합니다.

    * [Mileage Log]() 버튼은 스프레드시트의 `Receiver` 시트를 표시합니다.
    * [Receiver Log]() 버튼은 스프레드시트의 `Record` 시트를 표시합니다.
    * [Reload]() 버튼은 신청자 정보를 다시 로드합니다.
    * [Home]() 버튼을 누르면 신청 페이지로 이동합니다.
    * *마지막 인증 날짜* 는 `Receiver` 시트의 마지막 셀의 날짜를 표시합니다.

#### 2. 수동 입력
동아리박람회, 봉사활동 등 별도 마일리지 지급이 필요할 때 사용하는 수동 지급 메뉴입니다.
1. [Calc]()을 눌러 이동합니다.
1. 데이터 로딩이 완료되면 관리자 비밀번호를 입력합니다.
1. `수동 입력` 버튼을 클릭합니다.
1. 날짜 입력 필드에서 지급  날짜(활동일자)를 선택합니다.
1. 이름과 지급할 점수를 입력하고 `Confirm` 버튼을 눌러 전송합니다.
