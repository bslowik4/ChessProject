import React, { useEffect, useState } from 'react';
import styles from './PuzzleSolver.module.css';

const PuzzleStatus = ({
  handleNextPuzzle,
  errorMessage,
  animateError,
  isSolved,
  isFailed,
  showSolution,
  solutionTimer
}) => {
  const [showModalWrapper, setShowModalWrapper] = useState(false);

  useEffect(() => {
    if (isSolved || isFailed) {
      setShowModalWrapper(true);
      const timer = setTimeout(() => {
        setShowModalWrapper(false);
      }, 2000); // 2 seconds
      return () => clearTimeout(timer);
    }
  }, [isSolved, isFailed]);

  const statusMessage = (
    <>
      {isSolved && (
        <div className={`${styles.statusMessage} ${styles.success}`}>
          {showSolution ? (
            <>
              Correct! Reviewing solution...
              <button
                className={styles.nextPuzzleButton}
                onClick={handleNextPuzzle}      
                disabled={solutionTimer > 0}
              >
                {solutionTimer > 0 ? `Next puzzle in ${solutionTimer}s` : 'Next puzzle'}
              </button>
            </>
          ) : (
            "Correct! Loading next puzzle..."
          )}
        </div>
      )}
      {isFailed && (
        <div className={`${styles.statusMessage} ${styles.failure}`}>
          {showSolution ? (
            <>
              Incorrect. Review the solution...
              <button
                className={styles.nextPuzzleButton}
                onClick={handleNextPuzzle}
                disabled={solutionTimer > 0}
              >
                {solutionTimer > 0 ? `Next puzzle in ${solutionTimer}s` : 'Next puzzle'}
              </button>
            </>
          ) : (
            "Incorrect. The correct solution will be shown."
          )}
        </div>
      )}
    </>
  );
  return (
    <>
      {showModalWrapper ? (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            {statusMessage}
          </div>
        </div>
      ) : (
        statusMessage // still render the message but outside the modal after 2s
      )}
    </>
  );
};

export default PuzzleStatus;
