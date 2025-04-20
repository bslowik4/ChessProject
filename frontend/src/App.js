import styles from './App.module.css';
import Login from './components/Login';
import PuzzleSolver from './components/PuzzleSolver';
import LogoutModal from './components/LogoutModal';
import StudyCompleted from './components/StudyCompleted';
import ThemeToggle from './components/ThemeToggle';
import LogoFooter from './components/LogoFooter';

import { logout } from './api/users';
import { useState, useEffect } from 'react';
import { updateUserSession, getExercisesForSession, createSessionLog, completeSessionLog } from './api/database';

// Maximum number of sessions in the study
const MAX_SESSIONS = 5;

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState({
    userId: null,
    username: '',
    groupId: null,
    currentSession: null
  });
  const [headerMenu, setHeadermenu] = useState(true);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [lastSessionTime, setLastSessionTime] = useState(null);
  const [sessionLogId, setSessionLogId] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [sessionProgress, setSessionProgress] = useState({
    puzzlesCompleted: 0,
    totalPuzzles: 0,
    currentPuzzleIndex: 0
  });
  const [sessionStartTime, setSessionStartTime] = useState(null);

  const toggleMenu = () => {
    setHeadermenu(!headerMenu);
  };

  // Restore user session from localStorage on initial load
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      restoreUserSession();
    }
  }, []);

  // Load exercises when user starts a session
  useEffect(() => {
    if (sessionActive && userInfo.groupId && userInfo.currentSession) {
      loadExercisesForCurrentSession();
    }
  }, [sessionActive, userInfo.groupId, userInfo.currentSession]);

  // Restore user session from localStorage
  const restoreUserSession = () => {
    const userId = localStorage.getItem('user_id');
    const username = localStorage.getItem('username');
    const groupId = localStorage.getItem('group_id');
    const currentSession = localStorage.getItem('current_session');
    const lastSessionCompleted = localStorage.getItem('last_session_time');
    const savedPuzzleIndex = localStorage.getItem('current_puzzle_index');
    const savedPuzzlesCompleted = localStorage.getItem('puzzles_completed');

    setUserInfo({
      userId,
      username,
      groupId: Number(groupId),
      currentSession: Number(currentSession)
    });

    if (lastSessionCompleted) {
      setLastSessionTime(new Date(lastSessionCompleted));
    }

    // Restore saved puzzle progress if available
    if (savedPuzzleIndex || savedPuzzlesCompleted) {
      setSessionProgress({
        puzzlesCompleted: savedPuzzlesCompleted ? Number(savedPuzzlesCompleted) : 0,
        totalPuzzles: 0, // Will be updated when exercises are loaded
        currentPuzzleIndex: savedPuzzleIndex ? Number(savedPuzzleIndex) : 0
      });
    }

    // Check if there was an active session when the page was refreshed
    const wasSessionActive = localStorage.getItem('session_active') === 'true';
    if (wasSessionActive) {
      // Also restore the session log ID if available
      const savedSessionLogId = localStorage.getItem('session_log_id');
      if (savedSessionLogId) {
        setSessionLogId(savedSessionLogId);
      }

      setSessionActive(true);
      setShowInstructions(false);

      // Restore session start time if available
      const savedStartTime = localStorage.getItem('session_start_time');
      if (savedStartTime) {
        setSessionStartTime(Number(savedStartTime));
      } else {
        // If no saved start time, set to current time
        setSessionStartTime(Date.now());
      }
    }

    setIsLoggedIn(true);
    console.log(`User session restored: ${username}, Group: ${groupId}, Session: ${currentSession}`);
  }

  const loadExercisesForCurrentSession = async () => {
    if (!userInfo.groupId || !userInfo.currentSession) return;

    // If user has completed all sessions, don't load exercises
    if (userInfo.currentSession > MAX_SESSIONS) {
      setExercises([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const exerciseData = await getExercisesForSession(
        userInfo.groupId,
        userInfo.currentSession
      );
      console.log('Exercises data received from API:', exerciseData);
      setExercises(exerciseData);

      // Update total puzzles in session progress
      setSessionProgress(prev => ({
        ...prev,
        totalPuzzles: exerciseData.length
      }));

      console.log(`Loaded ${exerciseData.length} exercises for Group ${userInfo.groupId}, Session ${userInfo.currentSession}`);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // If session is active, show the confirmation modal
    if (sessionActive) {
      setShowLogoutModal(true);
    } else {
      // If no active session, proceed with logout immediately
      performLogout();
    }
  };

  // Function to actually perform the logout
  const performLogout = async () => {
    // If there's an active session, complete it before logging out
    if (sessionActive && sessionLogId) {
      try {
        await completeAndAdvanceSession();
      } catch (error) {
        console.error('Error completing session during logout:', error);
      }
    }

    // Proceed with logout
    logout();
    resetAppState();

    // Clear session-related localStorage items
    localStorage.removeItem('current_puzzle_index');
    localStorage.removeItem('puzzles_completed');
    localStorage.removeItem('session_active');
    localStorage.removeItem('session_log_id');
    localStorage.removeItem('session_start_time');
  };

  // Reset the application state after logout
  const resetAppState = () => {
    setIsLoggedIn(false);
    setSessionActive(false);
    setShowInstructions(true);
    setUserInfo({
      userId: null,
      username: '',
      groupId: null,
      currentSession: null
    });
    setExercises([]);
    localStorage.removeItem('last_session_time');
    setLastSessionTime(null);
    setSessionLogId(null);
    setShowLogoutModal(false);
  }

  // Complete current session and advance to next
  const completeAndAdvanceSession = async () => {
    // Calculate total time for the session
    const totalTimeSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);

    // Complete the current session
    await completeSessionLog(
      sessionLogId,
      totalTimeSeconds,
      sessionProgress.puzzlesCompleted,
      Math.min(sessionProgress.puzzlesCompleted, sessionProgress.totalPuzzles)
    );

    // Advance to the next session
    const newSession = await updateUserSession(userInfo.userId);

    // Record session completion time
    const now = new Date();
    localStorage.setItem('last_session_time', now.toISOString());
    localStorage.setItem('current_session', newSession);

    // Clear puzzle progress when completing a session
    localStorage.removeItem('current_puzzle_index');
    localStorage.removeItem('puzzles_completed');
    localStorage.removeItem('session_active');
    localStorage.removeItem('session_log_id');
    localStorage.removeItem('session_start_time');

    console.log(`Session completed during logout. Advanced to session ${newSession}`);
    return newSession;
  }

  // Function to cancel logout
  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleLoginSuccess = () => {
    restoreUserSession();
  };

  // When user finishes a session, update to the next one
  const handleSessionComplete = async (progress = {}) => {
    if (!userInfo.userId) return;

    // Update session progress with the final values
    setSessionProgress(progress);

    try {
      const newSession = await updateUserSession(userInfo.userId);

      // Record session completion time
      const now = new Date();
      localStorage.setItem('last_session_time', now.toISOString());
      setLastSessionTime(now);

      // Update local state and localStorage
      setUserInfo(prev => ({
        ...prev,
        currentSession: newSession
      }));
      localStorage.setItem('current_session', newSession);

      // Clear puzzle progress when completing a session
      localStorage.removeItem('current_puzzle_index');
      localStorage.removeItem('puzzles_completed');
      localStorage.removeItem('session_active');
      localStorage.removeItem('session_log_id');
      localStorage.removeItem('session_start_time');

      console.log(`Session completed. Advanced to session ${newSession}`);

      // End the current session
      setSessionActive(false);
      // Show instructions for the next session
      setShowInstructions(true);
      // Reset session progress for next session
      setSessionProgress({
        puzzlesCompleted: 0,
        totalPuzzles: 0,
        currentPuzzleIndex: 0
      });
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  // Add handler to update progress during session
  const handleProgressUpdate = (progress) => {
    // Store current progress in localStorage
    if (progress.currentPuzzleIndex !== undefined) {
      localStorage.setItem('current_puzzle_index', progress.currentPuzzleIndex);
    }

    if (progress.puzzlesCompleted !== undefined) {
      localStorage.setItem('puzzles_completed', progress.puzzlesCompleted);
    }

    setSessionProgress(progress);
  };

  const startSession = async () => {
    if (!userInfo.userId || !userInfo.currentSession) return;

    try {
      const sessionLog = await createSessionLog(userInfo.userId, userInfo.currentSession);
      setSessionLogId(sessionLog.session_log_id);

      // Store session log ID in localStorage
      localStorage.setItem('session_log_id', sessionLog.session_log_id);

      const startTime = Date.now();
      setSessionStartTime(startTime);

      // Store session start time and active state in localStorage
      localStorage.setItem('session_start_time', startTime);
      localStorage.setItem('session_active', 'true');

      setShowInstructions(false);
      setSessionActive(true);
    } catch (error) {
      console.error('Error creating session log:', error);
      // Still allow the session to start even if logging fails
      setShowInstructions(false);
      setSessionActive(true);

      // Store session state even if logging fails
      localStorage.setItem('session_active', 'true');
      localStorage.setItem('session_start_time', Date.now());
    }
  };

  // Check if 24 hours have passed since the last session
  const canStartNextSession = () => {
    if (!lastSessionTime) return true;

    // If the user has completed all sessions, they can't start a new one
    if (userInfo.currentSession > MAX_SESSIONS) return false;

    const now = new Date();
    const hoursSinceLastSession = (now - lastSessionTime) / (1000 * 60 * 60);
    return hoursSinceLastSession >= 24;
  };

  // Check if the user has completed all sessions
  const hasCompletedAllSessions = () => {
    return userInfo.currentSession > MAX_SESSIONS;
  };

  // Common session info for LogoutModal
  const getSessionInfo = () => ({
    currentSession: userInfo.currentSession,
    maxSessions: MAX_SESSIONS,
    puzzlesCompleted: sessionProgress.puzzlesCompleted,
    totalPuzzles: sessionProgress.totalPuzzles || exercises.length
  });

  // Render the logout modal
  const renderLogoutModal = (sessionInfo = null) => (
    <LogoutModal
      isOpen={showLogoutModal}
      onConfirm={performLogout}
      onCancel={cancelLogout}
      sessionInfo={sessionInfo}
    />
  );

  // Get user initials for profile icon
  const getUserInitials = () => {
    if (!userInfo.username) return '?';
    return userInfo.username.charAt(0).toUpperCase();
  };

  // Render user info panel
  const renderUserInfoPanel = () => (
    <div className={styles.userInfoPanel}>
      <div className={styles.profileIcon}>{getUserInitials()}</div>
      <h3>Welcome, {userInfo.username}!</h3>
      <p>Group: {userInfo.groupId}</p>
      <p>Session: {userInfo.currentSession} of {MAX_SESSIONS}</p>
      <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
    </div>
  );

  // Render header with theme toggle and user info
  const renderHeader = () => (
    <div className={styles.headerBar}>
      <div className={styles.userProfile}>
        <div className={styles.profileIcon}>{getUserInitials()}</div>
        <div className={styles.userInfo}>
          <span>User: {userInfo.username} | Group: {userInfo.groupId} | Session: {userInfo.currentSession}/{MAX_SESSIONS}</span>
        </div>
      </div>
      <div className={styles.appTitle}>Chess Research Project</div>
      <div className={styles.headerActions}>
        <ThemeToggle />
        <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
      </div>
    </div>
  );

  // User is not logged in
  if (!isLoggedIn) {
    return (
      <div className={styles.appWrapper}>
        {renderLogoutModal()}
        <Login onLoginSuccess={handleLoginSuccess} />
        <LogoFooter />
      </div>
    );
  }

  // User has completed all sessions
  if (hasCompletedAllSessions()) {
    return (
      <div className={styles.appWrapper}>
        <div className={styles.headerBar}>
          <div className={styles.userProfile}>
            <div className={styles.profileIcon}>{getUserInitials()}</div>
            <div className={styles.userInfo}>
              <span>User: {userInfo.username}</span>
            </div>
          </div>
          <div className={styles.appTitle}>Chess Research Project</div>
          <div className={styles.headerActions}>
            <ThemeToggle />
            <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
          </div>
        </div>
        <StudyCompleted
          username={userInfo.username}
          onLogout={performLogout}
        />
        <LogoFooter />
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={styles.appWrapper}>
        {renderLogoutModal(getSessionInfo())}
        <div className={styles.headerBar}>
          <div className={styles.userProfile}>
            <div className={styles.profileIcon}>{getUserInitials()}</div>
            <div className={styles.userInfo}>
              <span>User: {userInfo.username} | Group: {userInfo.groupId} | Session: {userInfo.currentSession}/{MAX_SESSIONS}</span>
            </div>
          </div>
          <div className={styles.appTitle}>Chess Research Project</div>
          <div className={styles.headerActions}>
            <ThemeToggle />
            <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
          </div>
        </div>
        <div className={styles.loadingContainer}>
          <div className={styles.loader}></div>
          <h2>Loading puzzle exercises...</h2>
        </div>
        <LogoFooter />
      </div>
    );
  }

  // Show instructions screen
  if (!sessionActive && showInstructions) {
    const waitTimeLeft = lastSessionTime && !canStartNextSession() ?
      Math.ceil(24 - ((new Date() - lastSessionTime) / (1000 * 60 * 60))) : 0;

    const isLastSession = userInfo.currentSession === MAX_SESSIONS;

    return (
      <div className={styles.appWrapper}>
        {renderLogoutModal(getSessionInfo())}
        <div className={styles.headerBar}>
          <div className={styles.userProfile}>
            <div className={styles.profileIcon}>{getUserInitials()}</div>
            <div className={styles.userInfo}>
              <span>User: {userInfo.username} | Group: {userInfo.groupId} | Session: {userInfo.currentSession}/{MAX_SESSIONS}</span>
            </div>
          </div>
          <div className={styles.headerActions}>
            <ThemeToggle />
            <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
          </div>
        </div>
        <div className={styles.instructionsContainer}>
          <div className={styles.instructions}>
            <h2>Instructions</h2>
            <div className={`${styles.instructionsContent} dark-mode-card`}>
              <ul>
              <li>The training program consists of 5 learning sessions, during which you will solve chess puzzles.</li>
              <li>After completing each session, you must wait <b>24 hours</b> before starting the next one. You will receive a reminder via email when it is time for your next session. </li>
              <li>During each session, try to solve as many puzzles correctly as possible. </li>
              <li>Every exercise has only <b>one correct</b> solution.</li>
              <li>You have 2 minutes to solve each puzzle – in that time you will need to make between one and three moves. </li>
              <li>You have only <b>one</b> attempt to solve the puzzle, so think carefully before making a move. </li>
              <li>You will receive feedback with the correct solution. You can review it by clicking the arrows next to the chessboard. You will have 45 seconds to study the correct moves – use this time to memorize the solution. </li>
              </ul>
              {isLastSession && (
                <div className={styles.finalSessionNote}>
                  <p><strong>Note:</strong> This is your final session in the study. Thank you for your participation!</p>
                </div>
              )}
              <strong>After completing 5 training sessions, you will be asked via email to participate in the final test. </strong>

            </div>

            {userInfo.currentSession > 1 && lastSessionTime && !canStartNextSession() ? (
              <div className={styles.waitMessage}>
                <h3>Please wait before starting the next session</h3>
                <p>You need to wait at least 24 hourss between sessions.</p>
                <p>Time remaining: approximately {waitTimeLeft} hour{waitTimeLeft !== 1 ? 's' : ''}</p>
              </div>
            ) : (
              <div className={styles.startPrompt}>
                <h3>Are you ready to begin?</h3>
                <button
                  onClick={startSession}
                  className={styles.startSessionButton}
                  disabled={userInfo.currentSession > 1 && !canStartNextSession()}
                >
                  Yes, I'm ready
                </button>
              </div>
            )}
          </div>
        </div>
        <LogoFooter />
      </div>
    );
  }

  // Display user info and session start button
  if (!sessionActive) {
    const isLastSession = userInfo.currentSession === MAX_SESSIONS;

    return (
      <div className={styles.appWrapper}>
        {renderLogoutModal(getSessionInfo())}
        <div className={styles.headerBar}>
          <div className={styles.userProfile}>
            <div className={styles.profileIcon}>{getUserInitials()}</div>
            <div className={styles.userInfo}>
              <span>User: {userInfo.username} | Group: {userInfo.groupId} | Session: {userInfo.currentSession}/{MAX_SESSIONS}</span>
            </div>
          </div>
          <div className={styles.appTitle}>Chess Research Project</div>
          <div className={styles.headerActions}>
            <ThemeToggle />
            <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
          </div>
        </div>
        <div className={styles.sessionStart}>
          <div className={styles.startSessionContainer}>
            <h2>Chess Puzzle Training</h2>
            {isLastSession && (
              <div className={styles.finalSessionNote}>
                <p><strong>Note:</strong> This is your final session in the study. Thank you for your participation!</p>
              </div>
            )}
            <p>Ready to solve some chess puzzles?</p>
            <button
              onClick={() => setShowInstructions(true)}
              className={styles.instructionsButton}
            >
              View Instructions
            </button>
            <button
              onClick={startSession}
              className={styles.startSessionButton}
              disabled={userInfo.currentSession > 1 && !canStartNextSession()}
            >
              Start Puzzle Session
            </button>
          </div>
        </div>
        <LogoFooter />
      </div>
    );
  }
  

  // Render the PuzzleSolver with the loaded exercises
  return (
    <div className={styles.appWrapper}>
      {renderLogoutModal(getSessionInfo())}
      <div className={styles.appContainer}>
        {/* <button onClick={toggleMenu}>Toggle Menu</button> */}
        {headerMenu && (
        <div className={styles.headerBar} style={{ position: 'relative' }}> 
          <>
          <div className={styles.userProfile}>
            <div className={styles.profileIcon}>{getUserInitials()}</div>
            <div className={styles.userInfo}>
              <span>User: {userInfo.username} | Group: {userInfo.groupId} | Session: {userInfo.currentSession}/{MAX_SESSIONS}</span>
            </div>
          </div>
          <div className={styles.appTitle}>Chess Research Project</div>
          <div className={styles.headerActions}>
            <ThemeToggle />
            <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
          </div>
          </>
        </div>
        )}
        <div className={styles.puzzleSolverContainer}>
          <PuzzleSolver
            exercises={exercises}
            onComplete={handleSessionComplete}
            onProgressUpdate={handleProgressUpdate}
            userId={userInfo.userId}
            sessionId={userInfo.currentSession}
            sessionLogId={sessionLogId}
            initialPuzzleIndex={sessionProgress.currentPuzzleIndex}
          />
        </div>
      </div>
      <LogoFooter />
    </div>
  );
}

export default App;