import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getPuzzleHint = async (context: string, userQuery: string): Promise<string> => {
  try {
    const systemInstruction = `
      당신은 IMF(Impossible Missions Force)의 베테랑 본부 통신관입니다.
      현재 현장 요원(사용자)들이 핵무기를 해체하거나 다음 장소를 찾기 위해 퍼즐을 풀고 있습니다.
      
      [현재 작전 구역 정보 및 정답 가이드]
      ${context}
      
      [당신의 역할과 행동 수칙]
      1. 사용자의 질문("${userQuery}")을 분석하여, 위 가이드 중 어떤 문제(A-1, B-2 등)에 대한 힌트인지 파악하십시오.
      2. 사용자가 특정 문제를 지칭하지 않았다면, 어떤 문제가 막혔는지 먼저 물어보거나 전반적인 힌트를 주십시오.
      3. **절대 정답을 직접 말하지 마십시오.** (예: "정답은 1234다" 금지)
      4. 위 가이드에 적힌 "힌트" 내용을 바탕으로 자연스럽게 돌려서 말해주십시오.
      5. 말투는 다급하고 전문적인 첩보 요원처럼 하십시오. (예: "요원! 내 데이터를 확인해보니...", "시간이 없다, 잘 듣게.")
      6. 답변은 한국어로, 100자 이내로 핵심만 전달하십시오.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userQuery || "도움이 필요합니다.",
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "통신 잡음 발생. 다시 요청바람.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "보안 채널 접속 불가. 시스템 오프라인.";
  }
};

export const generateMissionImage = async (description: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `Create a highly detailed, cinematic, and realistic image depicting a spy thriller scene based on the following description. The style should be dark, moody, and high-tech, like a Mission Impossible movie scene. Description: ${description}` }],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        }
      }
    });
    
    // Iterate through parts to find the image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    return null;
  }
};