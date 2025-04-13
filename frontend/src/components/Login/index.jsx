import { useState, useEffect } from 'react';
import { loginUser } from '../../api/users';
import { registerUserInDb, loginUserFromDb } from '../../api/database';
import ThemeToggle from '../ThemeToggle';
import styles from './Login.module.css';


const Login = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [nextAvailableTime, setNextAvailableTime] = useState(null);
    const [hoursLeft, setHoursLeft] = useState(0);
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showConsentText, setShowConsentText] = useState(false);
    const [showResearchInfoModal, setShowResearchInfoModal] = useState(false);
    const [consentAccepted, setConsentAccepted] = useState(true);
    const [hasReadInfo, setHasReadInfo] = useState(false);
    const [checkboxAccepted, setCheckboxAccepted] = useState(false);



    const handleSwitchToRegister = () => {
        setIsRegistering(true);
        setError('');
        setNextAvailableTime(null);
        setShowResearchInfoModal(true);
    };


    const handleCloseResearchInfoModal = () => {
        setShowResearchInfoModal(false);
        setHasReadInfo(true);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();


        if (isRegistering && !consentAccepted) {
            setError('You must read and accept the research information first');
            return;
        }


        setLoading(true);
        setError('');
        setNextAvailableTime(null);
        setHoursLeft(0);


        try {
            if (isRegistering) {
                // Register new user with direct database connection
                const userData = await registerUserInDb(username, password);


                // Store user data in localStorage
                localStorage.setItem('access_token', userData.access_token);
                localStorage.setItem('user_id', userData.user_id);
                localStorage.setItem('username', userData.username);
                localStorage.setItem('group_id', userData.group_id);
                localStorage.setItem('current_session', userData.current_session);


                // Log the registration
                console.log(`User registered: ${username}, Group: ${userData.group_id}, Session: ${userData.current_session}`);


                onLoginSuccess();
            } else {
                // Login logic
                try {
                    const userData = await loginUserFromDb(username, password);
                    localStorage.setItem('access_token', userData.access_token);
                    localStorage.setItem('user_id', userData.user_id);
                    localStorage.setItem('username', userData.username);
                    localStorage.setItem('group_id', userData.group_id);
                    localStorage.setItem('current_session', userData.current_session);
                    if (userData.next_available_at) {
                        localStorage.setItem('next_available_at', userData.next_available_at);
                    }
                    console.log(`User logged in: ${username}, Group: ${userData.group_id}, Session: ${userData.current_session}`);
                    onLoginSuccess();
                } catch (dbError) {
                    console.warn('Direct DB login failed:', dbError);
                    if (dbError.response && dbError.response.status === 403 && dbError.response.data.next_available_at) {
                        setNextAvailableTime(new Date(dbError.response.data.next_available_at));
                        setHoursLeft(dbError.response.data.hours_left || 24);
                        setError('You cannot login yet. Please wait 24 hours between sessions.');
                    } else {
                        console.warn('Trying API login');
                        try {
                            await loginUser(username, password);
                            onLoginSuccess();
                        } catch (apiError) {
                            console.error('API login failed:', apiError);
                            setError('Invalid username or password');
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Login/Registration error:', err);
            setError(isRegistering ? 'Registration failed' : 'Invalid username or password');
        } finally {
            setLoading(false);
        }
    };


    const formatNextAvailable = () => {
        if (!nextAvailableTime) return '';
        return nextAvailableTime.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };


    return (
        <div className={styles.loginContainer}>
            <div className={styles.appTitleContainer}>
                <h1 className={styles.appTitle}>Chess Research Project</h1>
                <div className={styles.themeToggleWrapper}>
                    <ThemeToggle />
                </div>
            </div>


            {showResearchInfoModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalContent}>
                            <h3>Information about the research</h3>
                            <p>
                                You are invited to take part in a research study which aims to investigate different strategies for learning chess/solving chess-related tasks.
                                We are conducting this research as the Students’ Union PRAGMA project.
                                This study has been reviewed and approved by the Ethics Committee of the Department of Management and Social Communication at Jagiellonian University.
                                Please take the time to read the following instructions carefully.
                                If anything is unclear or you would like more information, contact the researchers.
                            </p>
                            <h4>What will happen?</h4>
                            <p>
                                Over the course of two weeks, you will participate in five learning sessions and complete a final test.
                                There must be at least one day between each session.
                                After the final test, you will be asked to answer a few questions.
                                Each learning session and final test will take approximately 1 hour.
                                You will receive an email with a link to join the learning sessions;
                                this link will remain the same throughout the study. Reminders to complete sessions will also be sent via email.
                            </p>
                            <h4>Participant rights</h4>
                            <ul>
                                <li>Your participation is voluntary and you are free to leave the study at any point without explanation and without any of your medical, social care, education, or legal rights being affected.</li>
                                <li>You have the right to omit or refuse to answer or respond to any question that is asked of you.</li>
                                <li>You have the right to ask that any data you have supplied to that point be withdrawn/destroyed.</li>
                                <li>If you wish to withdraw from the study during the experiment, please notify experimenters.</li>
                                <li>After the final session, data may be withdrawn from the study up until the point that the data collection period has completed and the data have been anonymised and collated.</li>
                                <li>Please contact the PI (dominik.krych@student.uj.edu.pl) within a week of your participation quoting your participant ID number to request withdrawal of your data.</li>
                                <li>After this date it will no longer be possible to remove your data but nor will it be possible to identify it or link it to you.</li>
                            </ul>
                            <h4>Benefits and risks</h4>
                            <p>
                                There are no known benefits or risks beyond everyday life for you in this study.
                            </p>
                            <h4>Compensation</h4>
                            <p>
                                After completing the procedure, you will receive access to a database of chess tasks with solutions.
                                Additionally, participants will be entered into a draw for vouchers worth approximately 200 PLN.
                            </p>
                            <h4>Confidentiality</h4>
                            <p>
                                The data you provide will be identified by a participant number and will not be linked to identifying information you have supplied.
                                During the data collection period, your data will be stored securely on password-protected computers.
                                The data will only be accessed by the researcher and supervisor named above and will not be shared with any other organisations.
                            </p>
                            <h4>What will happen with my data?</h4>
                            <p>
                                We will be using information from you in order to undertake this study and will act as the data controller for this study.
                                This means that we are responsible for looking after your information and using it properly.
                                Jagiellonian University will keep identifiable information about you for week after the study has finished.
                                Anonymised data will be held for 7 years following completion of the study.
                                Your rights to access, change or move your information are limited, as we need to manage your information in specific ways in order for the research to be reliable and accurate.
                                Jagiellonian University has in place policies and procedures to keep your data safe.
                                This data may also be used for future research following review and approval by an independent Research Ethics Committee.
                            </p>
                            <h4>What will happen to the results of the study?</h4>
                            <p>
                                The results of this study will be reported journal publications and conference presentations.
                                The project does not involve or report comparisons or evaluations of individuals; the results will be reported anonymously.
                                Anonymised data will be submitted to journals.
                            </p>
                            <h4>Who should I contact if I want further information?</h4>
                            <p>
                                For questions about the study, contact the principal investigator: Dominik Krych, dominik.krych@student.uj.edu.pl
                            </p>
                            <h4>Who should I contact if I wish to make a complaint?</h4>
                            <p>
                                For complaints, contact the supervisor: Dr. Aleksandra Krogulska: aleksandra.krogulska@amu.edu.pl
                            </p>
                            <button
                                type="button"
                                onClick={handleCloseResearchInfoModal}
                                className={styles.modalButton}
                            >
                                I Understand
                            </button>
                        </div>
                    </div>
                </div>
            )}


            <form onSubmit={handleSubmit} className={styles.loginForm}>
                <h2>{isRegistering ? 'Register' : 'Login'}</h2>


                {error && (
                    <div className={styles.error}>
                        <p>{error}</p>
                        {nextAvailableTime && (
                            <div className={styles.timeRestriction}>
                                <p>You can login again in approximately {hoursLeft} hour{hoursLeft !== 1 ? 's' : ''}.</p>
                                <p>Next available: {formatNextAvailable()}</p>
                            </div>
                        )}
                    </div>
                )}


                <div className={styles.inputGroup}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={loading || showResearchInfoModal}
                        required
                    />
                </div>
                <div className={styles.inputGroup}>
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading || showResearchInfoModal}
                        required
                    />
                </div>


                {isRegistering && hasReadInfo && (
                    <div className={styles.consentGroup}>
                        <input
                            type="checkbox"
                            id="consent"
                            name="consent"
                            checked={checkboxAccepted}
                            onChange={() => setCheckboxAccepted(!checkboxAccepted)}
                            required
                        />
                        <div onClick={() => setShowConsentText(!showConsentText)}>
                            I agree to participate in the study and give consent. <span className={styles.expandIcon}>{showConsentText ? '▲' : '▼'}</span>
                        </div>
                        {showConsentText && (
                            <div className={styles.consentText}>
                                <p>
                                    1. I confirm that I have read and understand the information sheet for the above study. I have had the opportunity to consider the information, ask questions and have had these answered satisfactorily. <br />
                                    2. I understand that my participation is voluntary and that I am free to withdraw at any time without giving any reason, without my medical, social care, education, or legal rights being affected. <br />
                                    3. I understand that my data collected during the study, may be looked at by the researchers and her supervisor (Dr Aleksandra Krogulska). I give permission for these individuals to have access to my data. <br />
                                    4. I understand that my data may be used in future research. <br />
                                    5. I agree to take part in the above study. <br />
                                </p>
                            </div>
                        )}
                    </div>
                )}


                <button
                    type="submit"
                    disabled={loading || (isRegistering && !checkboxAccepted)}
                    className={styles.submitButton}
                >
                    {loading ? 'Processing...' : (
                        <>
                            <svg className={styles.chessIcon} viewBox="0 0 24 24" width="24" height="24">
                                <path d="M19,22H5V20H19V22M17,10H12V15H7V10H2L12,0L22,10H17M7,15H17V17H7V15Z" fill="white" />
                            </svg>
                            {isRegistering ? 'Register' : 'Login'}
                        </>
                    )}
                </button>


                <div className={styles.switchModeContainer}>
                    <button
                        type="button"
                        onClick={isRegistering ? () => setIsRegistering(false) : handleSwitchToRegister}
                        className={styles.switchModeButton}
                        disabled={loading || showResearchInfoModal}
                    >
                        {isRegistering ? 'Already have an account? Login' : 'New? Register'}
                    </button>
                </div>
            </form>
        </div>
    );
};


export default Login;