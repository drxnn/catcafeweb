import type { CatMatch } from '../types';
import styles from './CatCard.module.css';

interface CatCardProps {
  cat: CatMatch;
}

function truncateDescription(text: string, maxLength = 150): string {
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '...';
}

export function CatCard({ cat }: CatCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        {cat.imageUrl ? (
          <img
            className={styles.image}
            src={cat.imageUrl}
            alt={cat.name}
            loading="lazy"
          />
        ) : (
          <div className={styles.placeholderImage} aria-hidden="true">
            {'\uD83D\uDC31'}
          </div>
        )}
        <span className={styles.scoreBadge}>
          {cat.matchScore}/8 match
        </span>
      </div>
      <div className={styles.content}>
        <h3 className={styles.name}>{cat.name}</h3>
        <p className={styles.description}>
          {truncateDescription(cat.description)}
        </p>
        <a
          className={styles.ctaButton}
          href={cat.adoptionUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Meet {cat.name} {'\u2192'}
        </a>
      </div>
    </div>
  );
}
