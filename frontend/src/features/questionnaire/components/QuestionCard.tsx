import type { Question } from '../types';
import styles from './QuestionCard.module.css';

interface QuestionCardProps {
  question: Question;
  selectedTag: string | null;
  onSelect: (tag: string) => void;
}

export function QuestionCard({ question, selectedTag, onSelect }: QuestionCardProps) {
  const isASelected = selectedTag === question.optionA.tag;
  const isBSelected = selectedTag === question.optionB.tag;

  return (
    <div className={styles.container}>
      <p className={styles.categoryTitle}>{question.title}</p>
      <div className={styles.options}>
        <button
          type="button"
          className={isASelected ? styles.optionCardSelected : styles.optionCard}
          onClick={() => onSelect(question.optionA.tag)}
          aria-pressed={isASelected}
        >
          <span className={styles.optionIndicator}>A</span>
          <span className={styles.optionLabel}>{question.optionA.label}</span>
        </button>

        <button
          type="button"
          className={isBSelected ? styles.optionCardSelected : styles.optionCard}
          onClick={() => onSelect(question.optionB.tag)}
          aria-pressed={isBSelected}
        >
          <span className={styles.optionIndicator}>B</span>
          <span className={styles.optionLabel}>{question.optionB.label}</span>
        </button>
      </div>
    </div>
  );
}
