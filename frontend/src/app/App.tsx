import { useState } from 'react';
import { QuestionnaireForm } from '../features/questionnaire/components/QuestionnaireForm';
import { ResultsList } from '../features/results/components/ResultsList';
import type { CatMatch } from '../features/results/types';
import styles from './App.module.css';

type AppState = 'quiz' | 'loading' | 'results' | 'error';

export default function App() {
  const [appState, setAppState] = useState<AppState>('quiz');
  const [matches, setMatches] = useState<CatMatch[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  function handleResults(results: CatMatch[]) {
    setMatches(results);
    setAppState('results');
  }

  function handleError(message: string) {
    setErrorMessage(message);
    setAppState('error');
  }

  function handleStartOver() {
    setMatches([]);
    setErrorMessage('');
    setAppState('quiz');
  }

  return (
    <div className={styles.app}>
      <main className={styles.main}>
        {appState === 'quiz' && (
          <QuestionnaireForm
            onResults={handleResults}
            onError={handleError}
          />
        )}

        {appState === 'loading' && (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}>
              <span className={styles.spinnerCat}>{'\uD83D\uDC31'}</span>
            </div>
            <div className={styles.spinnerDots}>
              <span className={styles.spinnerDot} />
              <span className={styles.spinnerDot} />
              <span className={styles.spinnerDot} />
            </div>
            <p className={styles.loadingText}>
              Sniffing out your purrfect matches...
            </p>
          </div>
        )}

        {appState === 'results' && (
          <ResultsList
            matches={matches}
            onStartOver={handleStartOver}
          />
        )}

        {appState === 'error' && (
          <div className={styles.errorContainer}>
            <span className={styles.errorIcon}>{'\uD83D\uDE3F'}</span>
            <h2 className={styles.errorTitle}>Oops! Something went wrong</h2>
            <p className={styles.errorMessage}>{errorMessage}</p>
            <button
              type="button"
              className={styles.retryButton}
              onClick={handleStartOver}
            >
              Try Again
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
