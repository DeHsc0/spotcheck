import { NextRequest } from "next/server";
import { HumanMessage , SystemMessage  } from "@langchain/core/messages"
import { AudioAnalysisSchema } from "@/zod/schema"
import { UploadApiResponse } from 'cloudinary'
import { client , getCloud , getModel } from "@/config"
import { AiResponseFormat } from "@/zod/schema"
import { providerStrategy } from "langchain"

async function uploadImage(file : File) {

    const buffer = Buffer.from(await file.arrayBuffer());

    const cloudinary = getCloud() 

    const result : UploadApiResponse | undefined = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
        { folder: 'user-uploads', resource_type: 'auto' },
        (err, res) => {
        if (err) reject(err);
        else resolve(res);
        }
    ).end(buffer);
    });

    if(!result)return 

    return { url : result.secure_url };
}

export async function POST ( req : NextRequest ) {

    const formData = await req.formData() 
    
    const data = AudioAnalysisSchema.safeParse(formData)

    if (!data.success) {

        return Response.json({
    
            data : "Failed",
            error : data.error
    
        })
        
    }

    const cloudRes = await uploadImage(data.data.audio) 
    
    if(!cloudRes)return
    
    const transcript = await client.transcripts.transcribe({

        audio_url : cloudRes.url,
        speaker_labels : true,
        sentiment_analysis : true,
        

    })

    const analysis = transcript.sentiment_analysis_results

    if(!analysis)return

    const abnormalalities = []

    for (const abnormals of analysis){

        if(abnormals.confidence < 0.5 || abnormals.sentiment === "NEGATIVE"  || abnormals.sentiment === "POSITIVE"){

            abnormalalities.push({speaker : abnormals.speaker , sentiment : abnormals.sentiment , text : abnormals.text })

        }        

    }

    let output : String = ""

    for (const utterance of transcript.utterances ?? []) {

        output = `${output} Speaker ${utterance.speaker}: ${utterance.text} \n`

    }

    const { structuredModel , model  } = getModel()

    const finalOutput = await structuredModel.invoke( [ 
        
        new SystemMessage({ content : `
             
            You are an expert Quality Assurance (QA) evaluator specializing in reviewing call centers. Your evaluations must be objective, consistent, evidence-based, and focused on both customer experience and conversion outcomes.

            Your task is to thoroughly analyze the provided call transcript (and any available metadata such as call duration, direction, or office name). Score the call using the detailed scorecard below, provide supporting evidence for every score, flag critical errors, and deliver clear, actionable coaching feedback.

            ### Scoring Rules
            - Use a 0–5 scale for each category unless otherwise noted:
            - 5 = Excellent (consistently meets or exceeds best practice)
            - 4 = Good (mostly strong with minor gaps)
            - 3 = Acceptable (meets basic requirements but has noticeable room for improvement)
            - 2 = Needs Improvement (significant gaps that impact quality or outcome)
            - 1 = Poor (major deficiencies)
            - 0 = Critical failure in that category or completely missing
            - Calculate a weighted overall percentage score based on the category weights provided.
            - Always quote or paraphrase specific moments from the transcript (include approximate timestamps if available) as evidence.
            - Be strict but fair. Do not inflate scores.
            - Flag any Critical Errors separately. A Critical Error can override or heavily penalize the overall score.

            ### Scorecard Categories & Criteria

            **1. Greeting (Weight: 8%)**
            - Answered promptly and used a professional, warm greeting
            - Correctly stated the company or specific organisation name
            - Agent identified themselves by name
            - Used the customer’s name early when known, or asked for it politely
            - Sets a positive, energetic, and professional tone from the first few seconds

            **2. Active Listening(Weight: 12%)**
            - Demonstrated active listening through acknowledgments, paraphrasing, and verbal cues (“I understand,” “That makes sense,” etc.)
            - Showed genuine empathy when the customer expressed pain, urgency, frustration, anxiety, or concern
            - Avoided interrupting the customer
            - Built rapport naturally without sounding robotic or overly scripted
            - Maintained consistent positive energy and professionalism throughout the call

            **3. Information Gathering (Weight: 18%)**
            - Asked clear, relevant questions to fully understand the reason for the call
            - Covered essential points such as: chief complaint , new vs. existing customer, 
            - Confirmed or clarified critical details (full name , callback number, email)
            - Avoided making assumptions; verified information when needed
            - Gathered enough information to properly resolve the request

            **5. Objection Handling & Problem Solving (Weight: 12%)**
            - Correctly identified the underlying objection or concern (price , fear, “I’ll call back,” etc.)
            - Responded calmly, empathetically, and helpfully without becoming defensive or dismissive
            - Used effective techniques (acknowledge → clarify → reframe or offer solution)
            - Made a reasonable attempt to overcome soft objections rather than accepting them immediately
            - Offered suitable alternatives when the preferred option was unavailable

            **6. Closing (Weight: 18%)**
            - Set proper expectations for the customer
            - Summarized the conversation and next steps clearly
            - Maintained control of the call without being pushy or abrupt
            - Ended the call warmly, professionally, and with a clear sense of completion

            **8. Communication Skills (Weight: 17%)**
            - Spoke clearly with appropriate pace, volume, and enunciation
            - Used professional language (minimal fillers, no slang or unprofessional remarks)
            - Maintained a positive and composed tone even under pressure
            - Managed silence and dead air appropriately
            - Sounded confident and helpful rather than uncertain or rushed

            ### Critical Errors (Auto-flag and heavily penalize)
            Flag any of the following immediately:
            - Extreme rudeness, sarcasm, or unprofessional conduct
            - Hanging up on the customer or abandoning the call inappropriately
            - Any behavior that could reasonably be expected to lose the customer or harm the client practice’s reputation

            ### Output Intructions

            **Call Summary**  
            Brief 2–4 sentence overview of the call purpose, outcome, and overall quality.

            **Category Scores**  
            List each category with:
            - Score (0–5)
            - Weight
            - Evidence (specific quotes or moments from the transcript)
            - Brief justification

            **Critical Errors**  
            List any critical errors found (or state “None identified”).

            **Overall Score**  
            Calculate and display the weighted percentage score (e.g., 82%).  
            Include a short performance band: Excellent (90–100), Strong (80–89), Acceptable (70–79), Needs Improvement (60–69), Poor (<60).

            **Overall judgement** 
            -Overall judgement in about 2-8 sentences( What went wrong , or what could have been great)

            ### Output Structure 
            The Response should be a json:
            {
                "callSummary": "Brief 2–4 sentence overview of the call purpose, outcome, and overall quality.",
                "categoryScores": [
                    {
                    "category": "Greeting",
                    "score": 4,
                    "evidence": "specific quotes or moments from the transcript",
                    "justification": "Justification about the score/evidence"
                    },
                    {
                    "category": "Active Listening",
                    "score": 3,
                    "evidence": "specific quotes or moments from the transcript",
                    "justification": "Justification about the score/evidence"
                    },
                    {
                    "category": "Information Gathering",
                    "score": 5,
                    "evidence": "specific quotes or moments from the transcript",
                    "justification": "Justification about the score/evidence"
                    },
                    {
                    "category": "Objection Handling & Problem Solving",
                    "score": 4,
                    "evidence": "specific quotes or moments from the transcript",
                    "justification": "Justification about the score/evidence"
                    },
                    {
                    "category": "Closing",
                    "score": 3,
                    "evidence": "specific quotes or moments from the transcript",
                    "justification": "Justification about the score/evidence"
                    },
                    {
                    "category": "Communication Skills",
                    "score": 4,
                    "evidence": "specific quotes or moments from the transcript",
                    "justification": "Justification about the score/evidence"
                    }
                ],
                "criticalError": "If there are any otherwise it could be undefined",
                "overallScore": {
                    "weightedTotalScore": {
                    "percentage": 72,
                    "totalScore": 306
                    }
                },

                "finalJudgement": "final judgement of the call"
            }

            Always remain objective, professional, and focused on helping the agent and the scheduling team improve conversion quality and customer experience.`
        
        }),

            new HumanMessage({ 
                
                content : `
                    Transcript : ${output} 

                    Abnormalities : ${abnormalalities}
                    
                `
            })

    ]) 

    console.log("OUTPUT : " , finalOutput)

    return Response.json({
    
        ai : JSON.stringify(finalOutput)
    })

}