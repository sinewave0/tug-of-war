const { createRoom, joinRoom, rooms } = require('../src/roomManager');
const {
  createGame,
  startGame,
  validateAnswer,
  handleCorrectAnswer,
  endGame,
  generateQuestion,
} = require('../src/gameEngine');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runStress() {
  const originalLog = console.log;
  console.log = () => {};

  for (let index = 0; index < 5000; index += 1) {
    const question = generateQuestion();
    assert(question && question.id && question.text, 'Invalid question shape');
    assert(Number.isInteger(question.answer), 'Question answer is not an integer');
    const questionNumbers = question.text.match(/\d+/g)?.map(Number) ?? [];
    assert(questionNumbers.every((value) => value < 100), 'Question contains a number >= 100');
  }

  const roomId = createRoom();
  joinRoom(roomId, { id: 'p1', username: 'Alice', socketId: 's1' });
  joinRoom(roomId, { id: 'p2', username: 'Bob', socketId: 's2' });

  createGame(roomId);
  startGame(roomId);

  const room = rooms.get(roomId);
  assert(room, 'Room missing after setup');
  assert(room.currentQuestion, 'No initial question after start');

  for (let round = 0; round < 150; round += 1) {
    const currentQuestion = room.currentQuestion;
    assert(currentQuestion, `Missing question in round ${round}`);

    const wrongAnswerAccepted = validateAnswer(roomId, currentQuestion.id, currentQuestion.answer + 1);
    assert(!wrongAnswerAccepted, `Wrong answer accepted in round ${round}`);

    handleCorrectAnswer(roomId, round % 2 === 0 ? 'p1' : 'p2');
    if (room.status === 'finished') {
      break;
    }
  }

  if (room.status !== 'finished') {
    endGame(roomId, 'time_up');
  }

  assert(room.status === 'finished', 'Game did not end');
  assert(Math.abs(room.ropePosition) <= 100, 'Rope position exceeded bounds');
  assert(room.players.every((player) => player.score >= 0), 'Negative score detected');

  console.log = originalLog;
  console.log('Stress test passed: question generation and game flow are stable.');
}

try {
  runStress();
  process.exit(0);
} catch (error) {
  console.error('Stress test failed:', error.message);
  process.exit(1);
}
