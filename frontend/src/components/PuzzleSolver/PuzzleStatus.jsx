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
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let initialTimeoutId;
    let countdownIntervalId;
    let buttonTimeoutId;

    if (isSolved || isFailed) {
      setShowModalWrapper(true); 
      setTimer(4);

      initialTimeoutId = setTimeout(() => {
        setShowModalWrapper(false);
        setTimer(60); 

        countdownIntervalId = setInterval(() => {
          setTimer((prevTimer) => (prevTimer > 0 ? prevTimer - 1 : 0));
        }, 1000);

        buttonTimeoutId = setTimeout(() => {
          setShowButton(true); 
          setShowModalWrapper(true); 
          clearInterval(countdownIntervalId); 
          setTimer(0); 
        }, 60000); 
      }, 4000);

      return () => {
        clearTimeout(initialTimeoutId);
        clearInterval(countdownIntervalId);
        clearTimeout(buttonTimeoutId);
      };
    } else {
      setShowModalWrapper(false);
      setShowButton(false);
      setTimer(0);
    }
  }, [isSolved, isFailed]);

  const statusMessage = (
    <>
      {isSolved && (
        <div className={`${styles.statusMessage} ${styles.success}`}>
          {showSolution ? (
            <>
              Correct! Reviewing solution...
              {!showModalWrapper && timer > 0 && (
                <span className={styles.timer}> {/* (Next Puzzle In {timer}s) */}</span>
              )}
              {showButton && (
                <button
                  className={styles.nextPuzzleButton}
                  onClick={handleNextPuzzle}
                  disabled={solutionTimer > 0}
                >
                  {solutionTimer > 0 ? `Next puzzle in ${solutionTimer}s` : 'Next puzzle'}
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
              {!showModalWrapper && timer > 0 && (
                <span className={styles.timer}> {/* (Next puzzle in {timer}s) */}</span>
              )}
              {showButton && (
                <button
                  className={styles.nextPuzzleButton}
                  onClick={handleNextPuzzle}
                  disabled={solutionTimer > 0}
                >
                  {solutionTimer > 0 ? `Next puzzle in ${solutionTimer}s` : 'Next puzzle'}
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