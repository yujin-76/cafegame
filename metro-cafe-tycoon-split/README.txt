Metro Cafe Tycoon — 분리형 프로젝트
===================================

실행
- 폴더 전체를 압축 해제합니다.
- VS Code에서 폴더를 엽니다.
- Live Server로 index.html을 실행합니다. (file:// 직접 실행은 Firebase/ES module 제한으로 권장하지 않습니다.)

파일 구성
- index.html: 게임 화면과 모달 마크업
- css/style.css: 사용자 정의 스타일
- js/src/00_bootstrap_and_data.js: Firebase 초기화, 데이터, 게임 상태
- js/src/01_audio.js: 배경음과 날씨 사운드
- js/src/02_customers.js: 손님 생성/이동/주문/퇴장
- js/src/03_simulation_and_hud.js: 시간/날씨/경제 연결/HUD
- js/src/04_shop_and_phone_ui.js: POS, 스마트폰, 홍보 UI
- js/src/05_metro_map.js: 수도권 지도와 지점/건물 관리
- js/src/06_accounts_and_cloud.js: 계정, Firebase 저장/불러오기, 랭킹
- js/src/07_effects_and_game_loop.js: 알림, 자동 저장, 메인 루프, onclick 호환
- js/economy.js: 경제 기능 모듈
- js/graphics.js: 카페 캔버스 렌더링 모듈
- js/game.js: 실행용으로 생성된 단일 ES 모듈 번들

소스 수정 방법
1. 기능별 js/src 파일을 수정합니다.
2. 프로젝트 최상위 폴더에서 `python build.py`를 실행합니다.
3. 생성된 js/game.js를 포함해 배포합니다.

중요한 호환성 메모
- 기존 Firebase 컬렉션/문서 구조와 저장 데이터 필드는 변경하지 않았습니다.
- 기존 HTML의 onclick 핸들러가 작동하도록 모든 기능 소스를 기존 순서대로 하나의 ES 모듈로 빌드합니다.
- 따라서 기능별 파일은 개발용 원본이며, 직접 index.html에서 각각 script로 불러오면 안 됩니다. 반드시 build.py로 묶어야 합니다.
- Firebase 연결 설정과 게임 규칙은 기존 버전 그대로 유지했습니다.

검증
- 빌드 결과의 JavaScript 구문 검사를 수행했습니다.
- 실제 Firebase 계정 로그인/클라우드 동기화는 배포 환경에서 별도 확인이 필요합니다.
