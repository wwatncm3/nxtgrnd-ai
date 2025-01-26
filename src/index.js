// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { UserProvider } from './UserContext';
import { Amplify } from 'aws-amplify';
import awsConfig from './aws-config';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: awsConfig.Auth.userPoolId,
      userPoolClientId: awsConfig.Auth.userPoolWebClientId,
      signUpVerificationMethod: 'code'
    }
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <UserProvider>
    <App />
  </UserProvider>
);