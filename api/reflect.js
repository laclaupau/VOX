
const MODEL = "gemini-3.5-flash-lite";

async function fetchWithRetry(url, options, maxAttempts = 3) {
  const retryableStatuses = [429, 500, 502, 503, 504];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(url, options);

    if (
      !retryableStatuses.includes(response.status) ||
      attempt === maxAttempts
    ) {
      return response;
    }

    const delay = 2000 * attempt;

    console.log(
      `Gemini returned ${response.status}. Retrying in ${delay / 1000}s...`
    );

    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "The AI service is not configured.",
    });
  }

  const {
    action,
    question,
    audio,
    firstAudio,
    secondAudio,
    mimeType = "audio/webm",
    cefrLevel = "B1",
    language = "English",
    subject = "General",
  } = req.body || {};

  const validMimeTypes = [
    "audio/webm",
    "audio/ogg",
    "audio/mp4",
    "audio/mpeg",
    "audio/wav",
  ];

  if (!validMimeTypes.includes(mimeType)) {
    return res.status(400).json({
      error: "Unsupported audio format.",
    });
  }

  const isValidAudio = (value) =>
    typeof value === "string" &&
    value.length > 100 &&
    value.length <= 4_000_000 &&
    /^[A-Za-z0-9+/]+={0,2}$/.test(value);

  if (
    typeof question !== "string" ||
    !question.trim() ||
    question.length > 1000
  ) {
    return res.status(400).json({
      error: "Please provide the activity question.",
    });
  }

  let prompt;
  let audioParts;

  if (action === "analyze") {
    if (!isValidAudio(audio)) {
      return res.status(400).json({
        error: "Please provide a valid first recording.",
      });
    }


    prompt = `
You are VOX, an educational oral-feedback companion.

Analyze the attached AUDIO RECORDING directly.
The audio is the PRIMARY and ONLY evidence of the student's
actual oral contribution.

ACTIVITY QUESTION:
${question}

SUBJECT:
${subject}

LANGUAGE:
${language}

CEFR LEVEL:
${cefrLevel}

CRITICAL: ACCURATE UNDERSTANDING COMES FIRST.

Before giving feedback, perform these steps internally:

STEP 1 — IDENTIFY WHAT THE STUDENT ACTUALLY SAID.
- Carefully identify the student's main position or interpretation.
- Distinguish the student's position from the question, examples,
  hypothetical ideas, and opposing viewpoints they may mention.
- Do not assume the student agrees with the statement in the prompt.
- Do not complete missing ideas or infer an unstated opinion.
- If possible, identify a short exact phrase from the recording
  that supports your interpretation.

STEP 2 — VERIFY YOUR INTERPRETATION.
- Check that the identified position is consistent with the
  student's actual words.
- If the audio does not support a clear interpretation,
  explicitly state that the position is unclear.
- Never replace an unclear or unexpected position with a
  more conventional or likely answer.
- If you cannot confidently identify the position, do not
  generate feedback that assumes one.

STEP 3 — GIVE FEEDBACK.
Base every observation on the recording.
Do not invent arguments, examples, evidence, or pronunciation errors.

Consider:

1. THINKING AND CONTENT
- Position or interpretation expressed.
- Reasons, examples and evidence.
- Connections and alternative perspectives.
- Relevance to the activity.

2. ORGANIZATION AND CLARITY
- How clearly ideas are communicated.
- How ideas are connected and developed.

3. ORAL COMMUNICATION AND INTELLIGIBILITY
- Understandability of speech.
- Articulation, rhythm, pauses, pronunciation, volume or fluency
  ONLY when audible and relevant to comprehension.
- Never treat an accent or regional variety as an error.
- A pause is not automatically a problem.

IMPORTANT RULES:
- Do not confuse the student's position with the opposite position.
- Do not evaluate an argument the student did not make.
- Do not let pronunciation dominate the evaluation of thinking.
- Adapt language to CEFR ${cefrLevel}.
- Keep the intellectual challenge unchanged.
- Be supportive, specific and constructive.
- Do not grade or assign a score.
- If the recording is too unclear to assess, say so honestly.

If the student's position is unclear, the next question must
ask them to clarify their actual position rather than assume it.

Respond in ${language === "Spanish" ? "Spanish" : "English"}.

Return ONLY valid JSON:

{
  "status": "ready",
  "transcription": "A concise, faithful transcription of the relevant spoken ideas.",
  "identifiedPosition": "The position the student actually expressed, or explicitly unclear.",
  "positionConfidence": "high | medium | low",
  "evidence": ["A short phrase or specific audible evidence supporting the interpretation."],
  "strengths": ["Specific strength supported by the recording."],
  "development": ["Specific aspect to develop, supported by the recording."],
  "oralCommunication": ["Audible communication observation, if relevant."],
  "nextQuestion": "One specific follow-up question.",
  "nextStep": "One practical suggestion for the next attempt."
}

If confidence is low, do not present an inferred position as fact.
Use empty arrays when no observation is supported by the audio.
`;


    audioParts = [
      {
        inlineData: {
          mimeType,
          data: audio,
        },
      },
    ];
  } else if (action === "compare") {
    if (!isValidAudio(firstAudio) || !isValidAudio(secondAudio)) {
      return res.status(400).json({
        error: "Both recordings are required for comparison.",
      });
    }

    prompt = `
You are VOX, an educational oral-learning companion.

You will receive TWO recordings from the SAME student.
Compare them carefully.

FIRST RECORDING:
The student's initial oral contribution.

SECOND RECORDING:
The student's revised oral contribution after receiving feedback.

ACTIVITY QUESTION:
${question}

SUBJECT:
${subject}

LANGUAGE:
${language}

CEFR LEVEL:
${cefrLevel}

Compare the recordings using these dimensions:

1. THINKING AND CONTENT
- Development of ideas.
- Reasons, examples and evidence.
- Interpretation and relevance.
- Connections and alternative perspectives.

2. ORGANIZATION AND CLARITY
- Structure and connection between ideas.
- How clearly the contribution communicates its meaning.

3. ORAL COMMUNICATION AND INTELLIGIBILITY
- Understandability of the speech.
- Articulation, rhythm, pauses, pronunciation, volume
  or fluency ONLY when audible and relevant to comprehension.

STRICT EVIDENCE RULES:
- Report only changes that can be heard in the recordings.
- Never invent progress.
- Do not assume the second recording is better.
- Explicitly identify when there is no significant change.
- If an aspect cannot be assessed, say so.
- Distinguish a change in ideas from a change in delivery.
- Do not treat accent or regional pronunciation as an error.
- Do not interpret pauses automatically as mistakes.
- Do not penalize the student for using simpler language.
- Keep the intellectual challenge unchanged.
- Adapt your feedback language to CEFR ${cefrLevel}.
- Never grade or assign a score.

Respond in ${language === "Spanish" ? "Spanish" : "English"}.

Return ONLY valid JSON:

{
  "overallChange": "A concise evidence-based comparison.",
  "thinkingChanges": ["observable change in thinking"],
  "communicationChanges": ["observable change in oral communication"],
  "maintainedStrengths": ["strength maintained across attempts"],
  "stillToDevelop": ["aspect that remains to be developed"],
  "nextStep": "one useful suggestion for future participation",
  "conclusion": "progress | no_significant_change | insufficient_evidence"
}

Do not claim progress unless the recordings support it.
Use empty arrays when no change or observation can be established.
`;

    audioParts = [
      {
        inlineData: {
          mimeType,
          data: firstAudio,
        },
      },
      {
        inlineData: {
          mimeType,
          data: secondAudio,
        },
      },
    ];
  } else {
    return res.status(400).json({
      error: "Invalid action. Use analyze or compare.",
    });
  }


  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

    // STEP 1: TRANSCRIBE THE AUDIO
    const transcriptionResponse = await fetchWithRetry(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `
Transcribe the attached audio recording as accurately as possible.

Rules:
- Write only words that you can actually hear.
- Preserve the student's original language.
- Do not translate, summarize, correct grammar or improve sentences.
- Do not complete unfinished sentences.
- Do not infer missing words from context.
- Mark genuinely unintelligible sections as [unclear].
- Preserve negations, contrasts and expressions of disagreement.
- Do not confuse the activity question with the student's answer.

Return only the transcription. No comments or evaluation.
`,
              },
              {
                inlineData: {
                  mimeType,
                  data: audio,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 1500,
        },
      }),
    });

    const transcriptionData = await transcriptionResponse.json();

    if (!transcriptionResponse.ok) {
      console.error(
        "Gemini transcription error:",
        transcriptionResponse.status,
        JSON.stringify(transcriptionData.error || transcriptionData)
      );

      return res.status(502).json({
        error: "The audio transcription could not be completed.",
        details: transcriptionData.error?.message || "Unknown Gemini error.",
      });
    }

    const transcription = transcriptionData.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!transcription) {
      return res.status(502).json({
        error: "Gemini could not transcribe the recording.",
      });
    }

    // STEP 2: ANALYZE THE TRANSCRIPTION
    let analysisPrompt;

    if (action === "analyze") {

      analysisPrompt = `
You are VOX, an educational oral-feedback companion.

Your role is to help students develop their thinking and communicate their ideas more effectively. You are not an examiner. Give specific, constructive and evidence-based feedback.

Analyze the student's oral contribution using the transcription below.

ACTIVITY QUESTION:
${question}

SUBJECT:
${subject}

LANGUAGE:
${language}

CEFR LEVEL:
${cefrLevel}

STUDENT TRANSCRIPTION:
"""
${transcription}
"""

CRITICAL INTERPRETATION RULES:

1. Identify the student's actual position.
- Do not assume they agree with the question.
- Distinguish their own position from opposing views they mention.
- Pay special attention to negations, contrasts and qualifications.
- Never infer a position that is not supported by the transcription.

2. Evidence:
- Every interpretation must be supported by exact words from the transcription.
- Evidence must be copied verbatim.
- Never invent quotations or rewrite them as if they were exact words.
- If the transcription does not support an interpretation, say so.

3. Recognize what the student has ALREADY achieved:
- Before suggesting an improvement, identify whether the student has already included the relevant element.
- A short statement can contain a valid reason, argument or example.
- Do not tell students to add a reason if they have already provided one.
- Do not tell students to give an example if they have already provided one.
- If an idea is present but insufficiently developed, acknowledge it first and suggest how to expand, explain or illustrate it.
- For example, if the student says "because there is no planet B", recognize this as a reason. Suggest explaining its implications or providing a concrete example, rather than asking for a reason.
- Never mistake a concise contribution for an absence of reasoning.

4. Feedback:
- Evaluate the development of ideas, reasons, examples and perspectives.
- Evaluate organization and clarity.
- Distinguish between:
  a) something that is missing;
  b) something that is present but could be developed further;
  c) something that is already effective.
- Make suggestions specific to this student's actual contribution.
- Refer to the student's own words whenever possible.
- Avoid generic advice that could apply to any answer.
- Do not make the student repeat something they have already said.
- Do not invent errors or arguments.
- Do not grade or assign a score.
- Adapt feedback language to CEFR ${cefrLevel}.
- Keep the intellectual challenge unchanged.

5. Oral communication:
- This analysis is based on a transcription.
- Do not make claims about pronunciation, rhythm, pauses, volume, fluency or intelligibility based on text alone.
- Return an empty oralCommunication array because these features have not been assessed in this step.

6. If the student's position is unclear:
- Set positionConfidence to "low".
- Explicitly state that the position cannot be identified confidently.
- Do not give feedback based on an assumed position.
- Ask the student to clarify what they meant.

7. Next question:
- Ask ONE relevant question that builds directly on the student's actual contribution.
- Do not ask a question that simply repeats the activity question.
- Encourage deeper reasoning, an example, a consequence, a connection or an alternative perspective, depending on what is missing or could be developed.
- Do not ask for something the student has already provided.

8. Next step:
- Give ONE practical suggestion for the student's next oral attempt.
- It must address the most useful next improvement, not list several unrelated goals.
- Make it achievable at the student's CEFR level.

Respond in ${language === "Spanish" ? "Spanish" : "English"}.

Return ONLY valid JSON:

{
  "identifiedPosition": "The student's actual position, or an explicit statement that it is unclear.",
  "positionConfidence": "high | medium | low",
  "evidence": ["Exact quotation copied from the transcription."],
  "strengths": ["Specific strength supported by the transcription."],
  "development": ["Specific aspect to develop, acknowledging what the student has already achieved."],
  "oralCommunication": [],
  "nextQuestion": "One relevant follow-up question.",
  "nextStep": "One practical suggestion for the next attempt."
}

Use empty arrays only when no observation is supported by the transcription.
If confidence is low, strengths and development must not assume a position.
`;

    } else {
      analysisPrompt = `
You are VOX, an educational oral-learning companion.

Compare the student's TWO oral recordings.

ACTIVITY QUESTION:
${question}

SUBJECT:
${subject}

LANGUAGE:
${language}

CEFR LEVEL:
${cefrLevel}

FIRST RECORDING TRANSCRIPTION:
"""
${transcription}
"""

The second recording must also be transcribed before comparison.
Do not infer changes without comparing both actual transcriptions.

Return a JSON response explaining that this comparison action
requires both recordings to be transcribed and analyzed.
`;
      return res.status(400).json({
        error: "The comparison flow requires its own transcription step. We will implement it separately.",
      });
    }

    const analysisResponse = await fetchWithRetry(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: analysisPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 1500,
          responseMimeType: "application/json",
        },
      }),
    });

    const analysisData = await analysisResponse.json();

    if (!analysisResponse.ok) {
      console.error(
        "Gemini analysis error:",
        analysisResponse.status,
        JSON.stringify(analysisData.error || analysisData)
      );

      return res.status(502).json({
        error: "The AI service could not analyse the transcription.",
        details: analysisData.error?.message || "Unknown Gemini error.",
      });
    }

    const resultText = analysisData.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!resultText) {
      return res.status(502).json({
        error: "The AI returned an empty analysis.",
      });
    }

    const result = JSON.parse(resultText);

    const valid =
      typeof result.identifiedPosition === "string" &&
      ["high", "medium", "low"].includes(result.positionConfidence) &&
      Array.isArray(result.evidence) &&
      Array.isArray(result.strengths) &&
      Array.isArray(result.development) &&
      Array.isArray(result.oralCommunication) &&
      typeof result.nextQuestion === "string" &&
      typeof result.nextStep === "string";

    if (!valid) {
      throw new Error("Invalid analysis response.");
    }

    return res.status(200).json({
      result: {
        ...result,
        transcription,
      },
    });

  } catch (error) {
    console.error("VOX audio analysis error:", error.message);

    return res.status(502).json({
      error: "Something went wrong while analysing the audio.",
    });
  }

}
