import { LocationId, PuzzleData } from './types';

export const MAX_HINTS = 3;

export const INTRO_TEXT = `
코드 레드. 보안 채널 연결됨.

요원 여러분, 신디케이트의 잔당 '아포스틀'이 존 라크를 고용하여 세계 질서를 위협하고 있습니다.
실종된 핵무기 전문가 닐스 델부룩 박사가 이들에게 플루토늄 코어 3개를 제조할 수 있는 기술을 제공했습니다.

첩보에 따르면 72시간 내에 핵무기가 완성되어 전 세계로 운반될 예정입니다.
당신과 팀원들은 존 라크의 행적을 추적하여 3개의 핵폭탄을 찾아내고 무장해제해야 합니다.

첫 번째 단서는 청와대에서 포착된 신호입니다.
행운을 빕니다. 이 메시지는 5초 후 자동 폭파됩니다.
`;

export const PUZZLES: Record<LocationId, PuzzleData> = {
  [LocationId.BLUE_HOUSE]: {
    id: LocationId.BLUE_HOUSE,
    title: '대한민국 청와대',
    coordinates: '37.5866° N, 126.9748° E',
    description: '청와대에서 지침이 내려왔습니다. 존 라크가 핵탄두를 설치하기 위해 이동한 지역은 아래 암호문의 주인공이 태어난 곳입니다.',
    backgroundImage: 'https://images.unsplash.com/photo-1629633804868-8092496924b2?q=80&w=1920&auto=format&fit=crop', // Blue House feel
    externalLink: 'https://imgur.com/a/PGBAm6u',
    question: '암호를 해독하여 도시 이름을 알아내시오.',
    answer: '샌프란시스코', 
    nextLocationId: LocationId.SAN_FRANCISCO,
    hintContext: `
      [청와대 문제 가이드]
      - 정답: 샌프란시스코 (San Francisco)
      - 인물: 스티브 잡스 (Steve Jobs)
      - 암호 풀이: 알파벳 배열 규칙(S 2개, J 옆에 O 등)을 조합하면 STEVE JOBS가 나옵니다.
      - 힌트 제공 방향: "사람 이름을 찾아내세요. APPLE과 관련이 있습니다. 그가 미국의 어느 도시에서 태어났을까요?" 라고 유도하세요.
    `,
    isBomb: false
  },
  [LocationId.SAN_FRANCISCO]: {
    id: LocationId.SAN_FRANCISCO,
    title: '미국 샌프란시스코',
    coordinates: '37.7749° N, 122.4194° W',
    description: '핵폭탄 A가 감지되었습니다! 스티브 잡스의 고향, 샌프란시스코입니다. 3개의 자물쇠를 모두 풀어야 다음 장소의 단서를 얻을 수 있습니다.',
    backgroundImage: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?q=80&w=1920&auto=format&fit=crop', // Golden Gate Bridge
    subPuzzles: [
      { id: 'codeA-1', title: '보안 코드 A-1', imageUrl: 'https://imgur.com/a/1rEICoz', answer: '1004' },
      { id: 'codeA-2', title: '보안 코드 A-2', imageUrl: 'https://imgur.com/a/lhazuDM', answer: '1782' },
      { id: 'codeA-3', title: '보안 코드 A-3', imageUrl: 'https://imgur.com/a/HN0ylST', answer: '1777' }
    ],
    finalStage: {
      description: "핵폭탄 A 해제를 축하드립니다! \n다음 핵폭탄의 위치 정보는 아래 이미지에 숨겨져 있습니다. \n다음 핵폭탄의 위치를 입력하고 다음 장소로 이동해주세요.",
      imageUrl: "https://imgur.com/a/c91CZU2",
      answer: "프랑스",
      placeholder: "국가 이름"
    },
    question: '3개의 보안 코드를 해독하여 좌표를 입력하시오.',
    answer: '프랑스', 
    nextLocationId: LocationId.FRANCE,
    hintContext: `
      [샌프란시스코(핵폭탄 A) 문제 가이드]
      사용자가 A-1, A-2, A-3 중 어떤 것을 묻는지 파악하고 해당 힌트를 주세요.

      1. A-1 (Code A-1):
         - 정답: 1004
         - 힌트: "키보드 자판의 특수문자(이모티콘) 위치를 확인해보세요. Shift를 누르고 입력하는 숫자입니다."

      2. A-2 (Code A-2):
         - 정답: 1782
         - 힌트: "TV 화면 조정 시간의 컬러바와 매칭되는 숫자를 찾아보세요. 색상 코드를 확인해야 합니다."

      3. A-3 (Code A-3):
         - 정답: 1777
         - 힌트: "이것은 켄켄(KenKen) 퍼즐입니다. 수학자 가우스와 관련된 문제입니다. 출생연도나 생일을 조합해보세요."
    `,
    isBomb: true
  },
  [LocationId.FRANCE]: {
    id: LocationId.FRANCE,
    title: '프랑스 파리',
    coordinates: '48.8566° N, 2.3522° E',
    description: '핵폭탄 B 감지! 프랑스 파리에서 신호가 잡힙니다. 존 라크는 문화적 암호 속에 해제 코드를 숨겨두었습니다.\n\n핵폭탄B코드는 띄어쓰기 없이 소문자로 입력하세요.',
    backgroundImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1920&auto=format&fit=crop', // Eiffel Tower
    subPuzzles: [
      { id: 'codeB-1', title: '보안 코드 B-1', imageUrl: 'https://imgur.com/a/INDznLR', answer: 'ican' },
      { id: 'codeB-2', title: '보안 코드 B-2', imageUrl: 'https://imgur.com/a/jtVUrBP', answer: 'unlock' },
      { 
        id: 'codeB-3', 
        title: '보안 코드 B-3', 
        imageUrl: 'https://imgur.com/a/kt76EKA', 
        answer: 'thecode',
        relatedLink: {
          title: "존 라크의 음성녹음파일",
          url: "https://drive.google.com/file/d/1RdlFBUapdJm-jBOmue1nJVAEwyLdhRWB/view?usp=sharing"
        }
      }
    ],
    finalStage: {
      description: "핵폭탄 B 무력화 성공. 훌륭합니다. \n하지만 아직 끝이 아닙니다. 존 라크의 마지막 행선지가 암호화된 이미지로 발견되었습니다. \n이곳이 어디인지 파악하여 추적을 완료하십시오.",
      imageUrl: "https://imgur.com/a/Gvl8iDE",
      answer: "인천공항",
      placeholder: "공항 이름"
    },
    question: '보안 코드를 모두 해제하고 다음 행선지를 입력하시오.',
    answer: '인천공항',
    nextLocationId: LocationId.INCHEON_AIRPORT,
    hintContext: `
      [프랑스(핵폭탄 B) 문제 가이드]
      사용자가 B-1, B-2, B-3 중 어떤 것을 묻는지 파악하고 해당 힌트를 주세요.

      1. B-1 (Code B-1):
         - 정답: ican
         - 힌트: "트럼프 카드 문양의 이름(Diamond, Heart 등)을 생각하세요. 숫자는 그 단어에서 알파벳의 위치를 의미합니다. 예를 들어 다이아몬드의 2번째 알파벳은..."

      2. B-2 (Code B-2):
         - 정답: unlock
         - 힌트: "스도쿠 퍼즐을 먼저 풀어 빈칸의 숫자를 채우세요. 그 숫자에 해당하는 알파벳을 오른쪽 표에서 찾아 단어로 조합하면 됩니다."

      3. B-3 (Code B-3):
         - 정답: thecode
         - 힌트: "제공된 음성 파일을 잘 들어보세요. 도저히 모르겠다면, 음성을 거꾸로(Reverse) 재생해보세요. 생각의 전환이 필요합니다."
    `,
    isBomb: true
  },
  [LocationId.INCHEON_AIRPORT]: {
    id: LocationId.INCHEON_AIRPORT,
    title: '대한민국 인천공항',
    coordinates: '37.4602° N, 126.4407° E',
    description: '핵폭탄 C 감지! 존 라크가 마지막으로 향한 곳은 인천공항입니다. 출국하려는 그를 막고 마지막 핵폭탄을 해체해야 합니다.',
    backgroundImage: 'https://images.unsplash.com/photo-1531642765602-5cae8bbbf285?q=80&w=1920&auto=format&fit=crop', // Airport feel
    subPuzzles: [
      { id: 'codeC-1', title: '보안 코드 C-1', imageUrl: 'https://imgur.com/a/yhxQJtk', answer: '3031' },
      { id: 'codeC-2', title: '보안 코드 C-2', imageUrl: 'https://imgur.com/a/DPnYw7D', answer: '2010' },
      { id: 'codeC-3', title: '보안 코드 C-3', imageUrl: 'https://imgur.com/a/o63TTrh', answer: '0219' }
    ],
    // Final mission doesn't have a next location, solving sub-puzzles directly wins
    question: '마지막 3개의 보안 코드를 해독하십시오.',
    answer: 'completed', 
    hintContext: `
      [인천공항(핵폭탄 C) 문제 가이드]
      사용자가 C-1, C-2, C-3 중 어떤 것을 묻는지 파악하고 해당 힌트를 주세요.

      1. C-1 (Code C-1):
         - 정답: 3031
         - 힌트: "다이어리의 달력이 찢겨져 있습니다. 6월과 8월의 마지막 날짜가 며칠인지 생각해보세요. 참고로 2월은 28일까지 있는 평년입니다."

      2. C-2 (Code C-2):
         - 정답: 2010
         - 힌트: "한자의 뜻을 해석하는 것이 아닙니다. 글자 안에 있는 네모(ㅁ)의 개수를 세어보세요. 예를 들어 '回'는 네모가 2개입니다."

      3. C-3 (Code C-3):
         - 정답: 0219
         - 힌트: "24절기 중 하나인 '우수'의 날짜를 묻고 있습니다. 보통 2월 중순에 있습니다."
    `,
    isBomb: true
  }
};