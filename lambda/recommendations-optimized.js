// OPTIMIZED Recommendations Lambda - Fixes 504 Timeout
// Key changes:
// 1. Run AI match scoring IN PARALLEL instead of sequentially
// 2. Ask for match scores in the SAME OpenAI call as recommendations
// 3. Reduce max_tokens where possible
// 4. Store to DynamoDB in parallel

import { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import OpenAI from 'openai';

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);
const s3 = new S3Client({});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const handler = async (event) => {
  try {
    const { httpMethod, path } = event;

    // Safely parse request body once upfront
    let parsedBody;
    if (event.body) {
      try {
        parsedBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      } catch (parseError) {
        return {
          statusCode: 400,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ message: 'Invalid JSON in request body' })
        };
      }
    }

    if (httpMethod === 'POST' && path === '/recommendations')
      return await createRecommendation(parsedBody);

    if (httpMethod === 'POST' && path === '/recommendations/generate')
      return await generateRecommendation(parsedBody);

    if (httpMethod === 'GET' && path.startsWith('/recommendations/')) {
      const userId = path.split('/recommendations/')[1];
      console.log('Extracted userId:', userId);
      return await getRecommendations(userId);
    }

    if (httpMethod === 'DELETE' && path.startsWith('/recommendations/')) {
      const [recommendationId, userId] = path.split('/').slice(-2);
      return await deleteRecommendation(recommendationId, userId);
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid request' })
    };
  } catch (error) {
    console.error('Error handling request:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal Server Error',
        error: error.message
      })
    };
  }
};

// OPTIMIZED: Generate recommendations with match scores in a SINGLE OpenAI call
const generateRecommendation = async (userData) => {
  try {
    console.log('Generating recommendations for:', userData);
    const startTime = Date.now();

    // Check if this is a specific request type
    const requestType = userData.requestType;

    if (requestType === 'milestones') {
      return await generateMilestones(userData);
    }

    if (requestType === 'market_insights') {
      return await generateMarketInsights(userData);
    }

    if (requestType === 'career_simulation') {
      return await generateCareerSimulation(userData);
    }

    if (requestType === 'mentor_matching') {
      return await generateMentorRecommendations(userData);
    }

    const { userId, interests, skills, experienceLevel, resume } = userData;

    // Resume analysis - run in parallel with other prep if possible
    let resumeContent = "";
    let resumeAnalysisData = null;

    if (resume?.path) {
      try {
        const s3Params = {
          Bucket: "tw3tech-career-day",
          Key: resume.path
        };

        const command = new GetObjectCommand(s3Params);
        const response = await s3.send(command);
        resumeContent = await response.Body.transformToString();
        console.log(`Resume fetched in ${Date.now() - startTime}ms`);
      } catch (error) {
        console.error('Resume fetch error:', error);
      }
    }

    // OPTIMIZED: Single comprehensive OpenAI call that includes match scores
    // This replaces: 1) Resume analysis, 2) Career recommendations, 3) Individual match scoring
    // AbortController gives us a graceful 25s timeout before API Gateway cuts us off at 29s
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert AI career counselor. Generate comprehensive career recommendations with REALISTIC match scores.

MATCH SCORING CRITERIA (be honest and realistic):
- 85-100%: Excellent fit - Strong relevant experience, matching skills, clear career progression
- 70-84%: Good fit - Some relevant experience, transferable skills, reasonable path
- 55-69%: Moderate fit - Limited experience, some transferable skills, requires development
- 40-54%: Low fit - Minimal relevant background, significant skill gaps
- 15-39%: Poor fit - No relevant experience, mismatched skills
- 0-14%: No fit - Completely unrelated background

A new graduate with relevant coursework should score 65-80%.
Someone with 0 relevant experience should score 25-45%.
Only candidates with strong relevant experience should score 85+.

Return ONLY valid JSON.`
          },
          {
            role: "user",
            content: `Generate career recommendations for this candidate:

CANDIDATE PROFILE:
- Interests: ${interests?.join(', ') || 'Not specified'}
- Skills: ${skills?.join(', ') || 'Not specified'}
- Experience Level: ${experienceLevel || 'Entry level'}
- Career Stage: ${userData.careerStage || 'Not specified'}
- Path Type: ${userData.pathType || 'Not specified'}
- Primary Goal: ${userData.primaryGoal || 'Not specified'}

${resumeContent ? `RESUME CONTENT:\n${resumeContent.substring(0, 3000)}` : ''}

Return JSON with this EXACT structure:
{
  "careerPaths": [
    {
      "id": "path-1",
      "title": "Career Title",
      "description": "2-3 sentence description",
      "matchScore": 75,
      "matchReasoning": "Why this score based on their specific qualifications",
      "keyStrengths": ["Strength 1", "Strength 2"],
      "developmentAreas": ["Area 1", "Area 2"],
      "salaryRange": "$XX,XXX - $XXX,XXX",
      "requiredSkills": ["skill1", "skill2", "skill3"],
      "growthRate": "15%",
      "demand": "High",
      "jobOpenings": 25000,
      "marketData": {
        "growthRate": "15%",
        "demand": "High",
        "jobOpenings": 25000,
        "topSkills": [{"name": "skill", "demand": "90%"}],
        "industries": [{"name": "Tech", "percentage": 45}]
      },
      "recommendedCertifications": [
        {
          "name": "Cert Name",
          "provider": "Provider",
          "difficulty": "Intermediate",
          "timeframe": "3-6 months",
          "priority": "High"
        }
      ],
      "roadmap": {
        "timeToAchieve": "12-18 months",
        "steps": [
          {
            "order": 1,
            "title": "Step Title",
            "description": "Description",
            "timeline": "0-3 months",
            "resources": ["resource1"]
          }
        ]
      },
      "nextSteps": ["action1", "action2", "action3"]
    }
  ],
  "careerAnalysis": {
    "currentStage": "Current career stage assessment",
    "progressionPath": "Recommended progression",
    "keyStrengths": ["strength1", "strength2"],
    "developmentAreas": ["area1", "area2"]
  },
  "marketTrends": [
    {"trend": "AI Integration", "impact": "High", "description": "Brief description"}
  ]
}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1800, // Reduced for faster response (3 career paths fit comfortably)
        response_format: { type: "json_object" }
      }, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }

    console.log(`OpenAI call completed in ${Date.now() - startTime}ms`);

    if (!completion?.choices?.[0]?.message?.content) {
      throw new Error('No content returned from AI model');
    }
    const recommendations = JSON.parse(completion.choices[0].message.content);

    // OPTIMIZED: Store all recommendations to DynamoDB IN PARALLEL
    const storePromises = recommendations.careerPaths.map(async (careerPath, index) => {
      // Ensure unique ID
      careerPath.id = careerPath.id || `${userId}-${Date.now()}-${index}`;

      console.log(`Match Score for ${careerPath.title}: ${careerPath.matchScore}%`);

      return createRecommendation({
        RecommendationID: careerPath.id,
        UserID: userId,
        CareerPath: careerPath.title,
        Description: careerPath.description,
        SalaryRange: careerPath.salaryRange,
        RequiredSkills: careerPath.requiredSkills,
        Certifications: careerPath.recommendedCertifications,
        Roadmap: careerPath.roadmap,
        MatchScore: careerPath.matchScore,
        MatchReasoning: careerPath.matchReasoning,
        KeyStrengths: careerPath.keyStrengths,
        DevelopmentAreas: careerPath.developmentAreas,
        MatchConfidence: 'High', // Single call is more consistent
        MarketData: careerPath.marketData,
        CreatedAt: new Date().toISOString()
      });
    });

    // Wait for all DB writes in parallel
    await Promise.all(storePromises);

    console.log(`Total execution time: ${Date.now() - startTime}ms`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Career recommendations generated successfully',
        recommendations: recommendations
      })
    };
  } catch (error) {
    // AbortError means we hit our 25s self-imposed timeout before API Gateway's 29s hard cut
    if (error.name === 'AbortError') {
      console.error('OpenAI call timed out after 25s');
      return {
        statusCode: 504,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          message: 'Request timed out. Please try again — AI generation can take up to 30 seconds.',
          error: 'timeout'
        })
      };
    }
    console.error('Error generating recommendations:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        message: 'Error generating recommendations',
        error: error.message
      })
    };
  }
};

// Generate milestones for a specific career path
const generateMilestones = async (userData) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Generate detailed career milestones. Return only valid JSON."
        },
        {
          role: "user",
          content: `Generate milestones for: ${userData.pathId || 'Software Engineer'}
          Experience: ${userData.experienceLevel || 'entry'}
          Skills: ${userData.skills?.join(', ') || 'Programming'}

          Return: {"milestones": [{"type": "skill|certification|experience", "title": "Title", "description": "Description", "timeline": "3-6 months"}]}`
        }
      ],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: "json_object" }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ recommendations: JSON.parse(completion.choices[0].message.content) })
    };
  } catch (error) {
    console.error('Error generating milestones:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Error generating milestones', error: error.message }) };
  }
};

// Generate market insights
const generateMarketInsights = async (userData) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Generate market insights. Return only valid JSON matching the exact schema provided. Do not add extra fields."
        },
        {
          role: "user",
          content: `Market insights for: ${userData.pathId || 'Software Engineer'}
          Location: ${userData.location || 'United States'}

          Return EXACTLY this schema with no extra fields:
          {
            "marketInsights": {
              "demandGrowth": <integer, e.g. 15>,
              "averageSalary": <integer in USD, e.g. 85000>,
              "openPositions": <integer, e.g. 25000>,
              "requiredSkills": [{"name": "Python", "demandPercentage": "85%"}],
              "industryDistribution": [{"name": "Technology", "percentage": 45}]
            }
          }`
        }
      ],
      temperature: 0,
      max_tokens: 600,
      response_format: { type: "json_object" }
    });

    const raw = JSON.parse(completion.choices[0].message.content);
    const mi = raw.marketInsights || raw;

    // Normalize to guarantee the shape the frontend expects
    const normalized = {
      demandGrowth: typeof mi.demandGrowth === 'number' ? mi.demandGrowth : null,
      averageSalary: typeof mi.averageSalary === 'number' ? mi.averageSalary : null,
      openPositions: typeof mi.openPositions === 'number' ? mi.openPositions : null,
      requiredSkills: Array.isArray(mi.requiredSkills) ? mi.requiredSkills : [],
      industryDistribution: Array.isArray(mi.industryDistribution) ? mi.industryDistribution : []
    };

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ recommendations: { marketInsights: normalized } })
    };
  } catch (error) {
    console.error('Error generating market insights:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Error generating market insights', error: error.message }) };
  }
};

// Generate career simulations with REAL AI-powered data
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

// Generate AI-powered mentor recommendations
const generateMentorRecommendations = async (userData) => {
  try {
    console.log('Generating mentor recommendations for:', userData);

    const {
      careerPath = 'Professional',
      careerLevel = 'mid',
      companies = [],
      industries = [],
      focusAreas = [],
      mentorStyle = 'advisor',
      location = '',
      userSkills = []
    } = userData;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a career advisor helping find ideal mentor profiles. Generate realistic mentor search profiles that will help the user find real professionals on LinkedIn. Focus on specific job titles and companies relevant to the user's career path.`
        },
        {
          role: "user",
          content: `Generate 5 mentor search profiles for someone pursuing a career as: ${careerPath}

USER PREFERENCES:
- Career Level they want mentor at: ${careerLevel} (entry=1-3yrs, mid=4-7yrs, senior=8-12yrs, executive=12+yrs)
- Preferred Companies: ${companies.length > 0 ? companies.join(', ') : 'Any top companies in the field'}
- Industries: ${industries.length > 0 ? industries.join(', ') : 'Relevant to career path'}
- Focus Areas: ${focusAreas.length > 0 ? focusAreas.join(', ') : 'General career guidance'}
- Mentorship Style: ${mentorStyle}
- Location: ${location || 'Anywhere'}
- User Skills: ${userSkills.join(', ') || 'Entry-level'}

Return JSON with this EXACT structure:
{
  "mentors": [
    {
      "name": "<Role> at <Company>",
      "title": "<Specific job title>",
      "company": "<Real company name>",
      "location": "<City, State or Remote>",
      "yearsExperience": <number>,
      "education": "<Type of education background>",
      "skills": ["Skill 1", "Skill 2", "Skill 3"],
      "bio": "<Short description of what this mentor can offer, 1-2 sentences>",
      "matchScore": <75-98>,
      "whyGoodFit": "<Why this mentor profile matches the user's needs>"
    }
  ]
}

Generate 5 mentor profiles with varied but relevant companies and roles. Use real company names appropriate for the ${careerPath} field.`
        }
      ],
      temperature: 0.6,
      max_tokens: 1200,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content);

    console.log('Mentor recommendations generated:', result.mentors?.length || 0);

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
    console.error('Error generating mentor recommendations:', error);

    // Fallback with career-appropriate mentors
    const careerPath = userData.careerPath || 'Professional';

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recommendations: {
          mentors: [
            {
              name: `Senior ${careerPath} at Industry Leader`,
              title: `Senior ${careerPath}`,
              company: 'Industry Leader',
              location: 'Remote',
              yearsExperience: 10,
              education: 'Relevant Degree',
              skills: ['Leadership', 'Strategy', 'Technical Skills'],
              bio: `Experienced ${careerPath} who can guide you through career challenges.`,
              matchScore: 85,
              whyGoodFit: 'Strong background in your target field'
            }
          ]
        }
      })
    };
  }
};

const createRecommendation = async (data) => {
  if (!data.RecommendationID || !data.UserID || !data.CareerPath) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Missing required fields' }) };
  }

  await dynamodb.send(new PutCommand({
    TableName: 'Recommendations',
    Item: {
      RecommendationID: data.RecommendationID,
      UserID: data.UserID,
      CareerPath: data.CareerPath,
      Description: data.Description || '',
      SalaryRange: data.SalaryRange || '',
      RequiredSkills: data.RequiredSkills || [],
      Certifications: data.Certifications || [],
      Roadmap: data.Roadmap || {},
      MatchScore: data.MatchScore || 0,
      MatchReasoning: data.MatchReasoning || '',
      KeyStrengths: data.KeyStrengths || [],
      DevelopmentAreas: data.DevelopmentAreas || [],
      MatchConfidence: data.MatchConfidence || 'Medium',
      MarketData: data.MarketData || {},
      CreatedAt: new Date().toISOString()
    }
  }));

  return { statusCode: 201, body: JSON.stringify({ message: 'Recommendation created', data }) };
};

const getRecommendations = async (userId) => {
  try {
    const result = await dynamodb.send(new QueryCommand({
      TableName: 'Recommendations',
      IndexName: 'UserID-index',
      KeyConditionExpression: 'UserID = :userId',
      ExpressionAttributeValues: { ':userId': userId }
    }));

    if (!result.Items || result.Items.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ message: 'No recommendations found' }) };
    }

    const formattedRecommendations = result.Items.map((item, index) => ({
      id: item.RecommendationID || (index + 1),
      title: item.CareerPath,
      description: item.Description,
      salaryRange: item.SalaryRange,
      matchScore: item.MatchScore || 0,
      matchReasoning: item.MatchReasoning || '',
      keyStrengths: item.KeyStrengths || [],
      developmentAreas: item.DevelopmentAreas || [],
      matchConfidence: item.MatchConfidence || 'Medium',
      requiredSkills: item.RequiredSkills || [],
      recommendedCertifications: item.Certifications || [],
      roadmap: item.Roadmap || { timeToAchieve: '', steps: [] },
      nextSteps: item.Roadmap?.steps?.map(step => step.title) || [],
      marketData: item.MarketData || {},
      growthRate: item.MarketData?.growthRate || '12%',
      demand: item.MarketData?.demand || 'High',
      jobOpenings: item.MarketData?.jobOpenings || 5000
    }));

    return { statusCode: 200, body: JSON.stringify({ recommendations: formattedRecommendations }) };
  } catch (error) {
    console.error('Error in getRecommendations:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Error fetching recommendations', error: error.message }) };
  }
};

const deleteRecommendation = async (recommendationId, userId) => {
  await dynamodb.send(new DeleteCommand({
    TableName: 'Recommendations',
    Key: { RecommendationID: recommendationId, UserID: userId }
  }));
  return { statusCode: 200, body: JSON.stringify({ message: 'Recommendation deleted' }) };
};
