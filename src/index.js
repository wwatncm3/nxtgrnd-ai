// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { UserProvider } from './UserContext';
import { Amplify } from 'aws-amplify';
import awsConfig from './aws-config';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: awsConfig.Auth.userPoolId,
      userPoolClientId: awsConfig.Auth.userPoolWebClientId,
      signUpVerificationMethod: 'code',
      loginWith: {
        oauth: {
          domain: awsConfig.Auth.oauth.domain,
          scopes: awsConfig.Auth.oauth.scope,
          redirectSignIn: [awsConfig.Auth.oauth.redirectSignIn],
          redirectSignOut: [awsConfig.Auth.oauth.redirectSignOut],
          responseType: awsConfig.Auth.oauth.responseType
        }
      }
    }
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <UserProvider>
    <App />
  </UserProvider>
);

// Register service worker for offline capability
serviceWorkerRegistration.register({
  onSuccess: (registration) => {
    console.log('NxtGrnd AI is now available offline!');
  },
  onUpdate: (registration) => {
    console.log('New version available! Refresh to update.');
    // Optionally show a notification to the user
    if (window.confirm('A new version of NxtGrnd AI is available. Refresh to update?')) {
      window.location.reload();
    }
  }
});