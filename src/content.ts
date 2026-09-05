export const NAV = [
  { id: 'about', n: '01', label: '소개' },
  { id: 'activity', n: '02', label: '활동' },
  { id: 'curriculum', n: '03', label: '커리큘럼' },
  { id: 'contest', n: '04', label: '천코대' },
  { id: 'contact', n: '05', label: '연락' },
] as const

/** The DFS walk of the hero tree spells this out, one glyph per visited node. */
export const HERO_GLYPHS = [...'알고리즘연구부SHARC']

export const HERO = {
  eyebrow: 'SUNRIN INTERNET HIGH SCHOOL · ALGORITHM RESEARCH CLUB · EST. 2015',
  intro:
    '알고리즘 문제 해결과 이산수학을 파고드는 선린인터넷고등학교 자율동아리. 2015년부터 매주 문제를 붙잡고 앉아 있습니다.',
  headline: '알고리즘연구부',
}

export const ABOUT = {
  lead: 'SHARC는 알고리즘 문제 해결과 이산수학 같은 컴퓨터과학을 다루고 연구하는 선린인터넷고등학교의 자율동아리입니다.',
  paragraphs: [
    '2015년에 개설되어 10년째 이어지고 있습니다. 그 사이 이 교실을 거쳐 간 부원들은 대회 수상자로, 개발자로, 그리고 다시 이 교실의 강사로 돌아왔습니다.',
    '교내 알고리즘 대회인 천하제일 코딩 대회를 주관하고, 알고리즘 분야 전문 강사님과 졸업 선배를 초청해 수업과 멘토링을 진행합니다.',
  ],
  stats: [
    { value: 2015, suffix: '', cap: '동아리 개설' },
    { value: 10, suffix: '년+', cap: '끊기지 않고 이어온 활동' },
    { value: 1, suffix: '회/년', cap: '천하제일 코딩 대회 주관' },
  ],
}

export const ACTIVITIES = [
  {
    title: '정규 수업',
    body: 'C++ 기초 문법에서 출발해 자료구조와 알고리즘 이론까지, 학기 흐름을 따라 순서대로 다룹니다.',
  },
  {
    title: '문제 풀이',
    body: '배운 이론은 그날 바로 백준에서 확인합니다. 안 풀리면 같이 붙잡고, 풀리면 왜 풀렸는지 다시 뜯어봅니다.',
  },
  {
    title: '교내 대회 주관',
    body: '천하제일 코딩 대회의 문제 출제부터 검수, 채점, 운영까지 부원들이 직접 맡습니다.',
  },
  {
    title: '선배·외부 강사 멘토링',
    body: '선린을 졸업한 선배와 분야 전문 강사님을 초청해 더 깊은 수업과 진로 상담을 진행합니다.',
  },
]

export const CURRICULUM = {
  rows: ['1학기 초', '1학기 중반', '2학기'],
  cols: ['C++', '자료구조', '알고리즘', '기출·대회', '멘토링'],
  /** null = base case: nothing to accumulate from yet. */
  cells: [
    ['입출력·조건문·반복문', '배열과 문자열', null, null, null],
    ['STL 컨테이너', '스택·큐·트리', '정렬·이분 탐색', '백준 단계별', null],
    ['템플릿·시간복잡도', '그래프 표현', 'DP·그래프 탐색', 'NYPC·정보올림피아드', '선배·외부 강사'],
  ] as (string | null)[][],
  note: '각 칸은 왼쪽 칸과 위쪽 칸이 채워진 뒤에야 계산됩니다. 커리큘럼이 쌓이는 순서도 같습니다.',
}

export const CONTEST = {
  titleHead: '천하제일',
  titleTail: '코딩 대회',
  paragraphs: [
    '알연부가 매년 주관하는 교내 알고리즘 문제 해결 대회입니다. 최대 3명이 한 팀을 이루고, 출제부터 채점까지 부원들이 직접 맡습니다.',
    '알고리즘 경험이 없어도 괜찮습니다. 첫 참가에서 한 문제를 붙잡고 세 시간을 보낸 사람이 이듬해 출제진이 되기도 합니다.',
  ],
  facts: [
    ['형식', '팀당 최대 3명'],
    ['대상', '선린인터넷고등학교 재학생 누구나'],
    ['주기', '매년 1회 · 알고리즘연구부 주관'],
  ],
  graphNote: 'K₃ — 세 명으로 이루어진 팀',
}

export const CONTACT = {
  lead: '들어오고 싶거나, 뭘 하는지 궁금하거나, 대회 문의가 있다면.',
  links: [
    { addr: 'contact@sharc.kr', href: 'mailto:contact@sharc.kr', kind: 'EMAIL' },
    {
      addr: '@sunrin_sharc',
      href: 'https://www.instagram.com/sunrin_sharc/',
      kind: 'INSTAGRAM',
    },
  ],
}

export const FOOTER = {
  lines: ['SUNRIN INTERNET HIGH SCHOOL', 'ALGORITHM RESEARCH CLUB', '© 2026 SHARC'],
}
