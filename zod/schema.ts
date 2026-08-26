import * as z from "zod"
import { zfd } from "zod-form-data"

const AudioAnalysisSchema =  zfd.formData({

    audio : z.file().mime(["audio/mpeg" , "audio/ogg" , "audio/wav" , "audio/webm"]),
    additional_checks : z.string()

})

const AiResponseFormat = z.object({

    callSummary : z.string().describe("Brief 2–4 sentence overview of the call purpose, outcome, and overall quality."), 

    categoryScores : z.array(z.object({

        category : z.enum(["Greeting" , "Active Listening" , "Information Gathering" , "Objection Handling & Problem Solving" , "Closing" , "Communication Skills"]).describe("There are all the categories"), 

        score : z.number().max(5).min(0).describe("Ranges bettween 0 to 5"), 
        
        evidence : z.string().describe(" (specific quotes or moments from the transcript)"), 

        justification : z.string().describe("Justification about the score/evidence")

    })), 

    criticalError : z.string().optional().describe("List any critical errors found (or state “None identified”)"),

    overallScore : z.object({

        weightedTotalScore : z.object({
            
            percentage : z.number().min(0).max(100).describe("in percentage"), 
            totalScore : z.number().max(425).min(0).describe("score ranges between 0 to 425")

        }).describe("overall score")

    }), 

    finalJudgement : z.string().describe("final judgement of the call")

})

export { AudioAnalysisSchema , AiResponseFormat }