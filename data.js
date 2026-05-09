// 공고 데이터 - 이 파일만 수정하면 공고 추가/수정 가능합니다.
//
// 필드 설명:
// - id: 고유 식별자 (숫자)
// - firm: 로펌명
// - title: 공고 제목
// - deadline: 마감일 (YYYY-MM-DD 형식)
// - postedAt: 공고 등록일 (YYYY-MM-DD 형식, 최신순 정렬에 사용)
// - openChatUrl: 카카오 오픈채팅 링크
// - stage: 채용 단계 (마감 후에만 표시됨)
//   - "review"   : 서류 검토 중 (주황)
//   - "interview": 면접 진행 중 (파랑)
//   - "done"     : 채용 완료 (초록)
//   - "unknown"  : 미확인 (회색)
// - stageCheckedAt: 채용 단계 확인 시간 (YYYY-MM-DD HH:mm 형식)

const POSTINGS = [
  {
    id: 1,
    firm: "김앤장 법률사무소",
    title: "2026년 상반기 변호사 수습 채용",
    deadline: "2026-05-20",
    postedAt: "2026-04-15",
    openChatUrl: "#",
    stage: "unknown",
    stageCheckedAt: ""
  },
  {
    id: 2,
    firm: "법무법인 광장",
    title: "신입 변호사 (수습) 모집",
    deadline: "2026-05-15",
    postedAt: "2026-04-20",
    openChatUrl: "#",
    stage: "unknown",
    stageCheckedAt: ""
  },
  {
    id: 3,
    firm: "법무법인 태평양",
    title: "2026년 어쏘시에이트 변호사 채용",
    deadline: "2026-05-25",
    postedAt: "2026-04-25",
    openChatUrl: "#",
    stage: "unknown",
    stageCheckedAt: ""
  },
  {
    id: 4,
    firm: "법무법인 율촌",
    title: "수습 변호사 채용 공고",
    deadline: "2026-04-30",
    postedAt: "2026-04-01",
    openChatUrl: "#",
    stage: "review",
    stageCheckedAt: "2026-05-08 14:30"
  },
  {
    id: 5,
    firm: "법무법인 세종",
    title: "신입 변호사 모집 (송무팀)",
    deadline: "2026-04-25",
    postedAt: "2026-03-28",
    openChatUrl: "#",
    stage: "interview",
    stageCheckedAt: "2026-05-07 10:15"
  },
  {
    id: 6,
    firm: "법무법인 화우",
    title: "2026년 신규 변호사 채용",
    deadline: "2026-04-20",
    postedAt: "2026-03-20",
    openChatUrl: "#",
    stage: "done",
    stageCheckedAt: "2026-05-05 18:00"
  },
  {
    id: 7,
    firm: "법무법인 바른",
    title: "변호사(수습) 모집",
    deadline: "2026-04-15",
    postedAt: "2026-03-15",
    openChatUrl: "#",
    stage: "unknown",
    stageCheckedAt: ""
  },
  {
    id: 8,
    firm: "법무법인 지평",
    title: "기업법무 어쏘시에이트 채용",
    deadline: "2026-05-30",
    postedAt: "2026-05-01",
    openChatUrl: "#",
    stage: "unknown",
    stageCheckedAt: ""
  }
];
