import type { Department } from "@/types/department";

/**
 * 학과 검색. 다음을 모두 잡아낸다.
 *  - 띄어쓰기/기호 무시:        "컴퓨터 과학"  → 컴퓨터과학과,  "아동가족" → 아동·가족학과
 *  - 약칭(별명):                "컴공", "전전", "첨컴", "언홍영", "의대"
 *  - 초성:                      "ㅋㅍㅌ" → 컴퓨터과학과,  "ㅊㄷㅋㅍㅌ" → 첨단컴퓨팅학부
 *  - 글자+초성 섞기:            "컴ㅍ" → 컴퓨터…
 *  - 순서만 맞으면 중간 생략:   "컴과" → 컴퓨터과학과,  "화생공" → 화공생명공학과
 * 결과는 "얼마나 잘 맞는지" 점수 순으로 정렬되어 가장 그럴듯한 것이 맨 위에 온다.
 */

// 학과별 약칭. 학생들이 실제로 부르는 이름을 넣는다. 키는 departmentNames.ts 의 정식 이름과 같아야 한다.
const ALIASES: Record<string, string[]> = {
  국어국문학과: ["국문", "국문과", "국어국문"],
  중어중문학과: ["중문", "중문과", "중어중문"],
  영어영문학과: ["영문", "영문과", "영어영문"],
  독어독문학과: ["독문", "독문과", "독어독문"],
  불어불문학과: ["불문", "불문과", "불어불문"],
  노어노문학과: ["노문", "노문과", "노어노문", "러시아"],
  사학과: ["사학", "역사"],
  철학과: ["철학"],
  문헌정보학과: ["문정", "문헌정보"],
  심리학과: ["심리"],
  경제학부: ["경제", "경제학과"],
  응용통계학과: ["응통", "통계", "응용통계"],
  경영학과: ["경영"],
  수학과: ["수학"],
  물리학과: ["물리"],
  화학과: ["화학"],
  지구시스템과학과: ["지구", "지시과", "지구시스템"],
  천문우주학과: ["천문", "천우", "우주"],
  대기과학과: ["대기", "대기과학"],
  화공생명공학과: ["화공", "화생공", "화공생명"],
  전기전자공학과: ["전전", "전기전자", "전자"],
  건축공학과: ["건축"],
  도시공학과: ["도시"],
  건설환경공학과: ["건환", "건설환경", "토목"],
  기계공학과: ["기계", "기공"],
  신소재공학과: ["신소재", "신소"],
  산업공학과: ["산공", "산업"],
  시스템반도체공학과: ["반도체", "시반", "시스템반도체"],
  디스플레이융합공학과: ["디스플레이", "디융"],
  디지털융합엔지니어링학과: ["디지털융합", "디융엔", "디지털"],
  "지능형데이터·최적화학과": ["데이터", "지능형데이터", "최적화", "지데최"],
  배터리공학과: ["배터리"],
  인공위성시스템학과: ["인공위성", "위성"],
  시스템생물학과: ["시생", "시스템생물", "생물"],
  생화학과: ["생화학", "생화"],
  생명공학과: ["생공", "생명공학", "생명"],
  첨단컴퓨팅학부: ["첨컴", "첨단컴퓨팅", "컴퓨팅", "advanced computing"],
  컴퓨터과학과: ["컴공", "컴과", "컴퓨터", "컴사", "cs", "computer science"],
  인공지능학과: ["ai", "인공지능", "에이아이"],
  인공지능시스템학과: ["인시", "ai시스템", "인공지능시스템"],
  첨단융합공학부: ["첨융", "첨단융합", "융합공학"],
  신학과: ["신학"],
  정치외교학과: ["정외", "정치외교", "정치"],
  행정학과: ["행정"],
  사회복지학과: ["사복", "사회복지", "복지"],
  사회학과: ["사회"],
  문화인류학과: ["문인", "인류", "문화인류"],
  언론홍보영상학부: ["언홍영", "언론", "홍보", "영상", "미디어", "신방"],
  교회음악과: ["교음", "교회음악"],
  성악과: ["성악"],
  피아노과: ["피아노"],
  관현악과: ["관현악", "오케스트라"],
  작곡과: ["작곡"],
  의류환경학과: ["의환", "의류", "패션"],
  식품영양학과: ["식영", "식품", "영양"],
  실내건축학과: ["실건", "실내건축", "인테리어"],
  "아동·가족학과": ["아가", "아동가족", "아동", "가족"],
  통합디자인학과: ["통디", "디자인", "통합디자인"],
  교육학부: ["교육", "교육학과"],
  체육교육학과: ["체교", "체육", "체육교육"],
  스포츠응용산업학과: ["스응산", "스포츠", "스포츠산업"],
  진리자유학부: ["진리자유", "진자", "자유전공"],
  의예과: ["의대", "의학", "의예", "메디컬"],
  치의예과: ["치대", "치의학", "치과", "치예"],
  간호학과: ["간호", "간대"],
  약학과: ["약대", "약학"],
};

const CHOSUNG = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ",
  "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

const HANGUL_BASE = 0xac00;
const HANGUL_COUNT = 11172;

function isHangulSyllable(ch: string): boolean {
  const code = ch.charCodeAt(0) - HANGUL_BASE;
  return code >= 0 && code < HANGUL_COUNT;
}

function isJamo(ch: string): boolean {
  return /^[ㄱ-ㅎ]$/.test(ch);
}

/** 완성형 한글 한 글자의 초성. 한글이 아니면 그대로 돌려준다. */
function chosungOf(ch: string): string {
  if (!isHangulSyllable(ch)) return ch;
  const index = Math.floor((ch.charCodeAt(0) - HANGUL_BASE) / 588);
  return CHOSUNG[index]!;
}

/** 비교용 정규화: 소문자, 공백·중점(·)·괄호·하이픈 제거 */
export function normalize(text: string): string {
  return text.toLowerCase().replace(/[\s·()\-_.,/]/g, "");
}

/**
 * 글자 단위로 "일치"를 판정한다. 검색어 글자가 자음(초성)이면 대상 글자의 초성과 비교하고,
 * 완성형이면 그대로 비교한다. 그래서 "컴ㅍ" 같은 입력도 처리된다.
 */
function charMatches(queryChar: string, targetChar: string): boolean {
  if (queryChar === targetChar) return true;
  if (isJamo(queryChar)) return chosungOf(targetChar) === queryChar;
  return false;
}

/** 검색어가 대상 문자열 안에 연속으로 등장하는 위치(없으면 -1). 초성 혼합 허용. */
function findContiguous(target: string, query: string): number {
  if (query.length === 0) return 0;
  if (query.length > target.length) return -1;
  outer: for (let start = 0; start <= target.length - query.length; start++) {
    for (let j = 0; j < query.length; j++) {
      if (!charMatches(query[j]!, target[start + j]!)) continue outer;
    }
    return start;
  }
  return -1;
}

/** 검색어 글자들이 순서만 지키며(중간 생략 허용) 대상에 등장하는가. "컴과" → 컴퓨터과학과 */
function isSubsequence(target: string, query: string): boolean {
  let i = 0;
  for (const ch of target) {
    if (i < query.length && charMatches(query[i]!, ch)) i++;
  }
  return i === query.length;
}

/**
 * 하나의 후보(정식 이름 또는 별명)와 검색어의 일치 점수. 0이면 불일치.
 * 큰 값이 더 좋은 일치.  정확 > 앞부분 > 포함 > 순서만 일치
 */
function scoreCandidate(candidate: string, query: string): number {
  const target = normalize(candidate);
  if (target === query) return 100;
  const pos = findContiguous(target, query);
  if (pos === 0) return 90;
  if (pos > 0) return 80 - Math.min(pos, 10); // 앞쪽에서 맞을수록 조금 더 높게
  if (query.length >= 2 && isSubsequence(target, query)) return 40;
  return 0;
}

/** 학과 하나의 최종 점수: 정식 이름과 별명들 중 가장 높은 점수. 별명 일치는 이름 일치보다 살짝 낮게. */
export function scoreDepartment(department: Department, normalizedQuery: string): number {
  let best = scoreCandidate(department.name, normalizedQuery);
  for (const alias of ALIASES[department.name] ?? []) {
    best = Math.max(best, scoreCandidate(alias, normalizedQuery) - 2);
  }
  return best;
}

/**
 * 검색 진입점. 빈 검색어면 이름순 전체, 아니면 점수 내림차순(동점이면 이름순).
 */
export function searchDepartments(departments: Department[], query: string): Department[] {
  const q = normalize(query);
  if (!q) {
    return [...departments].sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }

  return departments
    .map((department) => ({ department, score: scoreDepartment(department, q) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.department.name.localeCompare(b.department.name, "ko"))
    .map((entry) => entry.department);
}
