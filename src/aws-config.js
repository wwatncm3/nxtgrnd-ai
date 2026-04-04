const awsConfig = {
    Auth: {
      region: 'us-east-1',
      userPoolId: 'us-east-1_nZs87K3XT',
      userPoolWebClientId: '82vo982u03f2ou1htfvsagf43',
      mandatorySignIn: false,
      authenticationFlowType: 'USER_PASSWORD_AUTH',
      oauth: {
        domain: 'us-east-1nzs87k3xt.auth.us-east-1.amazoncognito.com',
        scope: ['openid', 'email', 'profile'],
        redirectSignIn: 'https://nxtgrnd-ai.vercel.app/',
        redirectSignOut: 'https://nxtgrnd-ai.vercel.app/',
        responseType: 'code'
      }
    },
    DynamoDB: {
      region: 'us-east-1',
      // Table names - will be created in AWS Console
      tables: {
        users: process.env.REACT_APP_DYNAMODB_USERS_TABLE || 'nxtgrnd-users',
        userDashboards: process.env.REACT_APP_DYNAMODB_DASHBOARDS_TABLE || 'nxtgrnd-user-dashboards',
        userPreferences: process.env.REACT_APP_DYNAMODB_PREFERENCES_TABLE || 'nxtgrnd-user-preferences',
      }
    }
  };

  export default awsConfig;
  