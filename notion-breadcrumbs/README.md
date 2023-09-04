# [팀 과제] 노션에서 브로드 크럼스(Breadcrumbs) 만들기 - 면접 4팀

## 요구사항

**페이지 정보 조회 API**: 특정 페이지의 정보를 조회할 수 있는 API를 구현하세요.

- 입력: 페이지 ID
- 출력: 페이지 제목, 컨텐츠, 서브 페이지 리스트, **브로드 크럼스 ( 페이지 1 > 페이지 3 > 페이지 5)**
- 컨텐츠 내에서 서브페이지 위치 고려 X

## 시나리오

> A > B > C  
> D > E

참고) **D > B(다른 경로로 동일한 페이지에 접근 허가 X)**

## 예상 출력

> 1 depth

A라는 페이지 탐색했을 때

```json
{
  "pageId": 1,
  "title": "hihihi",
  "content": "hihihihasdfsdfsdf",
  "subPages": ["B"],
  "breadcrumbs": ["A"]
}
```

> 2 depth

B라는 페이지 탐색했을 때

```json
{
  "pageId": 2,
  "title": "jojo",
  "content": "hihihihasdfsdfsdf",
  "subPages": ["C"],
  "breadcrumbs": ["A", "B"]
}
```

> 3 depth

C라는 페이지 탐색했을 때

```json
{
  "pageId": 3,
  "title": "hoho",
  "content": "hihihihasdfsdfsdf",
  "subPages": [],
  "breadcrumbs": ["A", "B", "C"]
}
```

# ERD

![ERD](https://cdn.discordapp.com/attachments/1146612184655351861/1147864861829763134/2023-09-03_9.04.39.png)

## 더미데이터

### posts

![posts](https://cdn.discordapp.com/attachments/1146612184655351861/1147863570219008121/2023-09-03_8.59.11.png)

### post_contents

![post_contents](https://cdn.discordapp.com/attachments/1146612184655351861/1147863569409507478/2023-09-03_8.59.42.png)

### breadcrumbs

![breadcrumbs](https://cdn.discordapp.com/attachments/1146612184655351861/1147863569648586804/2023-09-03_8.59.32.png)

### sub_pages

![sub_pages](https://cdn.discordapp.com/attachments/1146612184655351861/1147863569912840252/2023-09-03_8.59.20.png)

## 로직

1. 페이지 ID를 입력 받는다.
2. 입력받은 페이지 ID를 사용하여 `posts` 테이블에서 `title`을 얻는다. `title`은 `breadcrumbs`를 구성하는 요소이다.
3. `page_id`를 사용하여 현재 페이지에서 접속 가능한 하위 페이지들을 `subPages` 테이블에서 검색한다.
4. `page_id`를 사용하여 현재 페이지까지의 경로를 담고있는 `breadcrumbs` 테이블에서 `breadcrumbs`를 얻는다.

## 핵심 쿼리

```sql
select p.id, p.title, sp.title as subPage, pp.breadcrumbs from posts as p
left join sub_pages as sp on p.id = sp.post_id
left join breadcrumbs as pp on p.id = pp.post_id
where p.id = ${page_id};
```

## 실행 결과

- 쉘 환경에서의 쿼리결과
  ![result](https://cdn.discordapp.com/attachments/1146612184655351861/1147862696000237599/2023-09-03_8.51.48.png)

- Node.js 런타임 환경에서 json형태의 결과

요구사항에 맞춰 content 데이터는 가져오지 않았다.

## 테이블 구조

우선적으로 게시판 데이터를 이행적 종속성을 제거한 제 3 정규화를 진행하여 테이블을 설계했다.

많지 않은 컬럼 수의 post 데이터를 굳이 분해하지 않아도 된다고 생각할 수 있지만

Notion의 자주 업데이트가 일어나는 환경 특성상 하나의 테이블에 모든 데이터를 담아두는 구조는 이상현상을 초래할 수 있다고 판단했다.

또한 요구사항의 결과 정보를 살펴보면 subPages, breadcrumbs의 결과값이 배열인 점을 살펴볼 수 있었는데

이는 분리된 subPages와 breadcrumbs의 테이블에서 join을 통해 조건에 맞는 데이터를 모두 가져온 형태를 띠고 있다고 판단했다.

## 왜 이 구조가 최선인가?

1. 정규화를 거침으로서 이상현상 제거, 쿼리 성능향상

- 추후 다양한 api를 추가 개발할 시 해당 게시판의 특정 정보만을 필요로 한 기능(현재 페이지의 서브페이지에 관한 crud, 컨텐츠 수정 및 삭제 등) 개발 시 불필요한 순회를 제거

2. breadcrumbs를 각 포스트마다 미리 선언함으로서 동적인 breadcrumbs 계산 불필요

- 프론트엔드 로직을 동시에 수정할 수 있는 상황이거나, 프로그래밍 언어의 도움을 받을 수 있는 상황이라면 더 다양한 선택지가 존재하지만, 해당 과제는 **_순수 Raw query_**만을 활용하여 해결해야 하는 문제라고 판단

- 해당 문제를 동적으로 해결하고 page별로 fix 된 breadcrumbs를 저장하지 않으려면, `PL/SQL`을 사용한 while loop를 통해 dfs를 진행해야 한다고 판단

  - 이는 난이도가 다소 높아지며 상황에 따라 데이터베이스 트래픽을 크게 증가시키는 지양해야 할 방법이라고 판단

- 따라서 update, delete 시 추가 작업이 들겠지만 페이지별로 fix 된 breadcrumbs를 저장하는 것이 옳다고 판단
