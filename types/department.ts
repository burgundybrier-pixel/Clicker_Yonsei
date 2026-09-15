// 공통 계약: 이름/필드 변경 금지 (SPEC.md 14번 참고)
export interface Department {
  id: number;
  name: string;
  score: number;
}

// DB row 전체가 필요한 곳(주로 서버 쪽)에서만 사용하는 확장 타입.
// 화면/컴포넌트는 위 Department만 사용한다.
export interface DepartmentRecord extends Department {
  created_at: string;
  updated_at: string;
}
