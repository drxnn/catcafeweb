import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = (current / total) * 100;

  return (
    <div className={styles.container}>
      <p className={styles.label}>
        Question <span className={styles.labelHighlight}>{current}</span> of {total}
      </p>
      <div className={styles.track} role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total}>
        <div className={styles.fill} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
