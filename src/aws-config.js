const awsConfig = {
    Auth: {
      region: 'us-east-1',  // AWS region
      userPoolId: 'us-east-1_nZs87K3XT',  // Your Cognito User Pool ID
      userPoolWebClientId: '82vo982u03f2ou1htfvsagf43',
      mandatorySignIn: false,
      authenticationFlowType: 'USER_PASSWORD_AUTH',
    },
  };
  
  export default awsConfig;
  