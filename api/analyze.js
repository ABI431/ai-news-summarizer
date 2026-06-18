export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method not allowed"
      });
    }
  
    try {
      const { article } = req.body;
  
      const prompt = `
  You are a professional news analyst.
  
  Analyze the article and return ONLY valid JSON.
  Do not include markdown.
  Do not include explanations.
  Do not wrap JSON in triple backticks.
  
  Output format:
  
  {
    "title": "string",
  "category": "string",
  "summary": "string",
  "keywords":["","",""],
  "insight": "string"
    
    

  }
  
  Rules:
  - Summary should contain 3-5 bullet points.
  - Category must be one of:
  Technology, Business, Politics, Sports,
  Entertainment, Science, Health, Other.
  - Keywords should contain 5 important terms.
  - Insight should explain the broader impact.
  
  Article:
  
  ${article}
  `;
  
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ]
          })
        }
      );
  
      const data = await response.json();
  
      if (
        !data.candidates ||
        !data.candidates[0] ||
        !data.candidates[0].content
      ) {
        throw new Error(
          JSON.stringify(data, null, 2)
        );
      }
      
      const text =
        data.candidates[0].content.parts[0].text;
  
      const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
  
        let result;

        try {
          result = JSON.parse(cleaned);
        } catch {
        
          const match = cleaned.match(/\{[\s\S]*\}/);
        
          if (!match) {
            throw new Error("No JSON found in Gemini response");
          }
        
          result = JSON.parse(match[0]);
        }
  
      return res.status(200).json(result);
  
    } catch (err) {
      return res.status(500).json({
        error: err.message
      });
    }
  }