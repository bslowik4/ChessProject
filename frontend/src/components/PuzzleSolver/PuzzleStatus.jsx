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

  useEffect(() => {
    let initialTimeoutId;

    // Reset states when puzzle status changes
    if (!isSolved && !isFailed) {
      setShowModalWrapper(false);
      setShowButton(false);
      return;
    }

    // Handle failed puzzles - show modal, then hide, then show button
    if (isFailed) {
      // Show modal immediately for 4 seconds
      setShowModalWrapper(true);
      
      initialTimeoutId = setTimeout(() => {
        // Hide modal after 4 seconds
        setShowModalWrapper(false);
        
        // The button will be shown when the solution timer is finished
        // This is handled by the solutionTimer logic below
      }, 4000);
    }
    
    // Handle solved puzzles - only show button without initial modal hide/show
    if (isSolved) {
      setShowModalWrapper(true);
      setShowButton(true);
    }

    return () => {
      clearTimeout(initialTimeoutId);
    };
  }, [isSolved, isFailed]);

  // Handle showing button when solution timer is near completion
  useEffect(() => {
    // For failed puzzles, when the solution timer is done (or nearly done),
    // show the button and modal again
    if (isFailed && solutionTimer === 0 && !showButton) {
      setShowButton(true);
      setShowModalWrapper(true);
    }
  }, [solutionTimer, isFailed, showButton]);

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