import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.scss';
import { useForm } from 'react-hook-form';
import { questions, PersonalInfo, Answers } from './types';
import PersonalInfoForm from './personal_info';
import Barcode from './barcode';
import _ from 'lodash';

function assertType<T>(_value: any): asserts _value is T { }
function App() {
  const { register: registerPersonalInfo, watch: watchPersonalInfo } = useForm<PersonalInfo>();
  const [answers, setAnswers] = useState<Answers>({});

  return (
    <div className="container">
      <h1>📋 Joey's QuickerPass</h1>
      <p className="subtitle">Complete the form below to generate your QuickPass-compatible barcode.</p>

      <PersonalInfoForm register={registerPersonalInfo} />

      <div className="section">
        <div className="section-title">❓ Survey Questions</div>
        {Object.entries(questions).map(([key, value]) => {
          assertType<keyof Answers>(key);
          return (
            <div className="question" key={key}>
              <span className="question-text">{value}</span>
              <div className="toggle-buttons">
                <button className={"yes" + (answers[key] === 'Y' ? ' active' : '')} onClick={() => setAnswers({ ...answers, [key]: 'Y' })}>Yes</button>
                <button className={"no" + (answers[key] === 'N' ? ' active' : '')} onClick={() => setAnswers({ ...answers, [key]: 'N' })}>No</button>
                <button className={"skip" + (!answers[key] ? ' active' : '')} onClick={() => setAnswers(_.omit(answers, key))}>Skip</button>
              </div>
            </div>
          );
        })}
      </div>

      <Barcode personalInfo={watchPersonalInfo()} answers={answers} />
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
