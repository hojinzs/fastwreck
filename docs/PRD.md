# Product Requirements Document: 자동저작 툴

## 1. 개요

### 1.1 목표
콘텐츠 제작자를 위한 end-to-end 자동저작 플랫폼 구축. Discovery부터 Publishing까지 전체 콘텐츠 제작 파이프라인을 자동화하고, 워크플로우 기반의 확장 가능한 시스템 제공.

### 1.2 핵심 가치
- **Self-hosted First**: Docker Compose 기반 간편한 설치
- **Workflow Automation**: n8n 연동을 통한 유연한 워크플로우 구성
- **Open Source → Cloud**: 오픈소스로 시작, 클라우드 서비스로 확장

### 1.3 비즈니스 모델
1. Self-service (Open Source) 제공
2. n8n 커넥터 개발 및 지원
3. 유료 Cloud Workflow 서비스 (BM)
4. Self-hosted → Cloud Service 전환 경로 제공

---

## 2. 시스템 아키텍처

### 2.1 기술 스택

**Frontend**
- React.js (SPA)
- Vite
- TanStack Router
- Tiptap (Rich Text Editor)

**Backend**
- NestJS
- PostgreSQL (with pgvector extension)
- REST API

**Infrastructure**
- Docker Compose (primary deployment)
- Miniflux (RSS Reader)
- Pinchflat (YouTube Downloader)
- n8n (Optional, Workflow Automation)

### 2.2 Docker Compose 구성

```yaml
services:
  webapp:         # React SPA
  api:            # NestJS API Server
  db:             # PostgreSQL + pgvector
  miniflux:       # RSS Reader
  pinchflat:      # YouTube Downloader
  n8n:            # Workflow Engine (optional)
```

---

## 3. 기능 구조

```
Workspace
├── Users (Team Members)
├── Discovery
│   ├── RSS (Miniflux)
│   ├── YouTube (Pinchflat)
│   ├── Social (TODO - Phase 2+)
│   └── Shorts (TODO - Phase 2+)
├── Channels (연결된 블로그/YouTube 채널)
├── Style Book (라이팅 스타일 가이드)
├── Ideas (Discovery → Idea 변환)
├── Drafts (초안 작성 및 편집)
└── Publish (발행 관리 및 통계)
```

---

## 4. Phase 1: MVP (상세)

### 4.1 Workspace & Users

**기능**
- 워크스페이스 생성/관리
- 멀티 유저 지원
- 팀 멤버 초대 및 권한 관리

**DB Schema**
```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE workspace_members (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  user_id UUID REFERENCES users(id),
  role VARCHAR(50), -- 'owner', 'admin', 'member', 'viewer'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);
```

**API Endpoints**
```
POST   /api/workspaces
GET    /api/workspaces
GET    /api/workspaces/:id
PATCH  /api/workspaces/:id
DELETE /api/workspaces/:id

POST   /api/workspaces/:id/members
GET    /api/workspaces/:id/members
DELETE /api/workspaces/:id/members/:userId
```

---

### 4.2 Discovery

#### 4.2.1 RSS Reader (Miniflux Integration)

**기능**
- RSS 피드 구독 관리
- 읽음/안읽음 히스토리 트래킹 (워크스페이스별, 유저별)
- 피드 아이템 필터링 및 검색

**DB Schema**
```sql
CREATE TABLE rss_feeds (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  miniflux_feed_id VARCHAR(255),
  url TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE rss_read_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  workspace_id UUID REFERENCES workspaces(id),
  feed_id UUID REFERENCES rss_feeds(id),
  entry_id VARCHAR(255), -- Miniflux entry ID
  read_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, entry_id)
);
```

**API Endpoints**
```
POST   /api/rss/feeds                    # Subscribe to feed
GET    /api/rss/feeds                    # List feeds
DELETE /api/rss/feeds/:id                # Unsubscribe
GET    /api/rss/entries                  # Get entries (with unread filter)
POST   /api/rss/entries/:id/mark-read    # Mark as read
```

**Integration Flow**
1. NestJS API가 Miniflux API 호출
2. 응답 데이터와 로컬 DB의 read_history 병합
3. 유저별 읽지 않은 아이템 반환

---

#### 4.2.2 YouTube Downloader (Pinchflat Integration)

**기능**
- YouTube 채널 구독
- 자동 다운로드 설정
- 비디오 메타데이터 관리

**DB Schema**
```sql
CREATE TABLE youtube_subscriptions (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  channel_id VARCHAR(255),
  channel_url TEXT NOT NULL,
  channel_name TEXT,
  auto_download BOOLEAN DEFAULT false,
  download_settings JSONB, -- {quality: '1080p', format: 'mp4'}
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE youtube_downloads (
  id UUID PRIMARY KEY,
  subscription_id UUID REFERENCES youtube_subscriptions(id),
  video_id VARCHAR(255) UNIQUE,
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  duration INT, -- seconds
  published_at TIMESTAMP,
  downloaded_at TIMESTAMP,
  file_path TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**API Endpoints**
```
POST   /api/youtube/subscriptions
GET    /api/youtube/subscriptions
PATCH  /api/youtube/subscriptions/:id
DELETE /api/youtube/subscriptions/:id
GET    /api/youtube/videos
POST   /api/youtube/videos/:id/download  # Manual download trigger
```

---

### 4.3 Ideas

**기능**
- Discovery 콘텐츠를 기반으로 아이디어 생성
- URL + Content 형태로 출처 관리
- pgvector를 활용한 임베딩 저장
- Vector similarity search (n8n agent 조회 지원)

**DB Schema**
```sql
-- pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE ideas (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  title TEXT NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'new', -- 'new', 'in_review', 'approved', 'drafted'
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE TABLE idea_sources (
  id UUID PRIMARY KEY,
  idea_id UUID REFERENCES ideas(id),
  url TEXT,
  content TEXT,
  source_type VARCHAR(50), -- 'rss', 'youtube', 'manual'
  embedding vector(1536), -- OpenAI ada-002 dimensions
  metadata JSONB, -- {title, author, publishedAt, thumbnail, ...}
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vector similarity index
CREATE INDEX ON idea_sources USING ivfflat (embedding vector_cosine_ops);
```

**API Endpoints**
```
POST   /api/ideas                        # Create idea
GET    /api/ideas                        # List ideas
GET    /api/ideas/:id                    # Get idea detail
PATCH  /api/ideas/:id                    # Update idea
DELETE /api/ideas/:id                    # Delete idea

POST   /api/ideas/:id/sources            # Add source to idea
GET    /api/ideas/:id/sources            # List sources
DELETE /api/ideas/:id/sources/:sourceId  # Remove source

POST   /api/ideas/search                 # Vector similarity search
```

**Vector Search API (for n8n)**
```json
POST /api/ideas/search
{
  "query": "how to optimize YouTube thumbnails",
  "workspaceId": "ws-123",
  "limit": 5,
  "threshold": 0.7  // similarity threshold
}

Response:
{
  "results": [
    {
      "ideaId": "idea-456",
      "title": "Video Optimization Strategies",
      "sources": [
        {
          "id": "src-789",
          "url": "https://example.com/article",
          "content": "...",
          "similarity": 0.89
        }
      ]
    }
  ]
}
```

---

### 4.4 Drafts

**기능**
- Rich Text Editor (Tiptap)
- 버전 관리
- Auto-save
- Markdown 지원

**DB Schema**
```sql
CREATE TABLE drafts (
  id UUID PRIMARY KEY,
  idea_id UUID REFERENCES ideas(id), -- optional link to idea
  workspace_id UUID REFERENCES workspaces(id),
  title TEXT NOT NULL,
  current_version INT DEFAULT 1,
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'review', 'ready', 'published'
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

CREATE TABLE draft_versions (
  id UUID PRIMARY KEY,
  draft_id UUID REFERENCES drafts(id),
  version INT NOT NULL,
  content JSONB, -- Tiptap JSON format
  content_html TEXT, -- Rendered HTML
  content_markdown TEXT, -- Markdown format
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  change_summary TEXT,
  UNIQUE(draft_id, version)
);
```

**API Endpoints**
```
POST   /api/drafts                       # Create draft
GET    /api/drafts                       # List drafts
GET    /api/drafts/:id                   # Get draft
PATCH  /api/drafts/:id                   # Update draft
DELETE /api/drafts/:id                   # Delete draft

GET    /api/drafts/:id/versions          # Get version history
POST   /api/drafts/:id/versions          # Create new version
GET    /api/drafts/:id/versions/:version # Get specific version
POST   /api/drafts/:id/revert/:version   # Revert to version
```

**Editor 기능**
- Auto-save (3초 debounce)
- Version snapshot on manual save
- Real-time character/word count
- Basic formatting (bold, italic, headings, lists, links)

---

### 4.5 Webhook API

**기능**
- n8n workflow 연동을 위한 webhook endpoints
- 주요 이벤트 트리거

**Webhook Events**
```
POST /webhooks/discovery/new-item       # New RSS or YouTube item
POST /webhooks/idea/created             # Idea created
POST /webhooks/idea/status-changed      # Idea status updated
POST /webhooks/draft/created            # Draft created
POST /webhooks/draft/version-created    # New draft version
```

**Webhook Payload Example**
```json
{
  "event": "idea.created",
  "timestamp": "2025-01-01T00:00:00Z",
  "workspaceId": "ws-123",
  "data": {
    "ideaId": "idea-456",
    "title": "New Content Idea",
    "sources": [...]
  }
}
```

---

### 4.6 Phase 1 우선순위

**Week 1-2: 기반 구축**
- [ ] Docker Compose 환경 구성
- [ ] NestJS API 프로젝트 초기화
- [ ] React + Vite + TanStack Router 설정
- [ ] PostgreSQL + pgvector 설정
- [ ] Workspace & Users 기본 구현

**Week 3-4: Discovery**
- [ ] Miniflux 통합
- [ ] RSS 피드 구독 및 읽기 기능
- [ ] Pinchflat 통합
- [ ] YouTube 채널 구독 및 다운로드

**Week 5-6: Ideas & Drafts**
- [ ] Idea CRUD API
- [ ] Vector embedding 저장 및 검색
- [ ] Draft Editor (Tiptap 통합)
- [ ] 버전 관리 기본 구현

**Week 7-8: 통합 및 테스트**
- [ ] Webhook API 구현
- [ ] 기본 workflow 예제 작성
- [ ] E2E 테스트
- [ ] 문서화 (README, Docker Compose 가이드)

---

## 5. Phase 2: 향후 목표 (간단)

### 5.1 AI 기능
- Idea → Draft 자동 생성 (RAG 기반)
- Style Book 연동 및 스타일 체크
- 콘텐츠 개선 제안
- SEO 스코어카드

### 5.2 고급 Drafts 기능
- 실시간 협업 (Yjs + WebSocket)
- Inline comments
- 변경 추적 (Track changes)
- 승인 워크플로우

### 5.3 Channels & Publishing
- 블로그 플랫폼 연동 (WordPress, Medium, etc.)
- YouTube 업로드 자동화
- 소셜 미디어 크로스포스팅
- 발행 스케줄링

### 5.4 Style Book
- 라이팅 스타일 가이드 관리
- 톤 & 보이스 템플릿
- 포맷 규칙 정의

---

## 6. Phase 3: 향후 목표 (간단)

### 6.1 Cloud Service
- 관리형 클라우드 서비스 출시
- 유료 Cloud Workflow 제공
- Multi-tenancy 아키텍처
- 엔터프라이즈 기능 (SSO, RBAC)

### 6.2 고급 Analytics
- 콘텐츠 성과 분석
- A/B 테스트
- 오디언스 인사이트

### 6.3 추가 Discovery 소스
- Social media monitoring
- Shorts/Reels 분석
- Podcast RSS
- Newsletter aggregation

### 6.4 Marketplace
- Community templates
- Workflow marketplace
- 플러그인 생태계

---

## 7. Technical Considerations

### 7.1 보안
- JWT 기반 인증
- API rate limiting
- CORS 설정
- 환경변수 기반 시크릿 관리

### 7.2 성능
- Database indexing (특히 vector search)
- API response caching
- Lazy loading (frontend)
- Pagination for large datasets

### 7.3 확장성
- Stateless API 설계
- Message queue 고려 (Phase 2+)
- CDN for media files (Phase 2+)

---

## 8. Success Metrics (Phase 1)

- [ ] Docker Compose로 5분 내 설치 가능
- [ ] RSS 피드 100개 동시 처리
- [ ] YouTube 채널 10개 자동 다운로드
- [ ] Draft editor 응답시간 < 100ms
- [ ] n8n webhook 성공률 > 99%

---

## 9. References

- [Miniflux API Documentation](https://miniflux.app/docs/api.html)
- [Pinchflat Documentation](https://github.com/kieraneglin/pinchflat)
- [Tiptap Documentation](https://tiptap.dev/)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [n8n Documentation](https://docs.n8n.io/)
