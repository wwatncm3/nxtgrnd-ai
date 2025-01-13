import React, { useState } from 'react';
import RoleSelection from './RoleSelection';
import InterestSelection from './InterestSelection';

const OnboardingFlow = () => {
  const [step, setStep] = useState(1);

  const handleNext = () => {
    setStep((prevStep) => prevStep + 1);
  };

  return (
    <div>
      {step === 1 && <RoleSelection onNext={handleNext} />}
      {step === 2 && <InterestSelection onNext={handleNext} />}
    </div>
  );
};

export default OnboardingFlow;
