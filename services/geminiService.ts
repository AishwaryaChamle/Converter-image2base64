
import { GoogleGenAI, Type } from "@google/genai";

const AI_MODEL = 'gemini-3-flash-preview';

export async function extractTextFromBuffer(
  base64Data: string | { pageNumber: number; base64: string }[],
  mimeType: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts: any[] = [];

  if (Array.isArray(base64Data)) {
    // Multi-page PDF
    base64Data.forEach(p => {
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: p.base64
        }
      });
    });
  } else {
    // Single image or PDF
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: base64Data
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: {
        parts: [
          ...parts,
          {
            text: `Extract information from this document and return it in the specified JSON format. 
            
            Follow these strict rules for the JSON response:
            - If any extracted value is in a language other than English, translate it into English and store ONLY the translated English text.
            - If a field is NOT present in the document at all, completely OMIT that parameter from the JSON.
            - If a field IS present in the document (visually displayed) but you fail to extract its value, include the parameter and set its value explicitly to null.
            - If a field has a valid extracted value, include the parameter with that value.
            - Do not include any parameter in the JSON if its value is null and it is NOT visible in the document.
            - Only include parameters that either have a valid extracted value, or are visible in the document but extraction failed (set as null).
            
            Fields to look for in 'document_details': 
            - name, date_of_birth, address, nic_no, nic_issue_date, dl_no, dl_issue_date, dl_expiry_date, 
              passport_no, passport_issue_date, passport_expiry_date, place_of_birth, id_no.
            
            The 'document_data' field should be set to '{{image_data}}'.
            
            Return ONLY the JSON.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            document_category: { type: Type.STRING },
            document_details: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                date_of_birth: { type: Type.STRING },
                address: { type: Type.STRING },
                nic_no: { type: Type.STRING },
                nic_issue_date: { type: Type.STRING },
                dl_no: { type: Type.STRING },
                dl_issue_date: { type: Type.STRING },
                dl_expiry_date: { type: Type.STRING },
                passport_no: { type: Type.STRING },
                passport_issue_date: { type: Type.STRING },
                passport_expiry_date: { type: Type.STRING },
                place_of_birth: { type: Type.STRING },
                id_no: { type: Type.STRING }
              }
            },
            document_data: { type: Type.STRING },
            reference_image: { type: Type.STRING },
            actual_image: { type: Type.STRING }
          },
          required: ["document_category", "document_details"]
        }
      }
    });

    return response.text || "{}";
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw new Error("Failed to extract text using AI.");
  }
}
