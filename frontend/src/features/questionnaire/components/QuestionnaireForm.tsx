import { useState } from "react";
import { questions } from "../types";
import { QuestionCard } from "./QuestionCard";
import { ProgressBar } from "./ProgressBar";
import type { CatMatch } from "../../results/types";
import { submitAnswers } from "../api";
import styles from "./QuestionnaireForm.module.css";

interface QuestionnaireFormProps {
  onResults: (matches: CatMatch[]) => void;
  onError: (message: string) => void;
}

export function QuestionnaireForm({
  onResults,
  onError,
}: QuestionnaireFormProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTags, setSelectedTags] = useState<(string | null)[]>(() =>
    new Array(questions.length).fill(null),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const currentTag = selectedTags[currentIndex];

  function handleSelect(tag: string) {
    setSelectedTags((prev) => {
      const next = [...prev];
      next[currentIndex] = tag;
      return next;
    });
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }

  function handleBack() {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }

  async function handleSubmit() {
    const tags = selectedTags.filter((t): t is string => t !== null);
    if (tags.length !== questions.length) return;

    console.log(`the tags are ${tags}`);
    setIsSubmitting(true);
    try {
      const matches = await submitAnswers(tags);
      onResults(matches);
    } catch {
      onError("Something went wrong finding your matches. Please try again!");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Find Your Purrfect Match</h1>
        <p className={styles.subtitle}>
          Answer 8 quick questions and we will match you with your ideal cat
          companion.
        </p>
      </div>

      <ProgressBar current={currentIndex + 1} total={questions.length} />

      <div className={styles.questionArea}>
        <QuestionCard
          key={currentQuestion.id}
          question={currentQuestion}
          selectedTag={currentTag}
          onSelect={handleSelect}
        />
      </div>

      <div className={styles.navigation}>
        <button
          type="button"
          className={styles.backButton}
          onClick={handleBack}
          disabled={currentIndex === 0}
        >
          Back
        </button>

        {isLastQuestion ? (
          <button
            type="button"
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={currentTag === null || isSubmitting}
          >
            {isSubmitting ? "Finding matches..." : "Find My Match \uD83D\uDC3E"}
          </button>
        ) : (
          <button
            type="button"
            className={styles.nextButton}
            onClick={handleNext}
            disabled={currentTag === null}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
