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
    console.log('Received event:', JSON.stringify(event));
    const { httpMethod, path } = event;
    console.log(`Processing ${httpMethod} request to ${path}`);

    if (httpMethod === 'POST' && path === '/recommendations')
      return await createRecommendation(JSON.parse(event.body));

    if (httpMethod === 'POST' && path === '/recommendations/generate')
      return await generateRecommendation(JSON.parse(event.body));

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
    const completion = await openai.chat.completions.create({
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
      max_tokens: 2500, // Reduced from 3000
      response_format: { type: "json_object" }
    });

    console.log(`OpenAI call completed in ${Date.now() - startTime}ms`);

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
    console.error('Error generating recommendations:', error);
    return {
      statusCode: 500,
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
          content: "Generate market insights. Return only valid JSON."
        },
        {
          role: "user",
          content: `Market insights for: ${userData.pathId || 'Software Engineer'}
          Location: ${userData.location || 'United States'}

          Return: {"marketInsights": {"demandGrowth": 15, "averageSalary": 85000, "openPositions": 25000, "requiredSkills": [{"name": "Python", "demandPercentage": "85%"}], "industryDistribution": [{"name": "Technology", "percentage": 45}]}}`
        }
      ],
      temperature: 0.7,
      max_tokens: 600,
      response_format: { type: "json_object" }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ recommendations: JSON.parse(completion.choices[0].message.content) })
    };
  } catch (error) {
    console.error('Error generating market insights:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Error generating market insights', error: error.message }) };
  }
};

// Generate career simulations
const generateCareerSimulation = async (userData) => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Generate career simulation. Return only valid JSON."
        },
        {
          role: "user",
          content: `Simulation for: ${userData.careerPath || 'Software Engineer'}
          Scenario: ${userData.scenarioType || 'skill_acquisition'}
          Experience: ${userData.experienceLevel || 'entry'}
          Skills: ${userData.skills?.join(', ') || 'Basic programming'}

          Return: {"simulation": {"impact": "Description", "salaryIncrease": 25, "timeInvestment": "6-12 months", "milestones": [{"type": "certification", "title": "Title", "timeline": "3-6 months"}], "recommendations": ["Action 1"]}}`
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
    console.error('Error generating simulation:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Error generating simulation', error: error.message }) };
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
