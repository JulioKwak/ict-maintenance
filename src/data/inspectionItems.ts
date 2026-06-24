// 설비 ID별 점검항목 데이터 (ICT_점검항목_정리.md 기반)

export interface InspectionItemTemplate {
  subCategory: string // 외관 | 기능 | 안전
  range: string // 공용 | 전유 | -
  content: string
}

export type InspectionItemMap = Record<string, { functional: InspectionItemTemplate[]; performance: InspectionItemTemplate[] }>

export const INSPECTION_ITEMS: InspectionItemMap = {
  // 케이블설비
  'comm-01': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '외관', range: '-', content: '배관·트레이 노출 상태 확인' },
      { subCategory: '외관', range: '-', content: '케이블 정리 상태 확인' },
      { subCategory: '외관', range: '-', content: '케이블 결선 및 접속 상태 확인' },
      { subCategory: '외관', range: '-', content: '광케이블 곡률반경 준수 및 꺾임 유무 확인' },
      { subCategory: '외관', range: '-', content: '동축케이블 꼬임등에 의한 케이블 변형 여부 확인' },
      { subCategory: '안전', range: '-', content: '전력선과의 이격거리 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: '통과 지점 광케이블 스파이럴 슬리브 보호 여부 확인' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
  // 배관설비
  'comm-02': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '외관', range: '-', content: '볼트 및 너트 등 체결 상태 확인' },
      { subCategory: '외관', range: '-', content: '배관 및 트레이 상태(수평, 수직 등) 확인' },
      { subCategory: '외관', range: '-', content: '내화 충전재 적정 여부 확인(트레이,배관 등)' },
      { subCategory: '안전', range: '-', content: '트레이 접지 상태 확인' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: '케이블 수용 여유 공간 확인' },
      { subCategory: '-', range: '-', content: '배관 및 트레이 상태(수평, 수직 등) 확인' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
  // 국선인입설비
  'comm-03': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '외관', range: '-', content: '맨홀 내 시설물 고정 상태 확인' },
      { subCategory: '외관', range: '-', content: '맨홀 뚜껑의 결합 상태 및 파손유무 확인' },
      { subCategory: '안전', range: '-', content: '맨홀 내 사다리 거치 상태 확인' },
      { subCategory: '안전', range: '-', content: '맨홀·수공 양수 상태 확인' },
      { subCategory: '안전', range: '-', content: '맨홀 내 가스 발생 유무 및 산소도 측정' },
      { subCategory: '안전', range: '-', content: '설비 설치 공간의 조명설비 동작 여부 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: '맨홀 내 시설물 고정 상태 확인' },
      { subCategory: '-', range: '-', content: '맨홀 뚜껑의 결합 상태 및 파손유무 확인' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
  // 단자함설비
  'comm-04': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '외관', range: '-', content: '케이블 연결 상태 확인' },
      { subCategory: '외관', range: '-', content: '케이블 정리 상태 확인' },
      { subCategory: '외관', range: '-', content: '단자함 내 기구 및 기기 고정 상태 확인' },
      { subCategory: '외관', range: '-', content: '선번장 부착 여부 및 상태 확인' },
      { subCategory: '외관', range: '-', content: '케이블 명찰 부착 여부 및 상태 확인' },
      { subCategory: '안전', range: '-', content: '잠금 장치 상태 확인' },
      { subCategory: '안전', range: '-', content: '접지 상태 확인' },
      { subCategory: '안전', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '재해(벼락, 침수, 강우, 분진 등) 보호 환경 확인' },
      { subCategory: '안전', range: '-', content: '습도 및 온도 조절을 위한 환기 상태 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
      { subCategory: '안전', range: '-', content: '설비 설치 공간의 조명설비 동작 여부 확인' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등) 및 확인' },
      { subCategory: '-', range: '-', content: '잠금 장치 상태 확인' },
      { subCategory: '-', range: '-', content: '단자함 내 기구 및 기기 고정 상태 확인' },
      { subCategory: '-', range: '-', content: '케이블 연결 및 정리 상태 확인' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
  // 이동통신구내선로설비
  'comm-05': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '외관', range: '-', content: '고정 및 취부 상태 확인' },
      { subCategory: '안전', range: '-', content: '설치 환경 확인(먼지, 습도, 온도 등)' },
      { subCategory: '안전', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
      { subCategory: '안전', range: '-', content: '설비 설치 공간의 조명설비 동작 여부 확인' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: '접속함 내 기구 및 기기 고정 상태 확인' },
      { subCategory: '-', range: '-', content: '잠금 장치 상태 확인' },
      { subCategory: '-', range: '-', content: '배관 예비공 가용 여부 확인' },
      { subCategory: '-', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '-', range: '-', content: '예비전원(UPS 또는 발전기) 배선 및 연결 상태 확인' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
  // 전화설비
  'comm-06': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '외관', range: '-', content: '기기 연결 케이블 및 커넥터 상태 확인' },
      { subCategory: '외관', range: '-', content: '고정 및 취부 상태 확인' },
      { subCategory: '외관', range: '-', content: '작동 표시부 확인(LCD, LED 등)' },
      { subCategory: '기능', range: '-', content: '송수신 통화 시 적정 음량 확인' },
      { subCategory: '기능', range: '-', content: '마이크 동작 상태 확인' },
      { subCategory: '기능', range: '-', content: '통화 수신 시 알람 여부 확인' },
      { subCategory: '기능', range: '-', content: '통화 연결 및 품질 확인' },
      { subCategory: '안전', range: '-', content: '설치 환경 확인(먼지, 습도, 온도 등)' },
      { subCategory: '안전', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '이상 발열 및 소음 상태 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
      { subCategory: '안전', range: '-', content: '설비 설치 공간의 조명설비 동작 여부 확인' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: '통화 연결 및 품질 확인' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
      { subCategory: '-', range: '-', content: 'AC 및 DC 입력 전원 측정' },
    ],
  },
  // 방송 공동수신 안테나 시설
  'comm-07': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '외관', range: '-', content: '안테나 수직, 수평 확인' },
      { subCategory: '외관', range: '-', content: '고정 및 취부 상태 확인' },
      { subCategory: '외관', range: '-', content: '케이블 및 커넥터 연결 상태 확인' },
      { subCategory: '외관', range: '-', content: '작동 표시부 확인(LCD, LED 등)' },
      { subCategory: '기능', range: '-', content: '채널별 지상파 방송 수신 가능 여부 확인' },
      { subCategory: '기능', range: '-', content: '채널별 지상파 방송 수신 상태 및 품질(육안) 확인' },
      { subCategory: '기능', range: '-', content: '지하층 DMB, FM 수신 가능 여부 확인' },
      { subCategory: '기능', range: '-', content: '주전원 차단 시 예비전원장치 작동 유무 확인' },
      { subCategory: '기능', range: '-', content: '장치함 시건장치 정상 동작 확인' },
      { subCategory: '안전', range: '-', content: '안테나와 주변 피뢰침과의 거리 확인(1미터 이상)' },
      { subCategory: '안전', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '이상 발열 및 소음 상태 확인' },
      { subCategory: '안전', range: '-', content: '예비전원(UPS 또는 발전기) 배선 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
      { subCategory: '안전', range: '-', content: '설비 설치 공간의 항온·항습장치 동작상태 확인' },
      { subCategory: '안전', range: '-', content: '설비 설치 공간의 조명설비 동작 여부 확인' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: '출력 검사 단자의 레벨값 확인' },
      { subCategory: '-', range: '-', content: '지하 DMB, FM 수신 상태 확인' },
      { subCategory: '-', range: '-', content: '증폭기·분배기 간의 공간 확보 및 신호 간섭 확인' },
      { subCategory: '-', range: '-', content: '누설동축케이블 전계강도 측정(무선방식인 경우)' },
      { subCategory: '-', range: '-', content: '전파환경(RSRP) 측정' },
      { subCategory: '-', range: '-', content: '유휴 분배 및 분기 단자 종단저항 측정(75Ω) 확인' },
      { subCategory: '-', range: '-', content: '기기 입·출력 신호 레벨 측정' },
      { subCategory: '-', range: '-', content: '광 송·수신 레벨 측정' },
      { subCategory: '-', range: '-', content: '예비전원(UPS 또는 발전기) 배선 및 연결 상태 확인' },
      { subCategory: '-', range: '-', content: 'AC 및 DC 입력 전원 측정' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
  // 종합유선방송 구내전송선로설비
  'comm-08': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '외관', range: '-', content: '기기와 연결된 케이블 및 커넥터 상태 확인' },
      { subCategory: '외관', range: '-', content: '고정 및 취부 상태 확인' },
      { subCategory: '외관', range: '-', content: '작동 표시부 확인(LCD, LED 등)' },
      { subCategory: '기능', range: '-', content: '종합유선방송 수신 가능 여부 확인' },
      { subCategory: '기능', range: '-', content: '종합유선방송 수신 상태 및 품질 확인' },
      { subCategory: '기능', range: '-', content: '냉각팬 동작상태 확인' },
      { subCategory: '안전', range: '-', content: '설치 환경 확인(먼지, 습도, 온도 등)' },
      { subCategory: '안전', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '이상 발열 및 소음 상태 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
      { subCategory: '안전', range: '-', content: '설비 설치 공간의 항온·항습장치 동작상태 확인' },
      { subCategory: '안전', range: '-', content: '설비 설치 공간의 조명설비 동작 여부 확인' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: '출력 검사 단자의 레벨값 확인' },
      { subCategory: '-', range: '-', content: '기기 입·출력 신호 레벨 측정' },
      { subCategory: '-', range: '-', content: 'AC 및 DC 입력 전원 측정' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
  // 방송음향설비
  'broad-01': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '외관', range: '-', content: '고정 및 취부 상태 확인' },
      { subCategory: '외관', range: '-', content: '작동 표시부 확인(LCD, LED 등)' },
      { subCategory: '기능', range: '-', content: '음향 정상 송출 및 출력 여부 확인' },
      { subCategory: '기능', range: '-', content: '스피커 음량 및 음질 확인' },
      { subCategory: '기능', range: '-', content: '마이크 정상 동작 확인' },
      { subCategory: '기능', range: '-', content: '비상 방송설비 연동 상태 유무 및 작동 여부 확인' },
      { subCategory: '기능', range: '-', content: '자동안내방송시스템 동작상태 확인' },
      { subCategory: '안전', range: '-', content: '설치 환경 확인(먼지, 습도, 온도 등)' },
      { subCategory: '안전', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '이상 발열 및 소음 상태 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
      { subCategory: '안전', range: '-', content: '설비 설치 공간의 항온·항습장치 동작상태 확인' },
      { subCategory: '안전', range: '-', content: '설비 설치 공간의 조명설비 동작 여부 확인' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: '방송 송출 및 출력 시 노이즈 발생, 방송 품질 확인' },
      { subCategory: '-', range: '-', content: '출력 음향의 음량의 적정성 확인' },
      { subCategory: '-', range: '-', content: '비상방송설비 연동 상태 유무 및 작동 여부 확인' },
      { subCategory: '-', range: '-', content: '예비전원(UPS 또는 발전기) 배선 및 연결 상태 확인' },
      { subCategory: '-', range: '-', content: 'AC 및 DC 입력 전원 측정' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
  // 네트워크설비
  'info-01': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '외관', range: '-', content: '기기 연결 케이블 및 커넥터 상태 확인' },
      { subCategory: '외관', range: '-', content: '고정 및 취부 상태 확인' },
      { subCategory: '외관', range: '-', content: '작동 표시부 확인(LCD, LED 등)' },
      { subCategory: '외관', range: '-', content: 'FDF 내 광케이블 꼬임, 꺾임 등 장애요인 확인' },
      { subCategory: '기능', range: '-', content: '서버 고유 기능 정상 동작 및 모니터링 상태 확인' },
      { subCategory: '기능', range: '-', content: '링크 동작 속도 확인' },
      { subCategory: '기능', range: '-', content: '전면 및 후면 도어 시건장치 정상 동작 확인' },
      { subCategory: '기능', range: '-', content: '내부 환기 계통 점검(FAN 등)' },
      { subCategory: '안전', range: '-', content: '설치 환경 확인(먼지, 습도, 온도 등)' },
      { subCategory: '안전', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '이상 발열 및 소음 상태 확인' },
      { subCategory: '안전', range: '-', content: '예비전원(UPS 또는 발전기) 배선 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
      { subCategory: '안전', range: '-', content: '설비 설치 공간의 항온·항습장치 동작상태 확인' },
      { subCategory: '안전', range: '-', content: '설비 설치 공간의 조명설비 동작 여부 확인' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: 'VLAN, VPN 등 보안 기능 사용 시 설정 확인' },
      { subCategory: '-', range: '-', content: '광 송·수신 레벨 확인' },
      { subCategory: '-', range: '-', content: '사용자 인증(비밀번호) 설정 여부 확인' },
      { subCategory: '-', range: '-', content: '최신 보안 패치 설치 여부 확인' },
      { subCategory: '-', range: '-', content: '최신 펌웨어 설치 여부 확인' },
      { subCategory: '-', range: '-', content: '백신 설치 여부 및 정상작동 상태 확인' },
      { subCategory: '-', range: '-', content: '바이러스 및 악성코드 경고 이벤트 확인' },
      { subCategory: '-', range: '-', content: 'AC 및 DC 입력 전원 측정' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
  // 전자출입(통제)시스템
  'info-02': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '외관', range: '-', content: '기기 연결 케이블 및 커넥터 상태 확인' },
      { subCategory: '외관', range: '-', content: '고정 및 취부 상태 확인' },
      { subCategory: '외관', range: '-', content: '작동 표시부 확인(LCD, LED 등)' },
      { subCategory: '기능', range: '-', content: '출입통제 관련 기능의 정상 동작(모니터링, 제어 등) 여부 확인' },
      { subCategory: '기능', range: '-', content: 'RFID TAG를 통한 도어 열림 확인' },
      { subCategory: '기능', range: '-', content: '호출버튼을 통한 도어 열림 확인' },
      { subCategory: '기능', range: '-', content: '현관제어기와 연결된 기기와 음성 또는 영상 통화 가능 여부 확인' },
      { subCategory: '기능', range: '-', content: '현관제어기와 연결된 기기에서 출입문 제어 가능 여부 확인' },
      { subCategory: '기능', range: '-', content: '출입관리 모니터링 시스템 기록 정보의 실시간 반영 여부 확인' },
      { subCategory: '기능', range: '-', content: '전면 및 후면 도어 시건장치 정상 동작 확인' },
      { subCategory: '기능', range: '-', content: '휴대전화 어플리케이션을 통한 도어 열림 기능 작동(기능이 탑재된 경우)' },
      { subCategory: '안전', range: '-', content: '설치 환경 확인(먼지, 습도, 온도 등)' },
      { subCategory: '안전', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '이상 발열 및 소음 상태 확인' },
      { subCategory: '안전', range: '-', content: '예비전원(UPS 또는 발전기) 배선 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: 'VLAN, VPN 등 보안 기능 사용 시 설정 확인' },
      { subCategory: '-', range: '-', content: '일정 시간 이후 자동 닫힘 및 잠금 기능 확인' },
      { subCategory: '-', range: '-', content: '수동 조작 스위치 정상 동작 여부 확인' },
      { subCategory: '-', range: '-', content: 'RF카드 자기장 세기 측정' },
      { subCategory: '-', range: '-', content: 'RF카드 인식거리 측정' },
      { subCategory: '-', range: '-', content: '사용자 인증(비밀번호) 설정 여부 확인' },
      { subCategory: '-', range: '-', content: '최신 보안 패치 설치 여부 확인' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
  // 원격검침시스템
  'info-03': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '외관', range: '-', content: '기기 연결 케이블 및 커넥터 상태 확인' },
      { subCategory: '외관', range: '-', content: '고정 및 취부 상태 확인' },
      { subCategory: '외관', range: '-', content: '작동 표시부 확인(LCD, LED 등)' },
      { subCategory: '기능', range: '-', content: '원격검침 관련 기능의 정상 동작(모니터링, 제어 등) 여부 확인' },
      { subCategory: '기능', range: '-', content: '검침기기별 실시간 사용량 확인 가능 여부 확인' },
      { subCategory: '기능', range: '-', content: '검침기기와 서버 데이터의 정상 연동 여부 확인' },
      { subCategory: '기능', range: '-', content: '냉각팬 동작상태 확인' },
      { subCategory: '안전', range: '-', content: '설치 환경 확인(먼지, 습도, 온도 등)' },
      { subCategory: '안전', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '이상 발열 및 소음 상태 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: '누설동축케이블 전계강도 측정' },
      { subCategory: '-', range: '-', content: '사용자 인증(비밀번호) 설정 여부 확인' },
      { subCategory: '-', range: '-', content: '최신 보안 패치 설치 여부 확인' },
      { subCategory: '-', range: '-', content: 'AC 및 DC 입력 전원 측정' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
  // 주차관제시스템
  'info-04': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '외관', range: '-', content: '기기 연결 케이블 및 커넥터 상태 확인' },
      { subCategory: '외관', range: '-', content: '고정 및 취부 상태 확인' },
      { subCategory: '외관', range: '-', content: '작동 표시부 확인(LCD, LED 등)' },
      { subCategory: '외관', range: '-', content: '카메라부 렌즈 오염 및 파손 상태 확인' },
      { subCategory: '기능', range: '-', content: '주차관제 관련 기능의 정상 동작(모니터링, 제어 등) 여부 확인' },
      { subCategory: '기능', range: '-', content: '차량 감지 및 주차 차단기 개폐 정상 작동 상태 확인' },
      { subCategory: '기능', range: '-', content: '수동 개폐 기능 정상 작동 확인' },
      { subCategory: '기능', range: '-', content: '기기에서 지원하는 결제 수단별 요금 정산 정상 동작 여부 확인' },
      { subCategory: '기능', range: '-', content: '차량번호, 요금 등 내용의 정상 표출 여부 확인' },
      { subCategory: '기능', range: '-', content: '냉각팬 동작상태 확인' },
      { subCategory: '안전', range: '-', content: '설치 환경 확인(먼지, 습도, 온도 등)' },
      { subCategory: '안전', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '이상 발열 및 소음 상태 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: '주간 및 야간 차량번호 인식 여부 확인' },
      { subCategory: '-', range: '-', content: '차량 출입의 실시간 감지 및 신호 송·수신 확인' },
      { subCategory: '-', range: '-', content: '사용자 인증(비밀번호) 설정 여부 확인' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
  // 주차유도시스템
  'info-05': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '외관', range: '-', content: '고정 및 취부 상태 확인' },
      { subCategory: '기능', range: '-', content: '주차유도 관련 기능의 정상 동작(모니터링, 제어 등) 여부 확인' },
      { subCategory: '기능', range: '-', content: '주차 공간 유무에 따른 발광소자(LED 등) 동작 확인' },
      { subCategory: '기능', range: '-', content: '주차 유도 안내판 및 유도등 정상 동작 여부 확인' },
      { subCategory: '안전', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: '차량 위치 정보의 저장 및 기록 상태 확인' },
      { subCategory: '-', range: '-', content: '주차 공간 유무에 따른 발광소자(LED 등) 동작 확인' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
  // 무인택배시스템
  'info-06': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '외관', range: '-', content: '기기 연결 케이블 및 커넥터 상태 확인' },
      { subCategory: '기능', range: '-', content: '무인택배 관련 기능의 정상 동작(모니터링, 제어 등) 여부 확인' },
      { subCategory: '기능', range: '-', content: '택배함 인출 및 잠금 기능 정상 동작 확인' },
      { subCategory: '기능', range: '-', content: '디스플레이 정보, 선명도, 밝기 등 이용 환경 확인' },
      { subCategory: '기능', range: '-', content: '물리적 또는 논리적 버튼 정상 동작 여부 확인(키패드 등)' },
      { subCategory: '안전', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: '시스템 사용자 권한 확인' },
      { subCategory: '-', range: '-', content: '중앙 시스템과의 실시간 통신 연결 상태 확인' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
  // 비상벨설비
  'info-07': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '외관', range: '-', content: '고정 및 취부 상태 확인' },
      { subCategory: '기능', range: '-', content: '동작 상태별 발광소자(LED 등) 점등 상태 확인' },
      { subCategory: '기능', range: '-', content: '비상벨 작동 시 통화 연결 및 품질 확인' },
      { subCategory: '기능', range: '-', content: '비상벨 작동 시 연계된 부가 기능 정상 동작 여부 확인' },
      { subCategory: '안전', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: '작동 시 관제소와의 통화 연결 및 품질 상태 확인' },
      { subCategory: '-', range: '-', content: '무선 신호 수신 감도 측정' },
      { subCategory: '-', range: '-', content: 'AC 및 DC 입력 전원 측정' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
  // 영상정보처리기기 시스템
  'info-08': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '외관', range: '-', content: '기기와 연결된 케이블 및 커넥터 상태 확인' },
      { subCategory: '외관', range: '-', content: '고정 및 취부 상태 확인' },
      { subCategory: '기능', range: '-', content: '실시간 동영상 촬영 및 저장 상태 확인' },
      { subCategory: '기능', range: '-', content: '녹화 영상 재생 및 품질 확인' },
      { subCategory: '기능', range: '-', content: '하드디스크 저장 공간 확인 및 정리' },
      { subCategory: '기능', range: '-', content: '냉각팬 동작상태 확인' },
      { subCategory: '안전', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: '실시간 동영상 촬영 및 저장 상태 확인' },
      { subCategory: '-', range: '-', content: '녹화 영상 재생 및 품질 확인' },
      { subCategory: '-', range: '-', content: '사용자 인증(비밀번호) 설정 여부 확인' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
  // 홈네트워크 설비
  'info-09': {
    functional: [
      { subCategory: '외관', range: '공용', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '외관', range: '공용', content: '기기 연결 케이블 및 커넥터 상태 확인' },
      { subCategory: '외관', range: '전유', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '기능', range: '공용', content: '랙(함체) 내부 환기 계통 점검(FAN 등)' },
      { subCategory: '기능', range: '공용', content: '네트워크 연동상태 확인' },
      { subCategory: '기능', range: '전유', content: '홈네트워크 단말기기 원격제어 정상 작동 여부 확인' },
      { subCategory: '안전', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
    ],
    performance: [
      { subCategory: '-', range: '공용', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '공용', content: 'VLAN, VPN 등 보안 기능 사용 시 설정 확인' },
      { subCategory: '-', range: '공용', content: '접지저항 측정' },
      { subCategory: '-', range: '전유', content: '홈네트워크 단말기기 원격제어 정상 작동 여부 확인' },
    ],
  },
  // 빌딩안내시스템
  'info-10': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '기능', range: '-', content: 'BIS 관련 기능의 정상 동작(모니터링, 제어 등) 여부 확인' },
      { subCategory: '기능', range: '-', content: '표출 정보에 대한 영상 및 음향 상태 확인' },
      { subCategory: '기능', range: '-', content: '냉각팬 동작상태 확인' },
      { subCategory: '안전', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: '제어기기와의 데이터 연동 및 정확도 확인' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
  // 전기시계시스템
  'info-11': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '기능', range: '-', content: '시스템 관련 기능의 정상 동작(모니터링, 제어 등) 여부 확인' },
      { subCategory: '기능', range: '-', content: '위성 신호 포착 및 동기, 시각 데이터 검출 기능 확인' },
      { subCategory: '기능', range: '-', content: '표준시간 수신 상태 확인' },
      { subCategory: '안전', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: '모시계∼자시계 각 회선별 송출 및 도착 전압 측정' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
  // 통합 SI시스템
  'info-12': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '기능', range: '-', content: '시스템 관련 기능의 정상 동작(모니터링, 제어 등) 여부 확인' },
      { subCategory: '기능', range: '-', content: '냉각팬 동작상태 확인' },
      { subCategory: '기능', range: '-', content: '저장공간 여유 확인' },
      { subCategory: '안전', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: '사용자 인증(비밀번호) 설정 여부 확인' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
  // 시설관리시스템
  'info-13': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '기능', range: '-', content: '시스템 관련 기능의 정상 동작(모니터링, 제어 등) 여부 확인' },
      { subCategory: '기능', range: '-', content: '냉각팬 동작상태 확인' },
      { subCategory: '안전', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: 'RF카드 자기장 세기 측정' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
  // 건물에너지관리시스템
  'info-14': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '기능', range: '-', content: '시스템 관련 기능의 정상 동작(모니터링, 제어 등) 여부 확인' },
      { subCategory: '기능', range: '-', content: '냉각팬 동작상태 확인' },
      { subCategory: '기능', range: '-', content: '저장공간 여유 확인' },
      { subCategory: '안전', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: '예비전원(UPS 또는 발전기) 배선 및 연결 상태 확인' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
  // 지능형 인원계수 시스템
  'info-15': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '기능', range: '-', content: 'CCTV 움직임 감지 및 동작 상태 확인' },
      { subCategory: '기능', range: '-', content: '실시간 동영상 촬영 및 저장 상태 확인' },
      { subCategory: '기능', range: '-', content: '하드디스크 저장 공간 확인 및 정리' },
      { subCategory: '안전', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: '센서 감도 및 감지 범위 점검' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
  // 지능형 경계 감시 시스템
  'info-16': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '기능', range: '-', content: '경계감시 관련 기능의 정상 동작(모니터링, 제어 등) 여부 확인' },
      { subCategory: '기능', range: '-', content: '구역별 센서 동작 및 감지 이벤트 발생 확인' },
      { subCategory: '기능', range: '-', content: '실시간 동영상 촬영 및 저장 상태 확인' },
      { subCategory: '안전', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: '실시간 경보 및 알림 작동 확인' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
  // 스마트 병원 설비
  'info-17': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '기능', range: '-', content: '호출기 버튼 정상 눌림 및 복원 여부 확인' },
      { subCategory: '기능', range: '-', content: '통화 연결 및 품질 상태 확인' },
      { subCategory: '기능', range: '-', content: '주수신기와 호출 병실 간 데이터 연동 여부 확인' },
      { subCategory: '기능', range: '-', content: '호출 시 복도등 연동 여부 확인' },
      { subCategory: '안전', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: '호출기 버튼 정상 눌림 및 복원 여부 확인' },
      { subCategory: '-', range: '-', content: '통화 연결 및 품질 상태 확인' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
  // 스마트 도난방지 시스템
  'info-18': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '기능', range: '-', content: '도난 감지 장치의 태그 인식 여부 확인' },
      { subCategory: '기능', range: '-', content: '경보기 작동 여부 확인(태그 인식 시)' },
      { subCategory: '안전', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: '도난 감지 장치의 태그 인식 여부 확인' },
      { subCategory: '-', range: '-', content: '경보기 작동 여부 확인(태그 인식 시)' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
  // 스마트 공장 시스템
  'info-19': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '기능', range: '-', content: '모니터링 디스플레이 장치 정상 동작 여부 확인' },
      { subCategory: '기능', range: '-', content: '환경정보 값 실시간 송·수신 여부 확인' },
      { subCategory: '기능', range: '-', content: '구성 설비 데이터 수집 및 제어 여부 확인' },
      { subCategory: '안전', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: 'SCADA 관련 설비의 모니터링 및 제어 정상 동작 여부 확인' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
  // 스마트 도서관 시스템
  'info-20': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '기능', range: '-', content: '도서 출납 기능 확인' },
      { subCategory: '기능', range: '-', content: '보관 도서에 대한 검색 기능 여부 확인' },
      { subCategory: '기능', range: '-', content: 'UV 살균 시스템 작동 여부 확인' },
      { subCategory: '기능', range: '-', content: '네트워크 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: '터치 감도 및 응답 속도 확인' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
  // 지능형 이상음원 시스템
  'info-21': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '기능', range: '-', content: '비상벨 버튼 정상 동작 여부 확인' },
      { subCategory: '기능', range: '-', content: '영상 및 음향 상태 확인' },
      { subCategory: '기능', range: '-', content: '음원 감지 녹음 기능 작동여부 확인' },
      { subCategory: '기능', range: '-', content: '이벤트 발생시 스피커 알람 경고방송 정상송출 확인' },
      { subCategory: '안전', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: '이상 음원 감지 정상 동작 테스트' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
  // IoT기반 지하공간 안전관리 시스템
  'info-22': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '기능', range: '-', content: '시스템 관련 기능의 정상 동작(모니터링, 제어 등) 여부 확인' },
      { subCategory: '기능', range: '-', content: '센서와의 데이터 연동 여부 확인' },
      { subCategory: '안전', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '가스 발생 유무 및 산소도 측정' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: '각종 센서 모니터링 및 제어 정상 동작 여부 확인' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
  // 디지털 사이니지
  'info-23': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '기능', range: '-', content: '서버로부터 받은 실시간 정보의 정상 표출 여부 확인' },
      { subCategory: '기능', range: '-', content: '글자(한글, 영문), 숫자 등 정보 가독성 확인' },
      { subCategory: '기능', range: '-', content: '미디어 원격제어 정상동작 확인' },
      { subCategory: '안전', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: '디스플레이 고정 장치 상태 확인' },
      { subCategory: '-', range: '-', content: '디스플레이 테스트를 통한 불량 화소 확인' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
  // 통신용 전원설비
  'etc-01': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '외관', range: '-', content: '배터리 보호함 및 단자 커버 유무 및 상태 확인' },
      { subCategory: '외관', range: '-', content: '배터리 누액 발생 여부 확인' },
      { subCategory: '기능', range: '-', content: '배터리 충전량 확인' },
      { subCategory: '기능', range: '-', content: '냉각팬 동작 상태 확인' },
      { subCategory: '기능', range: '-', content: '고장 또는 오작동 경고 알람 여부 확인' },
      { subCategory: '안전', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '이상 발열 및 소음 상태 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: '이중화부 동작, 절체 시험' },
      { subCategory: '-', range: '-', content: 'UPS 바이패스 절체 동작시험' },
      { subCategory: '-', range: '-', content: '입ㆍ출력 전압 및 충전전압, 전류측정, 배터리 전압 측정' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
  // 통신접지설비
  'etc-02': {
    functional: [
      { subCategory: '외관', range: '-', content: '외관 상태 점검(오염, 부식, 손상, 파손 등)' },
      { subCategory: '외관', range: '-', content: '기기와 연결 케이블 및 커넥터 상태 확인' },
      { subCategory: '안전', range: '-', content: '전원 단자 및 연결 상태 확인' },
      { subCategory: '안전', range: '-', content: '이상 발열 및 소음 상태 확인' },
      { subCategory: '안전', range: '-', content: '접지저항 측정' },
    ],
    performance: [
      { subCategory: '-', range: '-', content: '유지보수·관리 및 성능점검 대상 현황표 확인' },
      { subCategory: '-', range: '-', content: '접지 상태 확인' },
      { subCategory: '-', range: '-', content: '접지저항 측정' },
    ],
  },
}
