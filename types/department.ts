/**
 * 공통 계약: "학과" 하나의 모양. 화면·서버·DB 조회 결과가 모두 이 형태를 쓴다.
 * 이름/필드를 바꾸면 프로젝트 전체가 함께 바뀌어야 하므로 함부로 바꾸지 않는다 (SPEC.md 참고).
 *
 * DB 테이블에는 created_at, updated_at 도 있지만 화면에 필요 없어서 여기서는 뺐다.
 * 조회할 때 select("id, name, score") 로 이 세 개만 가져온다.
 */
export interface Department {
  id: number;
  name: string;
  score: number;
}
