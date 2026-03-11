// UPDATED generateCareerSimulation function for your Lambda
// Replace your existing generateCareerSimulation with this:

const generateCareerSimulation = async (userData) => {
  try {
    console.log('Generating career simulation for:', userData);

    const {
      careerPath = 'Software Engineer',
      scenarioType = 'skill_acquisition',
      experienceLevel = 'entry',
      skills = [],
      currentSalary = 50000,
      timeframe = '5years'
    } = userData;

    // Build a comprehensive prompt for realistic simulation
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a career analyst with access to current market data. Generate a REALISTIC career simulation based on actual industry trends, salary data, and career progression timelines.

IMPORTANT:
- Use realistic salary percentages based on actual market data (not inflated numbers)
- Provide specific, actionable milestones with realistic timelines
- Consider the user's current experience level when projecting outcomes
- Base risk assessment on actual career transition data
- Be honest about competition levels and market demand`
        },
        {
          role: "user",
          content: `Generate a detailed career simulation for:

CAREER PATH: ${careerPath}
SCENARIO TYPE: ${scenarioType}
CURRENT EXPERIENCE: ${experienceLevel}
CURRENT SKILLS: ${skills.join(', ') || 'Entry-level skills'}
CURRENT SALARY ESTIMATE: $${currentSalary.toLocaleString()}
PROJECTION TIMEFRAME: ${timeframe}

Based on the scenario type "${scenarioType}", simulate the career impact:
- skill_acquisition: Impact of mastering 3+ key skills in this field
- certification: ROI of earning industry certifications
- specialization: Effects of niching down in a specialty area
- leadership: Transition to management/leadership track

Return JSON with this EXACT structure:
{
  "simulation": {
    "impact": "Detailed paragraph explaining the realistic impact of this career decision, including specific outcomes and what the user can expect",
    "salaryIncrease": <number 5-45 representing realistic percentage based on scenario>,
    "projectedSalary": "<formatted string like 75,000>",
    "timeInvestment": "<realistic timeline like '6-12 months' or '12-18 months'>",
    "riskLevel": "<Low|Medium|Medium-High|High based on actual career transition difficulty>",
    "confidenceScore": <number 60-95 representing data confidence>,
    "marketDemand": "<Low|Medium|High|Very High based on current market>",
    "competitionLevel": "<Low|Medium|Medium-High|High>",
    "milestones": [
      {
        "type": "skill|certification|career",
        "title": "Specific actionable milestone",
        "timeline": "0-3 months",
        "description": "What this milestone involves",
        "completed": false
      }
    ],
    "recommendations": [
      "Specific, actionable recommendation 1",
      "Specific, actionable recommendation 2",
      "Specific, actionable recommendation 3",
      "Specific, actionable recommendation 4"
    ],
    "keyMetrics": {
      "averageTimeToAchieve": "X months",
      "successRate": "X%",
      "industryGrowthRate": "X%"
    }
  }
}

Generate 4-6 milestones and 4-5 recommendations. Be specific to the ${careerPath} role.`
        }
      ],
      temperature: 0.4, // Lower temperature for more consistent, realistic outputs
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content);

    // Validate and sanitize the response
    if (result.simulation) {
      // Ensure salary increase is realistic (cap at 50%)
      result.simulation.salaryIncrease = Math.min(50, Math.max(5, result.simulation.salaryIncrease || 15));

      // Ensure confidence score is reasonable
      result.simulation.confidenceScore = Math.min(95, Math.max(60, result.simulation.confidenceScore || 75));

      // Calculate projected salary if not provided
      if (!result.simulation.projectedSalary) {
        const increase = result.simulation.salaryIncrease / 100;
        result.simulation.projectedSalary = Math.round(currentSalary * (1 + increase)).toLocaleString();
      }
    }

    console.log('Simulation generated successfully:', result.simulation?.impact?.substring(0, 100));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recommendations: result
      })
    };
  } catch (error) {
    console.error('Error generating career simulation:', error);

    // Provide a meaningful fallback that's still somewhat personalized
    const careerPath = userData.careerPath || 'Professional';
    const currentSalary = userData.currentSalary || 50000;
    const scenarioType = userData.scenarioType || 'skill_acquisition';

    const scenarioDefaults = {
      skill_acquisition: { increase: 15, time: '6-12 months', risk: 'Low' },
      certification: { increase: 20, time: '3-6 months', risk: 'Low' },
      specialization: { increase: 25, time: '12-18 months', risk: 'Medium' },
      leadership: { increase: 30, time: '18-24 months', risk: 'Medium-High' }
    };

    const defaults = scenarioDefaults[scenarioType] || scenarioDefaults.skill_acquisition;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recommendations: {
          simulation: {
            impact: `Based on industry analysis for ${careerPath}, this career decision could significantly impact your trajectory. We recommend conducting additional research specific to your target companies and location.`,
            salaryIncrease: defaults.increase,
            projectedSalary: Math.round(currentSalary * (1 + defaults.increase/100)).toLocaleString(),
            timeInvestment: defaults.time,
            riskLevel: defaults.risk,
            confidenceScore: 70,
            marketDemand: 'Medium',
            competitionLevel: 'Medium',
            milestones: [
              { type: 'skill', title: 'Assess current skill gaps', timeline: '0-1 month', completed: false },
              { type: 'skill', title: 'Create learning plan', timeline: '1-2 months', completed: false },
              { type: 'certification', title: 'Begin certification prep', timeline: '2-4 months', completed: false },
              { type: 'career', title: 'Update portfolio/resume', timeline: '4-6 months', completed: false }
            ],
            recommendations: [
              'Research specific requirements for target roles',
              'Network with professionals in your desired position',
              'Build a portfolio demonstrating relevant skills',
              'Consider informational interviews with hiring managers'
            ]
          }
        }
      })
    };
  }
};
