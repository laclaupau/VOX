

const MODEL = "gemini-3.5-flash-lite";

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;



const VALID_MIME_TYPES = [

  "audio/webm",

  "audio/ogg",

  "audio/mp4",

  "audio/mpeg",

  "audio/wav",

];



const MAX_AUDIO_BASE64_LENGTH = 3_600_000;



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



    await new Promise((resolve) =>

      setTimeout(resolve, 1500 * attempt)

    );

  }



  throw new Error("Gemini request failed.");

}



function isValidAudio(value) {

  return (

    typeof value === "string" &&

    value.length > 100 &&

    value.length <= MAX_AUDIO_BASE64_LENGTH &&

    /^[A-Za-z0-9+/]+={0,2}$/.test(value)

  );

}



function normalizeText(value) {

  return String(value || "")

    .normalize("NFD")

    .replace(/[\u0300-\u036f]/g, "")

    .toLowerCase()

    .replace(/[^\p{L}\p{N}]+/gu, " ")

    .trim()

    .replace(/\s+/g, " ");

}



function quoteExists(quote, transcript) {

  if (

    typeof quote !== "string" ||

    !quote.trim() ||

    typeof transcript !== "string"

  ) {

    return false;

  }



  const normalizedQuote = normalizeText(quote);

  const normalizedTranscript = normalizeText(transcript);



  // Very short quotations are not reliable evidence.

  if (normalizedQuote.split(" ").length < 3) {

    return false;

  }



  return normalizedTranscript.includes(normalizedQuote);

}



function cleanEvidenceItems(items, transcript) {

  if (!Array.isArray(items)) return [];



  return items

    .filter(

      (item) =>

        item &&

        typeof item.claim === "string" &&

        item.claim.trim() &&

        quoteExists(item.evidence, transcript)

    )

    .map((item) => item.claim.trim());

}



function cleanComparisonItems(items, firstTranscript, secondTranscript) {

  if (!Array.isArray(items)) return [];



  return items

    .filter(

      (item) =>

        item &&

        typeof item.claim === "string" &&

        item.claim.trim() &&

        quoteExists(item.firstEvidence, firstTranscript) &&

        quoteExists(item.secondEvidence, secondTranscript)

    )

    .map((item) => item.claim.trim());

}



async function callGemini(apiKey, parts, maxOutputTokens = 1800) {

  const response = await fetchWithRetry(GEMINI_URL, {

    method: "POST",

    headers: {

      "Content-Type": "application/json",

      "x-goog-api-key": apiKey,

    },

    body: JSON.stringify({

      contents: [

        {

          parts,

        },

      ],

      generationConfig: {

        temperature: 0,

        maxOutputTokens,

        responseMimeType: "application/json",

      },

    }),

  });



  const data = await response.json();



  if (!response.ok) {

    console.error(

      "Gemini API error:",

      response.status,

      JSON.stringify(data.error || data)

    );



    throw new Error(

      data.error?.message || "The AI service could not complete the request."

    );

  }



  const text = data.candidates?.[0]?.content?.parts

    ?.map((part) => part.text || "")

    .join("")

    .trim();



  if (!text) {

    throw new Error("Gemini returned an empty response.");

  }



  try {

    return JSON.parse(text);

  } catch {

    console.error("Gemini returned invalid JSON:", text);

    throw new Error("The AI returned an invalid response.");

  }

}



async function transcribeAudio(apiKey, audio, mimeType) {

  const result = await callGemini(

    apiKey,

    [

      {

        text: `

Transcribe the attached audio recording as accurately as possible.



STRICT RULES:

- Write only words that you can actually hear.

- Preserve the original language.

- Do not translate, summarize, correct grammar or improve sentences.

- Do not complete unfinished sentences.

- Do not infer missing words from context.

- Mark genuinely unintelligible sections as [unclear].

- Preserve negations, contrasts and expressions of disagreement.

- Do not include the activity question as if it were spoken by the student.

- Do not evaluate the student.



Return JSON in this exact format:

{

  "transcription": "The words actually heard in the recording."

}



If there is no intelligible speech, return an empty transcription.

`,

      },

      {

        inlineData: {

          mimeType,

          data: audio,

        },

      },

    ],

    1800

  );



  if (typeof result.transcription !== "string") {

    throw new Error("The transcription could not be read.");

  }



  return result.transcription.trim();

}



function getAnalysisPrompt({

  question,

  subject,

  language,

  cefrLevel,

  transcription,

}) {

  return `

You are VOX, an educational oral-learning companion.



Your purpose is to help students develop their thinking and communicate

their ideas. You are not an examiner. Do not grade or assign scores.



ACTIVITY QUESTION:

${question}



SUBJECT:

${subject}



ACTIVITY LANGUAGE:

${language}



CEFR LEVEL:

${cefrLevel}



STUDENT TRANSCRIPTION:

"""

${transcription}

"""



YOUR FIRST TASK: DETERMINE RELEVANCE.



Decide whether the student's actual contribution addresses the activity.



Use:

- "relevant" if the contribution clearly addresses the question or task.

- "off_topic" if the contribution does not meaningfully address it.

- "unclear" if there is not enough intelligible information to decide.



Do not force an interpretation.

Do not invent a connection between unrelated content and the activity.

Do not assume that the student agrees with the question.

Pay special attention to negations, contrasts and qualifications.



EVIDENCE RULES:



Every strength and every development suggestion must be supported

by a short, exact quotation copied from the transcription.



The quotation must:

- Contain words that actually appear in the transcription.

- Be copied without paraphrasing.

- Support the claim being made.



Never invent quotations.

Never claim that the student provided a reason, example, argument

or perspective unless the transcription contains it.



A concise contribution can contain valid reasoning.

Do not mistake brevity for lack of thought.



FEEDBACK RULES:



If relevance is "off_topic":

- Do not invent strengths about the activity's content.

- Do not pretend the student answered the question.

- Explain briefly that the contribution does not address the challenge.

- Ask one neutral question that helps the student return to the task.

- Do not criticize the student's unrelated topic.



If relevance is "unclear":

- Say that there is not enough information to understand the contribution.

- Do not infer the student's position.

- Ask the student to clarify what they meant.



If relevance is "relevant":

- Identify the student's actual position or interpretation.

- Recognize what the student has already achieved.

- Distinguish between something missing and something present

  but capable of further development.

- Give only specific suggestions that follow from the actual words.

- Do not ask for something the student has already provided.



NEXT QUESTION:

Ask one question that builds on the student's actual contribution.

Do not simply repeat the activity question.



NEXT STEP:

Give one practical, achievable suggestion for the next attempt.



ORAL COMMUNICATION:

This step evaluates the transcription, not the audio delivery.

Do not make claims about pronunciation, accent, rhythm, pauses,

volume, fluency or intelligibility.

Return an empty oralCommunication array.



LANGUAGE:

Write all feedback in ${language}.

Do not switch languages.

Adapt vocabulary and complexity to CEFR ${cefrLevel} when the

activity is in English. Do not simplify the intellectual challenge.



Return ONLY valid JSON with this structure:

{

  "relevance": "relevant | off_topic | unclear",

  "identifiedPosition": "The student's actual position, or an honest statement that it is unclear.",

  "positionEvidence": "An exact quotation supporting the identified position, or an empty string.",

  "positionConfidence": "high | medium | low",

  "strengths": [

    {

      "claim": "A specific strength.",

      "evidence": "An exact quotation from the transcription."

    }

  ],

  "development": [

    {

      "claim": "A specific development suggestion.",

      "evidence": "An exact quotation from the transcription."

    }

  ],

  "oralCommunication": [],

  "nextQuestion": "One relevant question.",

  "nextStep": "One practical suggestion.",

  "message": "A short explanation if the contribution is off-topic or unclear. Otherwise an empty string."

}



If relevance is "off_topic" or "unclear", use empty strengths and development arrays.

If no evidence supports a claim, do not include that claim.

`;

}



function getComparisonPrompt({

  question,

  subject,

  language,

  cefrLevel,

  firstTranscript,

  secondTranscript,

}) {

  return `

You are VOX, an educational oral-learning companion.



Compare TWO contributions from the SAME student.

The second contribution was recorded after the student received feedback.



ACTIVITY QUESTION:

${question}



SUBJECT:

${subject}



ACTIVITY LANGUAGE:

${language}



CEFR LEVEL:

${cefrLevel}



FIRST TRANSCRIPTION:

"""

${firstTranscript}

"""



SECOND TRANSCRIPTION:

"""

${secondTranscript}

"""



YOUR TASK:



Compare what the student actually said in both recordings.

Do not assume that the second attempt is better.



A longer answer is not automatically an improvement.

More words, repetition or a different topic are not evidence of progress.

A simpler answer is not automatically worse.



RELEVANCE:

Determine whether each contribution addresses the activity.

Do not invent a connection between unrelated content and the question.



EVIDENCE REQUIREMENTS:



Every comparison claim MUST include:

- firstEvidence: an exact quotation from the first transcription.

- secondEvidence: an exact quotation from the second transcription.



Both quotations must contain at least three words and must be copied

exactly from their respective transcriptions.



Only report a change when BOTH quotations support the comparison.

Do not invent progress.

Do not compare an idea that is absent from one recording.

Do not treat a different wording as deeper reasoning unless the

actual content supports that interpretation.



Compare:

1. Development of ideas and reasoning.

2. Use of examples or evidence.

3. Interpretation and relevance.

4. Connections or alternative perspectives.

5. Clarity and organization of ideas.



Do not evaluate pronunciation, pauses, rhythm, accent, volume,

fluency or other audio characteristics from a transcription.

Return an empty oralCommunication array.



POSSIBLE CONCLUSIONS:

- "progress": at least one meaningful improvement is supported

  by evidence from both recordings.

- "no_significant_change": the recordings do not show a meaningful

  improvement in the aspects assessed.

- "insufficient_evidence": one or both recordings are too unclear,

  too short or too unrelated to establish a fair comparison.



Do not use "progress" merely because the second answer is longer.



LANGUAGE:

Write all feedback in ${language}.

Adapt complexity to CEFR ${cefrLevel} when the activity is in English.

Do not switch languages.



Return ONLY valid JSON:

{

  "firstRelevance": "relevant | off_topic | unclear",

  "secondRelevance": "relevant | off_topic | unclear",

  "conclusion": "progress | no_significant_change | insufficient_evidence",

  "changes": [

    {

      "claim": "A specific meaningful change.",

      "firstEvidence": "Exact quotation from the first transcription.",

      "secondEvidence": "Exact quotation from the second transcription."

    }

  ],

  "reasoning": [

    {

      "claim": "A comparison of the student's reasoning.",

      "firstEvidence": "Exact quotation from the first transcription.",

      "secondEvidence": "Exact quotation from the second transcription."

    }

  ],

  "pending": [

    {

      "claim": "An aspect that remains to be developed, supported by both attempts.",

      "firstEvidence": "Exact quotation from the first transcription.",

      "secondEvidence": "Exact quotation from the second transcription."

    }

  ],

  "oralCommunication": [],

  "nextStep": "One practical suggestion based on the comparison.",

  "message": "A concise, honest summary of the comparison."

}



If you cannot support a comparison with quotations from BOTH recordings,

do not include it.

`;

}



async function analyzeRecording(apiKey, {

  audio,

  mimeType,

  question,

  subject,

  language,

  cefrLevel,

}) {

  const transcription = await transcribeAudio(apiKey, audio, mimeType);



  if (!transcription || normalizeText(transcription).length < 3) {

    return {

      transcription,

      result: {

        identifiedPosition:

          language === "Spanish"

            ? "No se pudo identificar una intervención oral comprensible."

            : "No intelligible oral contribution could be identified.",

        positionConfidence: "low",

        evidence: [],

        strengths: [],

        development: [],

        oralCommunication: [],

        nextQuestion:

          language === "Spanish"

            ? "¿Podés volver a expresar tu idea?"

            : "Could you try expressing your idea again?",

        nextStep:

          language === "Spanish"

            ? "Grabá nuevamente tu respuesta."

            : "Please record your response again.",

        message:

          language === "Spanish"

            ? "No se pudo obtener una transcripción comprensible."

            : "A comprehensible transcription could not be obtained.",

        transcription,

      },

    };

  }



  const analysis = await callGemini(

    apiKey,

    [

      {

        text: getAnalysisPrompt({

          question,

          subject,

          language,

          cefrLevel,

          transcription,

        }),

      },

    ]

  );



  const relevance = ["relevant", "off_topic", "unclear"].includes(

    analysis.relevance

  )

    ? analysis.relevance

    : "unclear";



  const positionEvidence = quoteExists(

    analysis.positionEvidence,

    transcription

  )

    ? analysis.positionEvidence

    : "";



  const positionConfidence = positionEvidence

    ? ["high", "medium", "low"].includes(analysis.positionConfidence)

      ? analysis.positionConfidence

      : "medium"

    : "low";



  const canEvaluateContent = relevance === "relevant";



  const strengths = canEvaluateContent

    ? cleanEvidenceItems(analysis.strengths, transcription)

    : [];



  const development = canEvaluateContent

    ? cleanEvidenceItems(analysis.development, transcription)

    : [];



  const evidence = positionEvidence ? [positionEvidence] : [];



  const result = {

    identifiedPosition:

      positionEvidence && typeof analysis.identifiedPosition === "string"

        ? analysis.identifiedPosition

        : language === "Spanish"

          ? "No se pudo identificar una postura con suficiente evidencia."

          : "A position could not be identified with sufficient evidence.",



    positionConfidence,



    evidence,

    strengths,

    development,



    // Delivery characteristics are not assessed from a transcript.

    oralCommunication: [],



    nextQuestion:

      typeof analysis.nextQuestion === "string"

        ? analysis.nextQuestion

        : "",



    nextStep:

      typeof analysis.nextStep === "string"

        ? analysis.nextStep

        : "",



    message:

      typeof analysis.message === "string"

        ? analysis.message

        : "",



    transcription,

  };



  if (relevance !== "relevant") {

    result.strengths = [];

    result.development = [];

    result.evidence = [];

  }



  return {

    transcription,

    result,

  };

}



async function compareRecordings(apiKey, {

  firstTranscript,

  secondAudio,

  mimeType,

  question,

  subject,

  language,

  cefrLevel,

}) {

  // Reuse the transcript already generated during the first analysis.
  const secondTranscript = await transcribeAudio(

    apiKey,

    secondAudio,

    mimeType

  );



  if (

    normalizeText(firstTranscript).length < 3 ||

    normalizeText(secondTranscript).length < 3

  ) {

    return {

      changes: [],

      reasoning: [],

      pending: [],

      oralCommunication: [],

      nextStep:

        language === "Spanish"

          ? "Intentá realizar ambas intervenciones nuevamente para poder compararlas."

          : "Try recording both contributions again so they can be compared.",

      message:

        language === "Spanish"

          ? "No hay suficiente información comprensible en ambas grabaciones para realizar una comparación."

          : "There is not enough intelligible information in both recordings to make a comparison.",

      conclusion: "insufficient_evidence",

      evidence: [],

      transcriptions: {
        first: firstTranscript,
        second: secondTranscript,
      },

    };

  }



  const analysis = await callGemini(

    apiKey,

    [

      {

        text: getComparisonPrompt({

          question,

          subject,

          language,

          cefrLevel,

          firstTranscript,

          secondTranscript,

        }),

      },

    ],

    2200

  );



  const changes = cleanComparisonItems(

    analysis.changes,

    firstTranscript,

    secondTranscript

  );



  const reasoning = cleanComparisonItems(

    analysis.reasoning,

    firstTranscript,

    secondTranscript

  );



  const pending = cleanComparisonItems(

    analysis.pending,

    firstTranscript,

    secondTranscript

  );



  const firstRelevance = ["relevant", "off_topic", "unclear"].includes(
    analysis.firstRelevance
  )
    ? analysis.firstRelevance
    : "unclear";

  const secondRelevance = ["relevant", "off_topic", "unclear"].includes(
    analysis.secondRelevance
  )
    ? analysis.secondRelevance
    : "unclear";

  let conclusion = [
    "progress",
    "no_significant_change",
    "insufficient_evidence",
  ].includes(analysis.conclusion)
    ? analysis.conclusion
    : "insufficient_evidence";

  // A fair comparison requires BOTH attempts to address the activity.
  if (firstRelevance !== "relevant" || secondRelevance !== "relevant") {
    conclusion = "insufficient_evidence";
    changes.length = 0;
    reasoning.length = 0;
    pending.length = 0;
  }

  // Progress requires at least one validated, meaningful change.
  if (conclusion === "progress" && changes.length === 0) {
    conclusion = "no_significant_change";
  }

  const evidence = [];



  if (
    firstRelevance === "relevant" &&
    secondRelevance === "relevant" &&
    Array.isArray(analysis.changes)
  ) {

    for (const item of analysis.changes) {

      if (

        quoteExists(item?.firstEvidence, firstTranscript) &&

        quoteExists(item?.secondEvidence, secondTranscript)

      ) {

        evidence.push(

          language === "Spanish"

            ? `Primer intento: "${item.firstEvidence}" / Segundo intento: "${item.secondEvidence}"`

            : `First attempt: "${item.firstEvidence}" / Second attempt: "${item.secondEvidence}"`

        );

      }

    }

  }



  let message =

    typeof analysis.message === "string" ? analysis.message : "";



  if (conclusion === "no_significant_change" && changes.length === 0) {

    message =

      language === "Spanish"

        ? "No encontramos evidencia suficiente de un cambio significativo entre los dos intentos. Esto no significa que hayas empeorado: significa que no podemos afirmar una mejora con estas grabaciones."

        : "There is not enough evidence of a significant change between the two attempts. This does not mean you did worse; it means we cannot claim improvement based on these recordings.";

  }



  if (conclusion === "insufficient_evidence") {
    message =
      firstRelevance !== "relevant" || secondRelevance !== "relevant"
        ? language === "Spanish"
          ? "Al menos uno de los intentos no responde con claridad al desafío. Por eso, VOX no puede afirmar que hubo una mejora."
          : "At least one attempt does not clearly address the challenge, so VOX cannot claim that progress was made."
        : language === "Spanish"
          ? "No hay suficiente evidencia en ambas grabaciones para establecer una comparación justa."
          : "There is not enough evidence in both recordings to make a fair comparison.";
  }

  return {
    changes,
    reasoning,
    pending,
    transcriptions: {
      first: firstTranscript,
      second: secondTranscript,
    },
    oralCommunication: [],

    nextStep:

      typeof analysis.nextStep === "string" ? analysis.nextStep : "",

    message,

    conclusion,

    evidence,

  };

}



export default async function handler(req, res) {

  res.setHeader("Cache-Control", "no-store");



  if (req.method !== "POST") {

    return res.status(405).json({

      error: "Method not allowed.",

    });

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

    firstTranscript,

    secondAudio,

    mimeType = "audio/webm",

    cefrLevel = "B1",

    language = "English",

    subject = "General",

  } = req.body || {};



  if (!["analyze", "compare"].includes(action)) {

    return res.status(400).json({

      error: "Invalid action. Use analyze or compare.",

    });

  }



  if (

    typeof question !== "string" ||

    !question.trim() ||

    question.length > 1000

  ) {

    return res.status(400).json({

      error: "Please provide the activity question.",

    });

  }



  if (!VALID_MIME_TYPES.includes(mimeType)) {

    return res.status(400).json({

      error: "Unsupported audio format.",

    });

  }



  if (

    typeof language !== "string" ||

    !["English", "Spanish"].includes(language)

  ) {

    return res.status(400).json({

      error: "Unsupported activity language.",

    });

  }



  if (action === "analyze" && !isValidAudio(audio)) {

    return res.status(400).json({

      error: "Please provide a valid recording.",

    });

  }



  if (
    action === "compare" &&
    (
      typeof firstTranscript !== "string" ||
      !firstTranscript.trim() ||
      firstTranscript.length > 12000 ||
      !isValidAudio(secondAudio)
    )
  ) {
    return res.status(400).json({
      error: "The first transcription and second recording are required for comparison.",
    });
  }

  try {

    if (action === "analyze") {

      const analysis = await analyzeRecording(apiKey, {

        audio,

        mimeType,

        question,

        subject,

        language,

        cefrLevel,

      });



      return res.status(200).json({

        result: analysis.result,

      });

    }



    const result = await compareRecordings(apiKey, {

      firstTranscript,

      secondAudio,

      mimeType,

      question,

      subject,

      language,

      cefrLevel,

    });



    return res.status(200).json({

      result,

    });

  } catch (error) {

    console.error("VOX analysis error:", error.message);



    return res.status(502).json({

      error:

        language === "Spanish"

          ? "No pudimos analizar las grabaciones. Intentá nuevamente."

          : "We couldn't analyse the recordings. Please try again.",

    });

  }

}
