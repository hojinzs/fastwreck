# Coding Conventions (v1)

본 문서는 Quiz of the Day 프로젝트 전반의 코드 스타일 기준을 정의한다.  
React Native / React / NestJS / TypeScript 모든 환경에서 일관된 규칙을 적용한다.

---

## 1. 기본 원칙

- TypeScript 기반으로 개발하며 `any` 사용은 최소화한다.
- 한 함수는 한 가지 책임만 갖도록 설계한다.
- 코드보다 설정/도구(ESLint/Prettier)가 규칙을 강제하도록 한다.
- 코드 리뷰는 로직 중심으로 하고, 스타일 문제는 자동 포맷팅에 맡긴다.

---

## 2. 네이밍 규칙

### 2.1 파일명 규칙

#### 📁 파일 네이밍 기준

| 유형                            | 규칙                            | 예시                                                   |
| ------------------------------- | ------------------------------- | ------------------------------------------------------ |
| **React/React Native 컴포넌트** | **PascalCase**                  | `QuizItem.tsx`, `DailyQuizScreen.tsx`                  |
| **유틸/헬퍼 함수 파일**         | **snake-case**                  | `date-formatter.ts`, `string-utils.ts`                 |
| **서비스 / 클래스 파일**        | **snake-case**                  | `quiz-generator.service.ts`, `user-session.service.ts` |
| **타입/인터페이스 파일**        | **snake-case + .types.ts** 추천 | `quiz.types.ts`, `user-profile.types.ts`               |
| **API 모듈 파일**               | snake-case                      | `quiz-api.ts`, `auth-api.ts`                           |

#### ❗ 표준 예시

- `format-date.ts` ❌ → `date-formatter.ts` ✅
- `QuizList.tsx` ✅
- `quiz-generator.service.ts` ✅

---

### 2.2 코드 내부 네이밍

#### 변수, 함수 → camelCase

```ts
const userId = '123';
function getQuizList() {}
```

#### 클래스명 → PascalCase

```typescript
export class QuizGeneratorService {}
```

#### 상수 → UPPER_SNAKE_CASE

```typescript
export const DAILY_LIMIT = 5;
```

---

## 3. 코드 작성 규칙

### 3.1 Import 순서

1. node_modules
2. 절대 경로 import (@/…)
3. 상대 경로 import (../, ./)

```typescript
import React from 'react';
import { shuffleQuizOptions } from '@/utils/quiz-utils';
import { QuizItem } from '../components/quiz-item';
```

## 4. 예시 코드

### 4.1 유틸 함수 (snake-case)

`date-formatter.ts`

```typescript
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
```

### 4.2 서비스 클래스 (snake-case)

`quiz-generator.service.ts`

```typescript
export class QuizGeneratorService {
  generateDailyQuiz(): string[] {
    return ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'];
  }
}
```

### 4.3 React Native 컴포넌트 (PascalCase)

`QuizItem.tsx`

```tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export type QuizItemProps = {
  question: string;
  options: string[];
  onSelect: (i: number) => void;
};

/**
 * QuizItem 컴포넌트
 * @param question
 * @param options
 * @param onSelect
 * @constructor
 */
export function QuizItem({ question, options, onSelect }: QuizItemProps) {
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 16 }}>{question}</Text>
      {options.map((opt, idx) => (
        <TouchableOpacity key={idx} onPress={() => onSelect(idx)}>
          <Text style={{ padding: 8 }}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

- 어떤 역할을 하는 컴포넌트인지 주석으로 명확히 설명
- Props 타입은 컴포넌트명 + Props 형태로 명명
- Props는 구조 분해 할당으로 받음
- Props 는 기본적으로 export 하여 재사용 가능하도록 함

### 5. ESLint 설정

- eslint 설정은 packages/eslint 폴더 참고, 패키지 루트의 .eslintrc.js에서 확장하여 사용
- 프로젝트 전반에 걸쳐 동일한 ESLint 설정을 사용하여 코드 스타일 일관성 유지

### 6. Prettier 설정

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "singleQuote": true,
  "semi": true,
  "trailingComma": "all",
  "arrowParens": "always",
  "bracketSpacing": true
}
```

- 프로젝트 전반에 걸쳐 동일한 Prettier 설정을 사용하여 코드 포맷팅 일관성 유지
- 자동 포맷팅 도구를 활용하여 코드 스타일 문제 최소화
- 줄 바꿈 길이는 100자로 제한하여 가독성 향상
- IDE 설정에서 저장 시 자동 포맷팅 활성화 **필수**

### 7. 커밋 메시지 컨벤션

커밋 메시지는 Conventional Commits 규칙을 따라 작성하나, 다음 규칙을 커스터마이징한다.

- 제목 끝에는 #12 와 같이 이슈 번호를 가급적 참조한다.
- 모노리포 구조이므로 workspace/module 정보를 포함한다.
- 본문은 필요 시 작성하며, 제목이 핵심 정보를 담도록 한다.
- 제목은 72자 이내로 작성한다.
- (FOR AI Assistant) 이슈 번호를 알 수 없기에, #<issue-number> 형태로 표기한다.

`<type>(<workspace>/<module>): <subject> #<issue-number>`

**type** 목록:

- feat: 새로운 기능 추가
- fix: 버그 수정
- docs: 문서 변경
- refactor: 코드 리팩토링 (기능 변화 없음)
- test: 테스트 코드 추가/수정
- chore: 빌드/환경설정/패키지 관리

**예시:**

- feat(app-v1/auth): implement social login #34
- fix(api-v1/quiz): correct daily quiz generation bug #45
- docs(docs): update coding conventions document #12
- refactor(api-v1): improve quiz generation logic #27
- test(common-types/quiz): add unit tests for quiz utils #50

---

### 8. 추가 자동화 추천

- lint-staged + husky 로 커밋 시 자동 lint/format
- PR 생성 시 CI에서 ESLint + Type Check 수행
