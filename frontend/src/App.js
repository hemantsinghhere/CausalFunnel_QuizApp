import React, { useState, useEffect } from "react";
import axios from "axios";
import './App.css'; // Link to the external CSS

const App = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [visitedQuestions, setVisitedQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [isQuizEnd, setIsQuizEnd] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
  const [email, setEmail] = useState("");
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await axios
          .get("https://opentdb.com/api.php?amount=15")
          .then((response) => {
            const formattedQuestions = response.data.results.map((q) => ({
              ...q,
              question: decodeHTML(q.question),
              correct_answer: decodeHTML(q.correct_answer),
              incorrect_answers: q.incorrect_answers.map((ans) => decodeHTML(ans)),
            }));
            setQuestions(formattedQuestions);
          });
      } catch (error) {
        console.log("Error:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!isQuizEnd) {
      const timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            handleQuizSubmit();
          }
          return prevTime - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isQuizEnd]);

  useEffect(() => {
    // Fetch leaderboard data from the backend
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get("https://causalfunnel-quizapp.onrender.com/leaderboard");
        setLeaderboard(response.data);
      } catch (error) {
        console.log("Error fetching leaderboard:", error);
      }
    };
    if (isQuizEnd) {
      fetchLeaderboard();
    }
  }, [isQuizEnd, score]); // Refetch leaderboard after quiz ends and score updates

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (answer) => {
    setUserAnswers({
      ...userAnswers,
      [currentQuestion]: answer,
    });
    setVisitedQuestions([...new Set([...visitedQuestions, currentQuestion])]);
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const navigateToQuestion = (index) => {
    setCurrentQuestion(index);
    setVisitedQuestions([...new Set([...visitedQuestions, index])]);
  };

  const handleQuizSubmit = async () => {
    const calculatedScore = questions.reduce((total, question, index) => {
      return userAnswers[index] === question.correct_answer ? total + 1 : total;
    }, 0);
    setScore(calculatedScore);
    setIsQuizEnd(true);

    // Send score to backend to update leaderboard
    try {
      await axios.post("https://causalfunnel-quizapp.onrender.com/submit-score", {
        email,
        score: calculatedScore,
      });
    } catch (error) {
      console.log("Error updating leaderboard:", error);
    }
  };

  const decodeHTML = (str) => {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = str;
    return textarea.value;
  };

  const handleStartQuiz = () => {
    if (email) {
      setIsQuizStarted(true); // Start the quiz after email submission
    } else {
      alert("Please enter a valid email to start the quiz.");
    }
  };

  return (
    <div className="app-container">
      {!isQuizStarted ? (
        <div className="start-screen">
          <h1>Welcome to the Trivia Quiz</h1>
          <p>Please enter your email address to start the quiz:</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
          <button onClick={handleStartQuiz}>Start Quiz</button>
        </div>
      ) : (
        <div className="quiz-container">
          <h1>Trivia Quiz</h1>
          {!isQuizEnd ? (
            <>
              <div className="quiz-header">
                <h3>Time Left: {formatTime(timeLeft)}</h3>
                <button onClick={handleQuizSubmit}>Submit Quiz</button>
              </div>
              <div className="overview-panel">
                {questions.map((_, index) => (
                  <button
                    key={index}
                    style={{
                      backgroundColor: visitedQuestions.includes(index)
                        ? userAnswers[index]
                          ? "green"
                          : "purple"
                        : "black",
                    }}
                    onClick={() => navigateToQuestion(index)}
                  >
                    Q{index + 1}
                  </button>
                ))}
              </div>

              {questions.length > 0 && (
                <div className="question-panel">
                  <h2>{questions[currentQuestion].question}</h2>
                  {[...questions[currentQuestion].incorrect_answers, questions[currentQuestion].correct_answer].map(
                    (answer, index) => (
                      <button
                        key={index}
                        className={`answer-button ${
                          userAnswers[currentQuestion] === answer ? "selected" : ""
                        }`}
                        onClick={() => handleAnswer(answer)}
                      >
                        {answer}
                      </button>
                    )
                  )}
                </div>
              )}
            </>
          ) : (
            <EndQuizReport questions={questions} userAnswers={userAnswers} score={score} />
          )}
        </div>
      )}

      {isQuizEnd && <Leaderboard leaderboard={leaderboard} />}
    </div>
  );
};

const EndQuizReport = ({ questions, userAnswers, score }) => {
  return (
    <div className="quiz-report-container">
      <h2 className="quiz-report-title">Quiz Report</h2>
      <p className="quiz-report-score">
        <strong>Total Score:</strong> {score} / {questions.length}
      </p>
      <div className="questions-container">
        {questions.map((q, index) => (
          <div key={index} className="question-item">
            <p className="question-text">
              <strong>Question {index + 1}:</strong> {q.question}
            </p>
            <p
              className={`answer-text ${
                userAnswers[index] === q.correct_answer ? "correct" : "incorrect"
              }`}
            >
              <strong>Your Answer:</strong> {userAnswers[index] || "Not Attempted"}
            </p>
            <p className="correct-answer">
              <strong>Correct Answer:</strong> {q.correct_answer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const Leaderboard = ({ leaderboard }) => {
  return (
    <div className="leaderboard-container">
      <h2 className="leaderboard-title">Leaderboard</h2>
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry, index) => (
            <tr key={index}>
              <td>{entry.email}</td>
              <td>{entry.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default App;
