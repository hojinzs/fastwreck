# Draft 관리 기능 명세서

## 개요

Draft 기능은 콘텐츠 제작자가 아이디어를 바탕으로 초안을 작성하고 편집할 수 있는 핵심 기능입니다. Rich Text Editor(Tiptap)를 기반으로 하며, 버전 관리와 자동 저장 기능을 제공합니다.

## 주요 기능

### 1. Draft 생성 및 관리

#### 1.1 Draft 생성
- **엔드포인트**: `POST /api/drafts`
- **기능**: 새로운 초안 생성
- **입력 데이터**:
  - `title` (필수): 초안 제목
  - `workspaceId` (필수): 워크스페이스 ID
  - `content` (선택): 초기 콘텐츠 (Tiptap JSON 형식)
  - `changeSummary` (선택): 첫 번째 버전 변경 요약
- **동작**:
  - 사용자가 워크스페이스 멤버인지 확인
  - Draft 생성 시 자동으로 버전 1 생성
  - 기본 상태는 'DRAFT'
  - 생성자 정보와 함께 저장

#### 1.2 Draft 목록 조회
- **엔드포인트**: `GET /api/drafts?workspaceId={workspaceId}`
- **기능**: 워크스페이스의 모든 초안 목록 조회
- **반환 데이터**:
  - Draft 목록 (최신순 정렬)
  - 각 Draft의 메타데이터 (제목, 상태, 현재 버전, 생성자, 업데이트 일시)
  - 버전 개수 카운트

#### 1.3 Draft 상세 조회
- **엔드포인트**: `GET /api/drafts/{id}`
- **기능**: 특정 초안의 상세 정보 조회
- **반환 데이터**:
  - Draft 전체 정보
  - 최신 버전의 콘텐츠
  - 워크스페이스 정보
  - 생성자 정보

#### 1.4 Draft 메타데이터 수정
- **엔드포인트**: `PATCH /api/drafts/{id}`
- **기능**: 초안의 제목 또는 상태 변경
- **입력 데이터**:
  - `title` (선택): 새로운 제목
  - `status` (선택): 새로운 상태 (DRAFT, REVIEW, READY, PUBLISHED)
- **동작**:
  - 워크스페이스 멤버만 수정 가능
  - updatedAt 자동 갱신

#### 1.5 Draft 삭제
- **엔드포인트**: `DELETE /api/drafts/{id}`
- **기능**: 초안 삭제 (모든 버전과 함께 삭제)
- **권한**: 초안 생성자만 삭제 가능
- **동작**: Cascade 삭제로 모든 버전이 함께 삭제됨

### 2. 버전 관리

#### 2.1 버전 히스토리 조회
- **엔드포인트**: `GET /api/drafts/{id}/versions`
- **기능**: 초안의 모든 버전 히스토리 조회
- **반환 데이터**:
  - 모든 버전 목록 (최신순 정렬)
  - 각 버전의 생성 시각, 생성자, 변경 요약

#### 2.2 특정 버전 조회
- **엔드포인트**: `GET /api/drafts/{id}/versions/{version}`
- **기능**: 특정 버전의 콘텐츠 조회
- **반환 데이터**:
  - 버전의 전체 콘텐츠 (JSON, HTML, Markdown)
  - 메타데이터

#### 2.3 새 버전 생성
- **엔드포인트**: `POST /api/drafts/{id}/versions`
- **기능**: 초안의 새 버전 저장
- **입력 데이터**:
  - `content` (필수): Tiptap JSON 형식의 콘텐츠
  - `contentHtml` (선택): HTML 형식의 콘텐츠
  - `contentMarkdown` (선택): Markdown 형식의 콘텐츠
  - `changeSummary` (선택): 변경 요약
- **동작**:
  - 현재 버전 번호에서 1 증가
  - Draft의 `currentVersion` 필드 업데이트
  - 트랜잭션으로 원자적 처리

#### 2.4 버전 되돌리기
- **엔드포인트**: `POST /api/drafts/{id}/revert/{version}`
- **기능**: 특정 버전으로 되돌리기
- **동작**:
  - 대상 버전의 콘텐츠를 복사하여 새 버전 생성
  - changeSummary에 "Reverted to version {version}" 자동 기록
  - 이전 버전을 삭제하지 않고 새 버전으로 추가

### 2.5 임시 저장 (Auto-save)

Draft는 자동 저장 기능을 통해 작업 중인 콘텐츠를 보호합니다. 3초 디바운스 후 자동으로 임시 저장됩니다.

#### 2.5.1 임시 콘텐츠 저장
- **엔드포인트**: `PATCH /api/drafts/{id}/temp`
- **기능**: 편집 중인 콘텐츠를 임시 저장
- **입력 데이터**:
  - `content`: Tiptap JSON 형식의 콘텐츠
- **동작**:
  - Draft의 `tempContent`, `tempContentSavedAt` 필드 업데이트
  - 마지막 편집자의 임시 저장본만 유지 (덮어쓰기)
  - 정식 버전은 생성하지 않음

#### 2.5.2 임시 콘텐츠 삭제 (되돌리기)
- **엔드포인트**: `DELETE /api/drafts/{id}/temp`
- **기능**: 임시 저장본 삭제하고 마지막 정식 버전으로 되돌리기
- **동작**:
  - `tempContent`, `tempContentSavedAt` null로 설정
  - 확인 다이얼로그 표시 후 실행
  - 프론트엔드에서 마지막 정식 버전 콘텐츠 로드

#### 2.5.3 임시 콘텐츠를 정식 버전으로 저장
- **엔드포인트**: `POST /api/drafts/{id}/temp/commit`
- **기능**: 임시 저장본을 새로운 정식 버전으로 커밋
- **동작**:
  - tempContent를 이용하여 새 버전 생성
  - changeSummary 자동 생성 ("Version {n}")
  - tempContent, tempContentSavedAt 삭제
  - currentVersion 증가
  - 트랜잭션으로 원자적 처리

#### 2.5.4 UI 동작
- **임시 저장 표시**: 노란색 배너에 "임시 저장됨: {시각}" 표시
- **버튼 표시**: 임시 저장본이 있을 때만 우측 사이드바에 버튼 표시
  - [새 버전 저장]: 임시 저장본을 정식 버전으로 커밋
  - [되돌리기]: 임시 저장본 삭제 및 마지막 버전으로 복원
- **자동 저장 타이밍**: 콘텐츠 변경 후 3초 디바운스

### 3. Rich Text Editor (Tiptap)

#### 3.1 지원 포맷
- **기본 텍스트 포맷**:
  - Bold (굵게)
  - Italic (기울임)
- **헤딩**:
  - H1, H2, H3
- **리스트**:
  - Bullet List (글머리 기호 목록)
  - Ordered List (번호 목록)
- **인용**:
  - Blockquote (인용구)

#### 3.2 에디터 기능
- **실시간 편집**: 사용자 입력이 즉시 반영
- **자동 저장** (임시 저장):
  - 콘텐츠 변경 후 3초 디바운스 후 자동 임시 저장
  - 임시 저장 시각 표시 (노란색 배너)
  - 정식 버전은 수동으로만 생성
- **통계 표시**:
  - 문자 수 (Characters)
  - 단어 수 (Words)

#### 3.3 콘텐츠 형식
- **저장 형식**: Tiptap JSON (ProseMirror JSON 스키마)
- **추가 형식** (선택):
  - HTML: 웹 렌더링용
  - Markdown: 호환성 및 내보내기용

### 4. 프론트엔드 페이지

#### 4.1 Draft 목록 페이지 (`/workspace/{workspaceId}/drafts`)
- **기능**:
  - 워크스페이스의 모든 초안 목록 표시
  - 각 초안의 제목, 상태, 버전, 생성자, 최종 수정일 표시
  - 새 초안 생성 버튼
  - 초안 삭제 버튼 (생성자만)
- **필터/정렬**:
  - 기본: 최신 수정일 순

#### 4.2 Draft 편집 페이지 (`/workspace/{workspaceId}/drafts/{id}`)

**레이아웃**: 좌우 분할 (메인 에디터 + 우측 사이드바)

**메인 에디터 영역 (좌측)**:
- 제목 편집 필드
- Tiptap Rich Text Editor
- 임시 저장 표시 배너 (임시 저장본이 있을 때만)
- 뒤로 가기 버튼

**우측 사이드바 (320px)**:
- Draft 설정 섹션:
  - 상태 변경 드롭다운
  - 현재 버전 표시
  - 메타데이터 업데이트 버튼
- 임시 저장본 관리 섹션 (임시 저장본이 있을 때만 표시):
  - [새 버전 저장] 버튼 (초록색)
  - [되돌리기] 버튼 (빨간색)
- 버전 히스토리 섹션:
  - 모든 버전 목록 (최신순)
  - 각 버전의 번호, 생성 시각, 변경 요약
  - 각 버전별 [Revert] 버튼

#### 4.3 새 Draft 생성 페이지 (`/workspace/{workspaceId}/drafts/new`)
- **기능**:
  - 제목 입력 필드
  - Tiptap 에디터
  - 생성 버튼
- **동작**:
  - 생성 후 편집 페이지로 이동

## 데이터베이스 스키마

### Draft 테이블
```sql
CREATE TABLE "drafts" (
    "id" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "current_version" INTEGER NOT NULL DEFAULT 1,
    "status" "DraftStatus" NOT NULL DEFAULT 'DRAFT',
    "workspaceId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE,
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE
);
```

### DraftVersion 테이블
```sql
CREATE TABLE "draft_versions" (
    "id" TEXT PRIMARY KEY,
    "version" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "content_html" TEXT,
    "content_markdown" TEXT,
    "change_summary" TEXT,
    "draftId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY ("draftId") REFERENCES "drafts"("id") ON DELETE CASCADE,
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE,
    UNIQUE ("draftId", "version")
);
```

### DraftStatus Enum
```sql
CREATE TYPE "DraftStatus" AS ENUM ('DRAFT', 'REVIEW', 'READY', 'PUBLISHED');
```

## 보안 및 권한

### 접근 제어
- **Draft 생성**: 워크스페이스 멤버만 가능
- **Draft 조회**: 워크스페이스 멤버만 가능
- **Draft 수정**: 워크스페이스 멤버만 가능
- **Draft 삭제**: 생성자만 가능
- **버전 관리**: 워크스페이스 멤버만 가능

### 인증
- JWT 토큰 기반 인증
- Bearer 토큰을 Authorization 헤더에 포함

## API 사용 예시

### Draft 생성
```bash
POST /api/drafts
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "새로운 콘텐츠 아이디어",
  "workspaceId": "workspace-uuid",
  "content": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "초안 내용..."
          }
        ]
      }
    ]
  }
}
```

### 새 버전 생성
```bash
POST /api/drafts/{id}/versions
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": {
    "type": "doc",
    "content": [...]
  },
  "changeSummary": "오타 수정 및 문단 추가"
}
```

### 버전 되돌리기
```bash
POST /api/drafts/{id}/revert/3
Authorization: Bearer {token}
```

## 향후 개선 사항 (Phase 2+)

### 고급 에디터 기능
- 이미지 업로드 및 삽입
- 링크 삽입 및 편집
- 테이블 지원
- 코드 블록 (구문 강조)
- 임베드 콘텐츠 (YouTube, Twitter 등)

### 협업 기능
- 실시간 협업 편집 (Yjs + WebSocket)
- 인라인 코멘트
- 변경 추적 (Track changes)
- 승인 워크플로우

### AI 기능
- Idea → Draft 자동 생성 (RAG 기반)
- Style Book 연동 및 스타일 체크
- 콘텐츠 개선 제안
- SEO 스코어카드

### 내보내기
- PDF 내보내기
- DOCX 내보내기
- 다양한 플랫폼용 포맷 최적화

## 구현 파일 위치

### 백엔드 (apps/api)
- `prisma/schema.prisma` - Draft, DraftVersion 모델
- `prisma/migrations/20251230162541_add_draft_models/` - 마이그레이션
- `src/drafts/drafts.module.ts` - NestJS 모듈
- `src/drafts/drafts.controller.ts` - API 컨트롤러
- `src/drafts/drafts.service.ts` - 비즈니스 로직
- `src/drafts/dto/` - DTO 클래스들

### 프론트엔드 (apps/console)
- `src/shared/api/drafts.ts` - API 클라이언트
- `src/widgets/draft-editor/TiptapEditor.tsx` - Tiptap 에디터 컴포넌트
- `src/widgets/draft-editor/editor-styles.css` - 에디터 스타일
- `src/pages/drafts/DraftsListPage.tsx` - 목록 페이지
- `src/pages/drafts/DraftEditorPage.tsx` - 편집 페이지
- `src/router.tsx` - 라우팅 설정

## 테스트 가이드

### 수동 테스트 시나리오

1. **Draft 생성 테스트**:
   - 워크스페이스 선택
   - "New Draft" 버튼 클릭
   - 제목 입력 및 콘텐츠 작성
   - "Create Draft" 클릭
   - 편집 페이지로 이동 확인

2. **자동 저장 테스트**:
   - 기존 Draft 열기
   - 콘텐츠 수정
   - 3초 대기
   - "Last saved" 시각 업데이트 확인

3. **버전 관리 테스트**:
   - 여러 번 콘텐츠 수정 및 자동 저장
   - 페이지 하단 버전 히스토리 확인
   - 이전 버전으로 되돌리기
   - 새 버전 생성 확인

4. **권한 테스트**:
   - 다른 사용자로 Draft 삭제 시도 (실패 확인)
   - 워크스페이스 비멤버로 접근 시도 (실패 확인)

## 문의 및 지원

Draft 기능에 대한 문의사항이나 버그 리포트는 GitHub Issues를 통해 제출해주세요.
