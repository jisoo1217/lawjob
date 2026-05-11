// 공고 데이터 - 기본 공고는 이 파일에서 관리합니다.
//
// source:
// - "seoulbar"  : 서울지방변호사회 공고. 공고 상세 필드를 직접 입력합니다.
// - "jobcenter" : 취업정보센터 공고. 외부 게시글 링크만 입력합니다.
//
// stage:
// - "hidden"    : 채용단계 표시 안 함
// - "interview" : 면접 진행 중
// - "done"      : 채용 완료

const POSTINGS = [
  {
    id: 1,
    source: "seoulbar",
    firm: "법률사무소 동락",
    title: "신입변호사 모집",
    deadline: "2026-05-06",
    postedAt: "2026-04-06",
    stage: "interview",
    stageCheckedAt: "2026-05-09",
    location: "서울 성동구 아차산로17길 48 성수 SK V1 CENTER I 306호",
    salary: "월 300~350만원 (세전)",
    workHours: "09:00~18:00 (월~금)",
    contact: "02-446-8490",
    representative: "이무섭, 정영선 변호사",
    size: "변호사 3명, 사무원 1명",
    jobType: "실무수습 변호사 (지식재산 분쟁 등)\n채용형태: 정규직, 채용인원: 1명",
    startDate: "2026-05-26",
    requirements: "제15회 변호사시험 합격자",
    process: "1차 서류(~05-06) -> 2차 면접(~05-20)",
    documents: "이력서 및 자기소개서",
    resumeItems: "이름, 주소, 연락처, 학력, 자격증, 관련경력, 기타",
    coverLetterItems: "자유롭게 기술",
    applicationEmail: "yschung@donglaklaw.com",
    notifyMethod: "전화 또는 이메일 연락",
    homepage: "https://www.donglaklaw.com",
    benefits: "4대보험, 식비, 연차, 출산/생리휴가, 육아휴직",
    description: ""
  },
  {
    id: 2,
    source: "seoulbar",
    firm: "법무법인 창세",
    title: "신입변호사 채용",
    deadline: "2026-05-14",
    postedAt: "2026-05-09",
    stage: "interview",
    stageCheckedAt: "2026-05-09 16:00",
    location: "서울 서초구 서초대로 254 오퓨런스 7층 710호",
    salary: "월 600만원 이상 (세전)",
    workHours: "09:30~18:30 (월~금), 휴게시간 11:30~12:30",
    contact: "02-6013-6117 / 010-3596-1544",
    representative: "김정묵, 박영재",
    size: "변호사 3명, 직원 3명",
    jobType: "정규직, 1명",
    startDate: "2026-05-25",
    requirements: "무관",
    process: "1차 서류(~05-18) -> 2차 면접(~05-25)",
    documents: "이력서",
    resumeItems: "이름, 주소, 연락처, 학력, 자격증, 관련경력, 기타",
    coverLetterItems: "자기소개서 별도 제출 없음",
    applicationEmail: "mkshin@changselaw.com",
    notifyMethod: "1차 서류 심사 후 유선 개별통보",
    homepage: "https://www.changselaw.com",
    benefits: "4대보험, 식비, 연차, 개인사무공간 제공, 출장용 법인카드 지원",
    description: "민사, 형사, 행정 사건 소송 수행, 준비서면 작성, 법원·경찰·노동청 출석, 의뢰인 상담 및 사건 관리."
  },
  {
    id: 3,
    source: "seoulbar",
    firm: "법무법인 예시",
    title: "신입변호사 채용",
    deadline: "2026-05-20",
    postedAt: "2026-05-10",
    stage: "interview",
    stageCheckedAt: "2026-05-10",
    location: "서울 서초구 ...",
    salary: "월 500만원 이상",
    workHours: "09:00~18:00",
    applicationEmail: "recruit@example.com",
    contact: "",
    representative: "",
    size: "",
    jobType: "",
    startDate: "",
    requirements: "",
    process: "",
    documents: "",
    resumeItems: "",
    coverLetterItems: "",
    notifyMethod: "",
    homepage: "",
    benefits: "",
    description: ""
  },
  {
    id: 4,
    source: "jobcenter",
    firm: "취업정보센터",
    title: "취업정보센터 공고 예시",
    postedAt: "2026-05-10",
    deadline: "2026-05-31",
    stage: "interview",
    stageCheckedAt: "",
    externalUrl: "https://www.koreanbar.or.kr"
  }
];
