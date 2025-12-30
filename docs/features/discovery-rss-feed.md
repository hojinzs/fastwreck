# Discovery: RSS Feed Integration

## Overview

RSS Feed Discovery는 워크스페이스 단위로 RSS 콘텐츠를 구독하고, 팀원들이 함께 읽으면서 아이디어를 발견하는 기능입니다. Miniflux를 백엔드로 사용하여 강력한 RSS 관리 기능을 제공하며, 개인별 읽음 상태 추적을 통해 팀 협업을 지원합니다.

## Core Concepts

### 워크스페이스 기반 공유 구독
- 하나의 워크스페이스는 하나의 Miniflux 계정을 공유
- 팀원 모두가 동일한 피드 구독 목록을 공유
- 개인별로 읽음/안읽음 상태는 독립적으로 관리

### Discovery의 역할
> "Discovery는 단순한 입력 창이 아니다. '내가 요즘 무엇에 반응하고 있는지'가 쌓이는 공간이다."
> — CORE_CONCEPTS.md

RSS Feed는 콘텐츠 제작자가 무엇에 관심을 두고 있는지를 자연스럽게 채집하는 도구입니다.

---

## Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                        Workspace                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Miniflux Account (1:1)                       │ │
│  │  - miniflux_url                                        │ │
│  │  - miniflux_api_key (encrypted)                        │ │
│  │  - is_active                                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           │ manages                          │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   RSS Feeds (N)                        │ │
│  │  - Feed 1: TechCrunch                                  │ │
│  │  - Feed 2: Hacker News                                 │ │
│  │  - Feed 3: Medium Engineering                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           │ tracks per user                  │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            RSS Read History (per User)                 │ │
│  │  - User A: [entry1, entry2, ...]                       │ │
│  │  - User B: [entry3, entry5, ...]                       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

#### miniflux_accounts
워크스페이스별 Miniflux 계정 연동 정보

```sql
CREATE TABLE miniflux_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID UNIQUE NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  miniflux_url TEXT DEFAULT 'http://miniflux:8080',
  miniflux_username TEXT NOT NULL,
  miniflux_api_key TEXT NOT NULL, -- Encrypted
  is_active BOOLEAN DEFAULT false,
  activated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_miniflux_accounts_workspace ON miniflux_accounts(workspace_id);
```

#### rss_feeds
구독 중인 RSS 피드 목록

```sql
CREATE TABLE rss_feeds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  miniflux_account_id UUID NOT NULL REFERENCES miniflux_accounts(id) ON DELETE CASCADE,
  miniflux_feed_id VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rss_feeds_account ON rss_feeds(miniflux_account_id);
CREATE INDEX idx_rss_feeds_miniflux_id ON rss_feeds(miniflux_feed_id);
```

#### rss_read_history
사용자별 읽음 상태 추적

```sql
CREATE TABLE rss_read_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  feed_id UUID NOT NULL REFERENCES rss_feeds(id) ON DELETE CASCADE,
  entry_id VARCHAR(255) NOT NULL, -- Miniflux entry ID
  read_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, entry_id)
);

CREATE UNIQUE INDEX idx_rss_read_history_user_entry ON rss_read_history(user_id, entry_id);
CREATE INDEX idx_rss_read_history_workspace ON rss_read_history(workspace_id);
CREATE INDEX idx_rss_read_history_feed ON rss_read_history(feed_id);
```

---

## Workflows

### 1. 워크스페이스 생성 시 Miniflux 계정 준비

**Trigger:** 새로운 워크스페이스 생성

**Flow:**
```
1. workspace 생성
2. miniflux_accounts 레코드 생성 (is_active=false)
   - workspace_id: {워크스페이스 ID}
   - is_active: false
   - miniflux_url: http://miniflux:8080 (기본값)
```

**Code Example:**
```typescript
// NestJS Service
async createWorkspace(dto: CreateWorkspaceDto) {
  const workspace = await this.workspaceRepository.create({
    name: dto.name,
    slug: generateSlug(dto.name),
  });

  // Miniflux 계정 준비 (비활성 상태)
  await this.minifluxAccountRepository.create({
    workspace_id: workspace.id,
    miniflux_url: process.env.MINIFLUX_URL || 'http://miniflux:8080',
    is_active: false,
  });

  return workspace;
}
```

---

### 2. RSS 기능 활성화

**Trigger:** 사용자가 워크스페이스 설정에서 "RSS 기능 활성화" 버튼 클릭

**Flow:**
```
1. Miniflux API를 통해 워크스페이스 전용 계정 생성
   - Username: workspace_{workspace_id}
   - Password: 자동 생성 (UUID)

2. Miniflux API 키 발급
   - POST /v1/users/{user_id}/api-keys

3. API 키 암호화 후 저장
   - AES-256-GCM 암호화
   - 암호화 키는 환경변수에서 관리

4. miniflux_accounts 업데이트
   - miniflux_username: workspace_{workspace_id}
   - miniflux_api_key: {encrypted_api_key}
   - is_active: true
   - activated_at: NOW()
```

**API Endpoint:**
```typescript
POST /api/workspaces/:id/activate-rss

Response:
{
  "success": true,
  "miniflux_account": {
    "id": "uuid",
    "workspace_id": "uuid",
    "username": "workspace_abc123",
    "is_active": true,
    "activated_at": "2025-01-01T00:00:00Z"
  }
}
```

**Security Implementation:**
```typescript
// Encryption helper
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_KEY = process.env.MINIFLUX_API_KEY_SECRET; // 32 bytes
const ALGORITHM = 'aes-256-gcm';

function encryptApiKey(apiKey: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);

  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decryptApiKey(encrypted: string): string {
  const [ivHex, authTagHex, encryptedData] = encrypted.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

---

### 3. RSS 피드 구독

**Trigger:** 사용자가 새로운 RSS 피드 URL 입력

**Flow:**
```
1. Miniflux API를 통해 피드 구독
   - POST /v1/feeds
   - Authorization: X-Auth-Token {decrypted_api_key}

2. rss_feeds 테이블에 저장
   - miniflux_account_id
   - miniflux_feed_id (Miniflux에서 반환)
   - url, title

3. 피드 목록 갱신
```

**API Endpoint:**
```typescript
POST /api/rss/feeds

Request:
{
  "url": "https://techcrunch.com/feed"
}

Response:
{
  "id": "uuid",
  "miniflux_account_id": "uuid",
  "miniflux_feed_id": "12345",
  "url": "https://techcrunch.com/feed",
  "title": "TechCrunch",
  "created_at": "2025-01-01T00:00:00Z"
}
```

**Implementation:**
```typescript
async subscribeFeed(workspaceId: string, url: string) {
  // 1. Get Miniflux account
  const account = await this.getMinifluxAccount(workspaceId);
  if (!account.is_active) {
    throw new Error('RSS feature is not activated');
  }

  // 2. Decrypt API key
  const apiKey = this.decryptApiKey(account.miniflux_api_key);

  // 3. Subscribe via Miniflux API
  const minifluxResponse = await this.minifluxClient.createFeed({
    feed_url: url,
    api_key: apiKey,
  });

  // 4. Save to database
  return await this.rssFeedRepository.create({
    miniflux_account_id: account.id,
    miniflux_feed_id: minifluxResponse.feed_id,
    url: url,
    title: minifluxResponse.title,
  });
}
```

---

### 4. 피드 아이템 조회 (읽지 않은 항목 우선)

**Trigger:** 사용자가 Discovery > RSS 페이지 접근

**Flow:**
```
1. 현재 워크스페이스의 Miniflux 계정 조회
2. Miniflux API로 전체 엔트리 조회 (최신순)
3. 현재 사용자의 rss_read_history 조회
4. 읽지 않은 항목 필터링 및 표시
```

**API Endpoint:**
```typescript
GET /api/rss/entries?status=unread&limit=50&offset=0

Response:
{
  "entries": [
    {
      "id": "entry-123",
      "feed_id": "uuid",
      "feed_title": "TechCrunch",
      "title": "New AI Model Released",
      "url": "https://...",
      "published_at": "2025-01-01T00:00:00Z",
      "content": "...",
      "is_read": false
    }
  ],
  "total": 150,
  "unread_count": 42
}
```

**Implementation:**
```typescript
async getEntries(userId: string, workspaceId: string, options: GetEntriesOptions) {
  // 1. Get Miniflux account
  const account = await this.getMinifluxAccount(workspaceId);
  const apiKey = this.decryptApiKey(account.miniflux_api_key);

  // 2. Fetch entries from Miniflux
  const minifluxEntries = await this.minifluxClient.getEntries({
    api_key: apiKey,
    limit: options.limit,
    offset: options.offset,
    order: 'published_at',
    direction: 'desc',
  });

  // 3. Get user's read history
  const readEntryIds = await this.rssReadHistoryRepository.find({
    where: { user_id: userId, workspace_id: workspaceId },
    select: ['entry_id'],
  });
  const readSet = new Set(readEntryIds.map(h => h.entry_id));

  // 4. Mark read status
  const entries = minifluxEntries.entries.map(entry => ({
    ...entry,
    is_read: readSet.has(entry.id.toString()),
  }));

  // 5. Filter if needed
  if (options.status === 'unread') {
    return entries.filter(e => !e.is_read);
  }

  return entries;
}
```

---

### 5. 읽음 처리 및 Idea 생성 연계

**Trigger:** 사용자가 RSS 아이템을 읽고 "Save to Ideas" 클릭

**Flow:**
```
1. rss_read_history에 읽음 기록 추가
2. (Optional) ideas 테이블에 새로운 아이디어 생성
3. idea_sources에 RSS 엔트리 정보 저장
4. 콘텐츠 임베딩 생성 (OpenAI API)
```

**API Endpoint:**
```typescript
POST /api/rss/entries/:entryId/save-to-ideas

Request:
{
  "idea_title": "AI Model Optimization Techniques",
  "idea_description": "Explore new methods for model compression"
}

Response:
{
  "idea": {
    "id": "uuid",
    "title": "AI Model Optimization Techniques",
    "status": "new"
  },
  "source": {
    "id": "uuid",
    "url": "https://...",
    "source_type": "rss",
    "embedding": [...], // 1536 dimensions
  }
}
```

**Implementation:**
```typescript
async saveEntryToIdea(userId: string, workspaceId: string, entryId: string, dto: SaveToIdeaDto) {
  // 1. Mark as read
  await this.markAsRead(userId, workspaceId, entryId);

  // 2. Get entry content from Miniflux
  const entry = await this.getEntry(entryId);

  // 3. Create idea
  const idea = await this.ideasService.create({
    workspace_id: workspaceId,
    title: dto.idea_title,
    description: dto.idea_description,
    created_by: userId,
    status: 'new',
  });

  // 4. Generate embedding
  const embedding = await this.openaiService.createEmbedding(entry.content);

  // 5. Create idea source
  const source = await this.ideaSourcesService.create({
    idea_id: idea.id,
    url: entry.url,
    content: entry.content,
    source_type: 'rss',
    embedding: embedding,
    metadata: {
      feed_title: entry.feed.title,
      published_at: entry.published_at,
      author: entry.author,
    },
  });

  return { idea, source };
}
```

---

## API Reference

### Workspace RSS Activation

#### `POST /api/workspaces/:id/activate-rss`
워크스페이스의 RSS 기능을 활성화하고 Miniflux 계정을 생성합니다.

**Response:**
```json
{
  "success": true,
  "miniflux_account": {
    "id": "uuid",
    "workspace_id": "uuid",
    "is_active": true
  }
}
```

---

### Feed Management

#### `POST /api/rss/feeds`
새로운 RSS 피드를 구독합니다.

**Request:**
```json
{
  "url": "https://example.com/feed.xml"
}
```

#### `GET /api/rss/feeds`
워크스페이스의 모든 구독 피드 목록을 조회합니다.

#### `DELETE /api/rss/feeds/:id`
피드 구독을 취소합니다.

---

### Entry Management

#### `GET /api/rss/entries`
RSS 엔트리 목록을 조회합니다.

**Query Parameters:**
- `status`: `all` | `unread` | `read`
- `limit`: number (default: 50)
- `offset`: number (default: 0)
- `feed_id`: UUID (optional)

#### `POST /api/rss/entries/:id/mark-read`
엔트리를 읽음으로 표시합니다.

#### `POST /api/rss/entries/:id/save-to-ideas`
RSS 엔트리를 Ideas로 저장합니다.

---

## Security Considerations

### API Key 암호화
- **Algorithm:** AES-256-GCM
- **Key Storage:** 환경변수 (`MINIFLUX_API_KEY_SECRET`)
- **Key Rotation:** 주기적으로 키 교체 지원 필요 (Phase 2+)

### 접근 제어
- 사용자는 자신이 속한 워크스페이스의 RSS만 접근 가능
- Row-Level Security (RLS) 적용 권장

```sql
ALTER TABLE rss_feeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY rss_feeds_workspace_isolation ON rss_feeds
  USING (
    miniflux_account_id IN (
      SELECT id FROM miniflux_accounts
      WHERE workspace_id = current_setting('app.current_workspace_id')::uuid
    )
  );
```

---

## Performance Optimization

### Caching Strategy
1. **피드 목록:** Redis 캐싱 (TTL: 5분)
2. **엔트리 목록:** Redis 캐싱 (TTL: 1분)
3. **읽음 상태:** In-memory cache (사용자별)

### Pagination
- 기본 limit: 50
- 최대 limit: 200
- Cursor-based pagination 권장 (Phase 2+)

### Miniflux API Rate Limiting
- 워크스페이스당 API 호출 제한: 100 req/min
- 백오프 전략 구현

---

## Phase 1 Implementation Checklist

- [ ] `miniflux_accounts` 테이블 생성
- [ ] `rss_feeds` 테이블 생성
- [ ] `rss_read_history` 테이블 생성
- [ ] API 키 암호화/복호화 유틸리티
- [ ] Miniflux API 클라이언트 라이브러리
- [ ] 워크스페이스 생성 시 Miniflux 계정 준비
- [ ] RSS 기능 활성화 API
- [ ] 피드 구독/구독취소 API
- [ ] 엔트리 조회 API (읽음/안읽음 필터링)
- [ ] 읽음 표시 API
- [ ] Ideas 연동 API
- [ ] Frontend: Discovery > RSS 페이지
- [ ] Frontend: RSS 활성화 UI
- [ ] Frontend: 피드 관리 UI
- [ ] Frontend: 엔트리 리스트 UI (읽지 않은 항목 강조)

---

## Future Enhancements (Phase 2+)

### AI 기반 필터링
- 관심도 기반 자동 필터링
- 중복 콘텐츠 제거
- 자동 카테고리 분류

### 고급 읽기 경험
- Reader Mode
- 텍스트 하이라이팅
- 주석(Annotations)

### 팀 협업
- 추천 엔트리 공유
- 팀원 읽기 현황 대시보드
- 코멘트 기능

### 통합
- Pocket/Instapaper 연동
- Browser extension
- Mobile app

---

## References

- [Miniflux API Documentation](https://miniflux.app/docs/api.html)
- [Miniflux Docker Setup](https://miniflux.app/docs/installation.html#docker)
- PRD.md - Discovery 섹션
- ERD.md - Discovery Tables
