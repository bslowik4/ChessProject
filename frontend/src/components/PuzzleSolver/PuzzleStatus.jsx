import React, { useEffect, useState } from 'react';
import styles from './PuzzleSolver.module.css';

const PuzzleStatus = ({
  handleNextPuzzle,
  isSolved,
  isFailed,
  showSolution,
  solutionTimer
}) => {
  const [showModalWrapper, setShowModalWrapper] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [buttonTimer, setButtonTimer] = useState(0);

  useEffect(() => {
    let initialTimeoutId;
    let buttonTimeoutId;
    let buttonIntervalId;

    if (isSolved || isFailed) {
      setShowModalWrapper(true);

      initialTimeoutId = setTimeout(() => {
        setShowModalWrapper(false);

        setButtonTimer(60);
        buttonIntervalId = setInterval(() => {
          setButtonTimer((prevTimer) => (prevTimer > 0 ? prevTimer - 1 : 0));
        }, 1000);

        buttonTimeoutId = setTimeout(() => {
          setShowButton(true);
          setShowModalWrapper(true);
          clearInterval(buttonIntervalId);
          setButtonTimer(0);
        }, 60000);
      }, 4000);

      return () => {
        clearTimeout(initialTimeoutId);
        clearTimeout(buttonTimeoutId);
        clearInterval(buttonIntervalId);
      };
    } else {
      setShowModalWrapper(false);
      setShowButton(false);
      setButtonTimer(0);
    }
  }, [isSolved, isFailed]);

  const statusMessage = (
    <>
      {isSolved && (
        <div className={`${styles.statusMessage} ${styles.success}`}>
          {showSolution ? (
            <>
              Correct! Reviewing solution...
              {showButton && (
                <button
                  className={styles.nextPuzzleButton}
                  onClick={handleNextPuzzle}
                  disabled={solutionTimer > 0 || buttonTimer > 0}
                >
                  {solutionTimer > 0 ? `Next puzzle in ${solutionTimer}s` : (buttonTimer > 0 ? `Next puzzle in ${buttonTimer}s` : 'Next puzzle')}
                </button>
              )}
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
              {showButton && (
                <button
                  className={styles.nextPuzzleButton}
                  onClick={handleNextPuzzle}
                  disabled={solutionTimer > 0 || buttonTimer > 0}
                >
                  {solutionTimer > 0 ? `Next puzzle in ${solutionTimer}s` : (buttonTimer > 0 ? `Next puzzle in ${buttonTimer}s` : 'Next puzzle')}
                </button>
              )}
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
      {showModalWrapper && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            {statusMessage}
          </div>
        </div>
      )}
      {!showModalWrapper && statusMessage}
    </>
  );
};

export default PuzzleStatus;