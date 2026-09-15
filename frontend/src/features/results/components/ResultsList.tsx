import type { CatMatch } from '../types';
import { CatCard } from './CatCard';
import styles from './ResultsList.module.css';

interface ResultsListProps {
  matches: CatMatch[];
  onStartOver: () => void;
}

export function ResultsList({ matches, onStartOver }: ResultsListProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Your Purrfect Matches! {'\uD83D\uDC31'}</h1>
        <p className={styles.subtitle}>
          Based on your preferences, we think you will love these cats.
        </p>
      </div>

      <div className={styles.grid}>
        {matches.map((cat) => (
          <CatCard key={cat.id} cat={cat} />
        ))}
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.startOverButton}
          onClick={onStartOver}
        >
          {'\uD83D\uDD04'} Start Over
        </button>
      </div>
    </div>
  );
}
