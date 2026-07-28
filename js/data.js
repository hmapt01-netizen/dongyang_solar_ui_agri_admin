/* ==========================================================================
   LASEE AI Agrivoltaic PV Compliance & Admin System Data Store
   (동양연합 영농형 태양광 AI 영농이행 종합관리 플랫폼 데이터셋)
   ========================================================================== */

const AGRI_ADMIN_DATA = {
  summary: {
    totalSites: 5,
    normalSites: 4,
    watchSites: 1,
    inspectionSites: 0,
    actionSites: 0,
    reportingPeriod: "2027.03.01 - 2027.03.31",
    authority: "강원특별자치도 / 원주시·횡성군·춘천시",
    generatedAt: "2027.04.02 09:00"
  },

  // 5 Agrivoltaic Power Plants Dataset with Real GPS Coordinates
  sites: {
    "12139": {
      id: "12139",
      name: "[12139][원주] 온누리3,4 (200kW)",
      code: "[원주] 온누리3,4",
      capacity: "200 kW",
      permitNo: "2027-AGPV-12139",
      address: "강원특별자치도 원주시 지정면 간현리 428",
      lat: 37.3422,
      lng: 127.9201,
      permitCrop: "콩",
      aiCrop: "콩",
      subCrop: "콩 / 감자 시범구",
      cropMatch: true,
      permitArea: 4000,
      actualArea: 3720,
      areaRatio: 93,
      complianceScore: 93,
      status: "정상 이행",
      statusBadge: "badge-success",
      riskLevel: "정상",
      riskBadge: "badge-success",
      eventsCount: 27,
      inactiveDays: 4,
      otherUseCount: 0,
      workerDetections: 18,
      machineryDetections: 8,
      mainActivity: "경운·파종·제초",
      manager: "김○○",
      reviewDate: "2027.04.04",
      decision: "정상 처리",
      
      scores: {
        farmingDuty: 96,
        cropCompliance: 95,
        landUseAppropriateness: 91
      },

      activities: [
        { type: "경운", count: 3, confidence: "95%", status: "확인", badge: "badge-success" },
        { type: "파종", count: 2, confidence: "94%", status: "확인", badge: "badge-success" },
        { type: "제초", count: 4, confidence: "90%", status: "확인", badge: "badge-success" },
        { type: "수확", count: 0, confidence: "-", status: "시기 전", badge: "badge-warning" }
      ],

      timeline: [
        { date: "03.02 09:20", title: "03.02 경운 작업", desc: "카메라 01 · 농기계 1대 · 신뢰도 96%", cam: "CAM01", confidence: "96%", review: "인정" },
        { date: "03.06 08:55", title: "03.06 파종 작업", desc: "카메라 02 · 작업자 2명 · 신뢰도 94%", cam: "CAM02", confidence: "94%", review: "인정" },
        { date: "03.18 15:12", title: "03.18 제초 작업", desc: "카메라 03 · 작업자 1명 · 신뢰도 91%", cam: "CAM02", confidence: "91%", review: "인정" },
        { date: "03.28 10:42", title: "03.28 농기계 작업", desc: "카메라 03 (남측 진입로) · 작업자 2명 / 농기계 1대 · 신뢰도 94%", cam: "CAM03", confidence: "94%", review: "인정" }
      ],

      anomalies: [
        { title: "북측 미경작 의심구역", desc: "전월 대비 2.1% 증가 · 다음 리포트 재확인 권고", status: "관찰", badge: "badge-warning" },
        { title: "장기 무활동", desc: "연속 무활동 4일 (기준 14일 이내)", status: "정상", badge: "badge-success" },
        { title: "작물 불일치", desc: "신고작물(콩)과 AI 영상 판정 작물 100% 일치", status: "미탐지", badge: "badge-success" }
      ],

      cameraEvidence: {
        camId: "CAM03",
        timestamp: "2027.03.28 10:42:16",
        gps: "37.3422, 127.9201",
        videoUrl: "CAM03-0328-1042",
        classification: "농기계 작업",
        confidence: 94,
        workers: 2,
        machinery: 1,
        zone: "B구역 (남측 진입로)",
        decisionBasis: [
          "작업자 2명 연속 탐지 (신뢰도 0.97)",
          "농기계 이동 궤적 확인 (신뢰도 0.92)",
          "경작구역 내 반복 영농 작업 패턴",
          "비농업적 주차·적치 패턴과 불일치"
        ],
        reviewHistory: [
          { reviewer: "김○○ 담당자", time: "2027.04.03 14:21", action: "인정", badge: "badge-success" }
        ]
      }
    },

    "12138": {
      id: "12138",
      name: "[12138][원주] 온누리1,2 (200kW)",
      code: "[원주] 온누리1,2",
      capacity: "200 kW",
      permitNo: "2027-AGPV-12138",
      address: "강원특별자치도 원주시 지정면 안창리 115",
      lat: 37.3380,
      lng: 127.9150,
      permitCrop: "옥수수",
      aiCrop: "옥수수",
      subCrop: "옥수수 / 배추 시범구",
      cropMatch: true,
      permitArea: 3800,
      actualArea: 3496,
      areaRatio: 92,
      complianceScore: 91,
      status: "정상 이행",
      statusBadge: "badge-success",
      riskLevel: "정상",
      riskBadge: "badge-success",
      eventsCount: 24,
      inactiveDays: 3,
      otherUseCount: 0,
      workerDetections: 15,
      machineryDetections: 6,
      mainActivity: "경운·제초",
      manager: "이○○",
      reviewDate: "2027.04.03",
      decision: "정상 처리",
      scores: { farmingDuty: 94, cropCompliance: 92, landUseAppropriateness: 90 },
      activities: [
        { type: "경운", count: 2, confidence: "96%", status: "확인", badge: "badge-success" },
        { type: "파종", count: 1, confidence: "92%", status: "확인", badge: "badge-success" },
        { type: "제초", count: 3, confidence: "91%", status: "확인", badge: "badge-success" }
      ],
      timeline: [
        { date: "03.04 10:15", title: "03.04 로터리 작업", desc: "카메라 01 · 트랙터 1대 · 신뢰도 95%", cam: "CAM01", confidence: "95%", review: "인정" },
        { date: "03.12 14:20", title: "03.12 옥수수 파종", desc: "카메라 02 · 작업자 3명 · 신뢰도 92%", cam: "CAM02", confidence: "92%", review: "인정" }
      ],
      anomalies: [
        { title: "장기 무활동", desc: "연속 무활동 3일 (정상)", status: "정상", badge: "badge-success" }
      ],
      cameraEvidence: {
        camId: "CAM01",
        timestamp: "2027.03.12 14:20:00",
        gps: "37.3380, 127.9150",
        videoUrl: "CAM01-0312-1420",
        classification: "옥수수 파종 작업",
        confidence: 92,
        workers: 3,
        machinery: 1,
        zone: "A구역",
        decisionBasis: ["작업자 3명 탐지", "경작 구역 정지 작업"],
        reviewHistory: [{ reviewer: "이○○ 담당자", time: "2027.04.03", action: "인정", badge: "badge-success" }]
      }
    },

    "12140": {
      id: "12140",
      name: "[12140][원주] 온누리5,6 (300kW)",
      code: "[원주] 온누리5,6",
      capacity: "300 kW",
      permitNo: "2027-AGPV-12140",
      address: "강원특별자치도 원주시 소초면 흥양리 88",
      lat: 37.3850,
      lng: 127.9950,
      permitCrop: "벼",
      aiCrop: "벼",
      subCrop: "벼 / 들깨 시범구",
      cropMatch: true,
      permitArea: 6000,
      actualArea: 5400,
      areaRatio: 90,
      complianceScore: 88,
      status: "관찰 필요",
      statusBadge: "badge-warning",
      riskLevel: "관찰",
      riskBadge: "badge-warning",
      eventsCount: 18,
      inactiveDays: 7,
      otherUseCount: 0,
      workerDetections: 10,
      machineryDetections: 4,
      mainActivity: "물대기·경운",
      manager: "박○○",
      reviewDate: "2027.04.02",
      decision: "관찰 유지",
      scores: { farmingDuty: 88, cropCompliance: 90, landUseAppropriateness: 86 },
      activities: [
        { type: "경운", count: 3, confidence: "94%", status: "확인", badge: "badge-success" },
        { type: "관수", count: 5, confidence: "90%", status: "확인", badge: "badge-success" }
      ],
      timeline: [
        { date: "03.08 11:00", title: "03.08 경운 작업", desc: "카메라 01 · 농기계 1대 · 신뢰도 94%", cam: "CAM01", confidence: "94%", review: "인정" }
      ],
      anomalies: [
        { title: "동측 경계 미경작 의심구역", desc: "전월 대비 1.5% 증가", status: "관찰", badge: "badge-warning" }
      ],
      cameraEvidence: {
        camId: "CAM02",
        timestamp: "2027.03.08 11:00:00",
        gps: "37.3850, 127.9950",
        videoUrl: "CAM02-0308-1100",
        classification: "논 로터리 작업",
        confidence: 94,
        workers: 1,
        machinery: 1,
        zone: "C구역",
        decisionBasis: ["트랙터 이동 궤적 탐지"],
        reviewHistory: [{ reviewer: "박○○ 담당자", time: "2027.04.02", action: "인정", badge: "badge-success" }]
      }
    },

    "12141": {
      id: "12141",
      name: "[12141][횡성] 청정영농형1호 (500kW)",
      code: "[횡성] 청정영농형1호",
      capacity: "500 kW",
      permitNo: "2027-AGPV-12141",
      address: "강원특별자치도 횡성군 횡성읍 학곡리 502",
      lat: 37.4917,
      lng: 127.9846,
      permitCrop: "사과",
      aiCrop: "사과",
      subCrop: "사과 / 인삼 영농구",
      cropMatch: true,
      permitArea: 9500,
      actualArea: 8550,
      areaRatio: 90,
      complianceScore: 95,
      status: "정상 이행",
      statusBadge: "badge-success",
      riskLevel: "정상",
      riskBadge: "badge-success",
      eventsCount: 35,
      inactiveDays: 2,
      otherUseCount: 0,
      workerDetections: 22,
      machineryDetections: 10,
      mainActivity: "전정·전지·관수",
      manager: "최○○",
      reviewDate: "2027.04.01",
      decision: "정상 처리",
      scores: { farmingDuty: 98, cropCompliance: 96, landUseAppropriateness: 94 },
      activities: [
        { type: "전지", count: 8, confidence: "97%", status: "확인", badge: "badge-success" },
        { type: "방제", count: 4, confidence: "95%", status: "확인", badge: "badge-success" }
      ],
      timeline: [
        { date: "03.05 09:00", title: "03.05 과수 전정 작업", desc: "카메라 01 · 작업자 4명 · 신뢰도 97%", cam: "CAM01", confidence: "97%", review: "인정" }
      ],
      anomalies: [
        { title: "장기 무활동", desc: "연속 무활동 2일 (정상)", status: "정상", badge: "badge-success" }
      ],
      cameraEvidence: {
        camId: "CAM01",
        timestamp: "2027.03.05 09:00:00",
        gps: "37.4917, 127.9846",
        videoUrl: "CAM01-0305-0900",
        classification: "과수 전정 작업",
        confidence: 97,
        workers: 4,
        machinery: 1,
        zone: "과수A구역",
        decisionBasis: ["작업자 전동 가위 작업 탐지"],
        reviewHistory: [{ reviewer: "최○○ 담당자", time: "2027.04.01", action: "인정", badge: "badge-success" }]
      }
    },

    "12142": {
      id: "12142",
      name: "[12142][춘천] 소양강 영농태양광 (150kW)",
      code: "[춘천] 소양강 영농",
      capacity: "150 kW",
      permitNo: "2027-AGPV-12142",
      address: "강원특별자치도 춘천시 신북읍 발산리 204",
      lat: 37.8813,
      lng: 127.7298,
      permitCrop: "블루베리",
      aiCrop: "블루베리",
      subCrop: "블루베리 / 고추 시범구",
      cropMatch: true,
      permitArea: 3000,
      actualArea: 2790,
      areaRatio: 93,
      complianceScore: 94,
      status: "정상 이행",
      statusBadge: "badge-success",
      riskLevel: "정상",
      riskBadge: "badge-success",
      eventsCount: 22,
      inactiveDays: 4,
      otherUseCount: 0,
      workerDetections: 14,
      machineryDetections: 5,
      mainActivity: "시비·관수",
      manager: "정○○",
      reviewDate: "2027.04.01",
      decision: "정상 처리",
      scores: { farmingDuty: 95, cropCompliance: 95, landUseAppropriateness: 92 },
      activities: [
        { type: "관수", count: 6, confidence: "94%", status: "확인", badge: "badge-success" },
        { type: "시비", count: 3, confidence: "91%", status: "확인", badge: "badge-success" }
      ],
      timeline: [
        { date: "03.10 13:30", title: "03.10 블루베리 묘목 점검", desc: "카메라 01 · 작업자 2명 · 신뢰도 94%", cam: "CAM01", confidence: "94%", review: "인정" }
      ],
      anomalies: [
        { title: "장기 무활동", desc: "연속 무활동 4일 (정상)", status: "정상", badge: "badge-success" }
      ],
      cameraEvidence: {
        camId: "CAM01",
        timestamp: "2027.03.10 13:30:00",
        gps: "37.8813, 127.7298",
        videoUrl: "CAM01-0310-1330",
        classification: "묘목 관수 작업",
        confidence: 94,
        workers: 2,
        machinery: 0,
        zone: "관수 구역",
        decisionBasis: ["관수 시설 가동 및 인력 작업"],
        reviewHistory: [{ reviewer: "정○○ 담당자", time: "2027.04.01", action: "인정", badge: "badge-success" }]
      }
    }
  },

  // Priority Watchlist
  priorityWatchlist: [
    { id: "12140", name: "[12140] [원주] 온누리5,6", issue: "동측 경계 미경작 1.5% 관찰", level: "관찰", badge: "badge-medium" },
    { id: "12139", name: "[12139] [원주] 온누리3,4", issue: "북측 경계 미경작 2.1% 관찰", level: "관찰", badge: "badge-medium" },
    { id: "12138", name: "[12138] [원주] 온누리1,2", issue: "정상 이행 (영농활동 지속)", level: "정상", badge: "badge-low" },
    { id: "12141", name: "[12141] [횡성] 청정영농형1호", issue: "정상 이행 (과수 전정 진행)", level: "정상", badge: "badge-low" },
    { id: "12142", name: "[12142] [춘천] 소양강 영농", issue: "정상 이행 (관수 작업 진행)", level: "정상", badge: "badge-low" }
  ],

  // Recent Reports Table (5 Plants)
  recentReports: [
    { id: "12139", name: "[12139] [원주] 온누리3,4 (200kW)", crop: "콩 / 감자", events: "27건", area: "93%", result: "정상 이행", badge: "badge-success" },
    { id: "12138", name: "[12138] [원주] 온누리1,2 (200kW)", crop: "옥수수 / 배추", events: "24건", area: "92%", result: "정상 이행", badge: "badge-success" },
    { id: "12140", name: "[12140] [원주] 온누리5,6 (300kW)", crop: "벼 / 들깨", events: "18건", area: "90%", result: "관찰 필요", badge: "badge-warning" },
    { id: "12141", name: "[12141] [횡성] 청정영농형1호 (500kW)", crop: "사과 / 인삼", events: "35건", area: "90%", result: "정상 이행", badge: "badge-success" },
    { id: "12142", name: "[12142] [춘천] 소양강 영농 (150kW)", crop: "블루베리 / 고추", events: "22건", area: "93%", result: "정상 이행", badge: "badge-success" }
  ]
};
