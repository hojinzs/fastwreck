# Member Management & Account Features

멤버 관리 및 계정 기능 명세

## 개요

워크스페이스의 멤버 관리, 초대, 권한 관리 및 사용자 계정 관리 기능을 제공합니다.

## 역할 (Roles)

### 워크스페이스 역할

- **OWNER**: 워크스페이스 소유자
  - 모든 권한 보유
  - 워크스페이스당 1명만 존재
  - 역할 변경 및 제거 불가 (소유권 이양은 가능)

- **ADMIN**: 관리자
  - 워크스페이스 설정 변경 가능
  - 멤버 초대, 역할 변경, 제거 가능
  - Owner 이외의 멤버 관리 가능

- **MEMBER**: 일반 멤버
  - 워크스페이스 리소스 접근 및 편집 가능
  - 멤버 관리 권한 없음

- **VIEWER**: 뷰어
  - 읽기 전용 접근
  - 편집 권한 없음

## 1. 멤버 초대 (Workspace Invitation)

### 기능

- **초대 권한**: OWNER 또는 ADMIN
- **초대 가능 역할**: ADMIN, MEMBER, VIEWER (OWNER로는 초대 불가)
- **초대 방법**: 이메일 주소로 초대
- **초대 유효기간**: 7일
- **중복 초대 처리**: 기존 대기 중인 초대를 취소하고 새 초대 생성

### 초대 상태

- **PENDING**: 대기 중
- **ACCEPTED**: 수락됨
- **CANCELLED**: 취소됨
- **EXPIRED**: 만료됨 (만료는 조회 시점에 판단, 별도 스케줄러 없음)

### API Endpoints

#### 초대 생성
```
POST /workspaces/:id/invitations
Authorization: Bearer {token}
Body: { email: string, role: 'ADMIN' | 'MEMBER' | 'VIEWER' }
```

**응답**:
```json
{
  "id": "invitation-id",
  "email": "user@example.com",
  "role": "MEMBER",
  "code": "unique-code",
  "workspace": { ... },
  "invitedBy": { ... },
  "mailSent": true,  // false if mail driver not configured
  "expiresAt": "2025-01-06T..."
}
```

#### 워크스페이스 초대 목록
```
GET /workspaces/:id/invitations
Authorization: Bearer {token}
```

#### 초대 취소
```
DELETE /workspaces/:id/invitations/:invitationId
Authorization: Bearer {token}
```

#### 내가 받은 초대 목록
```
GET /invitations/me
Authorization: Bearer {token}
```

#### 초대 코드로 조회 (Public)
```
GET /invitations/:code
```

회원가입 페이지에서 사용. 초대 정보를 확인할 수 있으며, 인증 없이 접근 가능.

#### 초대 수락
```
POST /invitations/:code/accept
Authorization: Bearer {token}
```

### 초대 워크플로우

1. **초대 생성**
   - OWNER/ADMIN이 이메일 주소와 역할을 선택하여 초대 생성
   - 이미 멤버인 경우 에러 반환
   - 기존 대기 중인 초대가 있으면 취소 후 새 초대 생성

2. **초대 이메일 발송**
   - 메일 드라이버가 설정된 경우 이메일 발송
   - 메일 드라이버가 없으면 `mailSent: false` 반환
   - 초대 링크 형식: `/invitations/accept?code={code}`

3. **초대 수락**
   - 초대 링크 접근 시:
     - 미가입자: 회원가입 페이지로 이동 (`/register?inviteCode={code}`)
     - 기가입자: 로그인 후 자동 수락 또는 수동 수락
   - 초대 수락 시:
     - 이메일 일치 여부 확인
     - 워크스페이스 멤버로 추가
     - 초대 상태를 ACCEPTED로 변경

### 이메일 설정

초대 이메일 발송을 위해 다음 중 하나의 메일 드라이버 설정 필요:

#### SendGrid
```env
MAIL_DRIVER=sendgrid
SENDGRID_API_KEY=your_api_key
```

#### Mailgun
```env
MAIL_DRIVER=mailgun
MAILGUN_API_KEY=your_api_key
MAILGUN_DOMAIN=your_domain
MAILGUN_BASE_URL=https://api.mailgun.net
```

#### SMTP
```env
MAIL_DRIVER=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_username
SMTP_PASS=your_password
```

메일 드라이버가 설정되지 않은 경우:
- 초대는 정상적으로 생성됨
- `mailSent: false` 반환
- 프론트엔드에서 "초대 링크가 생성되었지만 이메일은 발송되지 않았습니다" 메시지 표시
- 초대 링크 복사 기능 제공

## 2. 멤버 관리

### 멤버 목록 조회
```
GET /workspaces/:id/members
```

워크스페이스의 모든 멤버 목록 조회 (workspace 조회 시 포함됨)

### 멤버 역할 변경
```
PATCH /workspaces/:id/members/:memberId
Authorization: Bearer {token}
Body: { role: 'ADMIN' | 'MEMBER' | 'VIEWER' }
```

**권한**: OWNER 또는 ADMIN
**제약**: OWNER의 역할은 변경 불가

### 멤버 제거
```
DELETE /workspaces/:id/members/:memberId
Authorization: Bearer {token}
```

**권한**: OWNER 또는 ADMIN
**제약**: OWNER는 제거 불가

### Owner 이양
```
POST /workspaces/:id/transfer-ownership
Authorization: Bearer {token}
Body: { newOwnerId: string }
```

**권한**: OWNER만 가능
**동작**:
- 새 Owner를 OWNER 역할로 변경
- 기존 Owner를 ADMIN 역할로 변경
- workspace.ownerId 업데이트
- 트랜잭션으로 원자적 처리

**제약**:
- 새 Owner는 워크스페이스 멤버여야 함
- 자기 자신에게는 이양 불가

## 3. 비밀번호 재설정

### 기능

- **대상**: Local 인증 사용자만 가능 (OIDC 사용자 불가)
- **토큰 유효기간**: 1시간
- **토큰 재사용**: 불가 (일회용)

### API Endpoints

#### 비밀번호 재설정 요청
```
POST /auth/forgot-password
Body: { email: string }
```

**응답**:
```json
{
  "mailSent": true  // false if user not found, OIDC user, or mail driver not configured
}
```

보안상 사용자 존재 여부를 노출하지 않음.

#### 토큰 검증
```
GET /auth/verify-reset-token?token={token}
```

**응답**:
```json
{
  "valid": true,
  "email": "user@example.com"
}
```

#### 비밀번호 재설정
```
POST /auth/reset-password
Body: { token: string, newPassword: string }
```

### 워크플로우

1. **재설정 요청**
   - 사용자가 이메일 입력
   - Local 인증 사용자인 경우 재설정 토큰 생성
   - 기존 미사용 토큰은 모두 무효화
   - 이메일 발송 (메일 드라이버 설정 시)

2. **토큰 검증**
   - 프론트엔드에서 토큰 유효성 확인
   - 만료 또는 이미 사용된 토큰인 경우 에러

3. **비밀번호 재설정**
   - 새 비밀번호로 업데이트
   - 토큰을 사용 완료로 표시
   - 트랜잭션으로 원자적 처리

## 4. 마이페이지 (User Profile)

### 프로필 조회
```
GET /auth/me
Authorization: Bearer {token}
```

또는

```
GET /users/me
Authorization: Bearer {token}
```

### 프로필 수정
```
PATCH /users/me
Authorization: Bearer {token}
Body: { name?: string, email?: string, avatar?: string }
```

**제약**:
- OIDC 사용자는 이메일 변경 불가
- 이메일 변경 시 중복 확인

### 참여 중인 워크스페이스 목록
```
GET /users/me/workspaces
Authorization: Bearer {token}
```

**응답**:
```json
[
  {
    "id": "workspace-id",
    "name": "Workspace Name",
    "slug": "workspace-slug",
    "description": "...",
    "owner": { ... },
    "myRole": "MEMBER",
    "joinedAt": "2025-01-01T...",
    "membershipId": "membership-id"
  }
]
```

### 워크스페이스 나가기
```
DELETE /users/me/workspaces/:workspaceId
Authorization: Bearer {token}
```

**제약**:
- OWNER는 나갈 수 없음 (소유권 이양 후 가능)

## Database Schema

### WorkspaceInvitation

```prisma
model WorkspaceInvitation {
  id          String           @id @default(uuid())
  email       String
  role        WorkspaceRole    @default(MEMBER)
  code        String           @unique @default(uuid())
  status      InvitationStatus @default(PENDING)

  workspaceId String
  workspace   Workspace        @relation(...)

  invitedById String
  invitedBy   User             @relation(...)

  expiresAt   DateTime
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@index([email])
  @@index([code])
  @@index([workspaceId])
  @@index([status])
}
```

### PasswordResetToken

```prisma
model PasswordResetToken {
  id        String   @id @default(uuid())
  token     String   @unique @default(uuid())
  isUsed    Boolean  @default(false)

  userId    String
  user      User     @relation(...)

  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([token])
  @@index([userId])
}
```

## 보안 고려사항

1. **초대 코드**: UUID 사용, 추측 불가능
2. **재설정 토큰**: UUID 사용, 일회용, 1시간 만료
3. **이메일 노출 방지**:
   - 비밀번호 재설정 시 사용자 존재 여부 노출 안 함
   - 초대 이메일도 `mailSent` 플래그로만 상태 전달
4. **권한 검증**: 모든 API에서 역할 기반 권한 확인
5. **트랜잭션**: 중요한 작업은 트랜잭션으로 원자성 보장

## Frontend 구현 가이드 (미구현, 향후 작업)

### 필요한 페이지

1. `/workspaces/:id/members` - 멤버 관리 페이지
   - 멤버 목록 표시
   - 초대 목록 표시 (OWNER/ADMIN만, 최상단)
   - 초대 버튼 및 다이얼로그
   - 초대 링크 복사 기능
   - 멤버 역할 변경/제거
   - Owner 이양

2. `/profile` - 마이페이지
   - 프로필 정보 수정
   - 참여 중인 워크스페이스 목록

3. `/profile/invitations` - 받은 초대 목록
   - 초대 수락/거부

4. `/auth/forgot-password` - 비밀번호 찾기
5. `/auth/reset-password?token=xxx` - 비밀번호 재설정
6. `/register?inviteCode=xxx` - 회원가입 (초대 코드 포함)
7. `/invitations/accept?code=xxx` - 초대 수락

### UI/UX 가이드

- **심플한 디자인**: 과도한 박스나 데코레이션 지양
- **초대 링크 복사**: 메일 미발송 시 링크 복사 가능하도록
- **상태 피드백**: 로딩, 성공, 에러 상태 명확히 표시
- **권한별 UI**: 역할에 따라 버튼/메뉴 표시 여부 조정

## 테스트 시나리오

### 초대 워크플로우
1. ✓ OWNER/ADMIN이 멤버 초대
2. ✓ 메일 드라이버 없이 초대 (링크 복사)
3. ✓ 메일 드라이버 있을 때 이메일 발송
4. ✓ 미가입자 초대 → 회원가입 → 자동 수락
5. ✓ 기가입자 초대 → 로그인 → 수락
6. ✓ 중복 초대 처리
7. ✓ 만료된 초대 접근
8. ✓ 이미 멤버인 사람 초대 시 에러

### 멤버 관리
1. ✓ 역할 변경
2. ✓ 멤버 제거
3. ✓ Owner 이양
4. ✓ Owner 역할 변경 시도 (에러)
5. ✓ Owner 제거 시도 (에러)

### 비밀번호 재설정
1. ✓ Local 사용자 재설정
2. ✓ OIDC 사용자 재설정 시도 (막힘)
3. ✓ 만료된 토큰 사용
4. ✓ 이미 사용한 토큰 재사용

### 프로필 관리
1. ✓ 프로필 수정
2. ✓ OIDC 사용자 이메일 변경 시도 (에러)
3. ✓ 워크스페이스 목록 조회
4. ✓ 워크스페이스 나가기
5. ✓ Owner가 나가기 시도 (에러)

## 마이그레이션

```bash
# 데이터베이스 마이그레이션 적용
cd apps/api
pnpm prisma:migrate

# Prisma Client 생성
pnpm prisma:generate
```

## 환경 변수 설정

`.env` 파일에 메일 드라이버 설정 추가 (선택사항):

```env
# 메일 드라이버 선택
MAIL_DRIVER=smtp  # 또는 sendgrid, mailgun

# SMTP 예시
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

메일 설정이 없어도 초대 및 비밀번호 재설정 기능은 작동하며, 링크를 직접 복사하여 사용할 수 있습니다.
