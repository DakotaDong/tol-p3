const csvToJson = require('csvtojson');
const fs = require('fs');

let questionList = [];
let optionList = {};

const readCsv = async (path, next) => {
  await csvToJson()
  .fromFile(path)
  .then((json) => {
      next(json);
  });
};
// parse questions
const parseQuestions = (data) => {
  for (var i = 0; i < data.length; i++) {
    var q = data[i];
    // correctAnswer refers to the storage of Correct_answer_choice
    let correctAnswer = '';
    // correctNum refers to the number of correct answer(s)
    let correctNum = 0;
    const correctChoices = q.Correct_answer_choice.replace(' ', '').split(',');
    for (const choice of correctChoices) {
      correctAnswer += q['Choice_' + choice + '_text'];
      correctNum++;
    }
    // Create question object and add it into the questionList
    var question = {
      qid: q.Question_id,
      text: q.Question_text,
      correctAnswer: correctAnswer,
      correctNum: correctNum,
      options: []
    }
    questionList.push(question);
  }
  console.log('Finished parsing questions');
};
// parse options
const parseOptions = (data) => {
  // create relevant lists 
  var difficultyList = {};
  var quizScoreList = {};
  var avgScoreList = {};
  for (var i = 0; i < data.length; i++) {
    var o = data[i];
    var qid = o.Question_id;
    if (optionList[qid] == null) {
      optionList[qid] = [];
      difficultyList[qid] = 0;
      quizScoreList[qid] = 0;
      avgScoreList[qid] = 0;
    }
    // Create option object and add it into the questionList
    var option = {
      qid: qid,
      text: o.Answer_text,
      // the sign to indicate whether the choice is correct
      isCorrect: false, 
      // the sign to indicate whether the choice is useful as choice/feedback
      isUseful: false, 
      isUsedAsOption: false,
      isUsedAsFeedback: false,
      score: Number(o.Student_score_on_question),
      quizScore: Number(o.Quiz_score),
      avgScore: Number(o.Average_quizzes_score),
      irtCorrectness: 0.0
    }
    optionList[qid].push(option);
    // update relevant lists (current values are sums of all options' score for the question)
    difficultyList[qid] += option.score;
    quizScoreList[qid] += option.quizScore;
    avgScoreList[qid] += option.avgScore;
  }

  // Calculate actual difficulty, quiz and avg scores
  for (let [i, options] of Object.entries(optionList)) {
    var optionCount = options.length;
    var score = difficultyList[i];
    difficultyList[i] = score / optionCount;
    var quizScore = quizScoreList[i];
    quizScoreList[i] = quizScore / optionCount;
    var avgScore = avgScoreList[i];
    avgScoreList[i] = avgScore / optionCount;
  }

  // Analyze options to update the purpose of each choice (isCorrect, isUseful)
  for (let [i, options] of Object.entries(optionList)) {
    for (var j = 0; j < options.length; j++) {
      var op = options[j];
      analyzeOption(op, quizScoreList[i], avgScoreList[i]);
      calculateIRTCorrectness(op, difficultyList[i]);
    }
  }
  console.log('Finished parsing options');
};

// analyze options to determine whether they are to be correct/incorrect, and useful/unuseful
const analyzeOption = (option, quizScoreAvg, avgScoreAvg) => {
  // Check score first, if <=0.5, can be considered as incorrect choice
  if (option.score <= 0.5) {
    option.isCorrect = false;
    option.isUseful = true;
    return;
  }
  // Check length
  // if (option.text.length < 40) {
  //   option.isCorrect = false;
  //   option.isUseful = true;
  //   return;
  // }

  // if choice score > 0.5, further check quiz core to make sure the choice is worthwhile as the correct choice
  if (option.quizScore >= quizScoreAvg || option.avgScore >= avgScoreAvg) {
    option.isCorrect = true;
    option.isUseful = true;
  }
};

// calculate IRT Correctness by IRT Rasch Model
const calculateIRTCorrectness = (option, difficulty) => {
  var ability = (option.quizScore + option.avgScore) / 2.0;
  option.irtCorrectness = Math.exp(ability - difficulty) / (1 + Math.exp(ability - difficulty));
};

const sortOptions = () => {
  for (let [i, options] of Object.entries(optionList)) {
    optionList[i] = {
      correct: [],
      incorrect: []
    };
    // descending sort by irtCorrectness
    options = options.sort((a, b) => {
      return b.irtCorrectness - a.irtCorrectness;
    });
    // update choiceList in order to make most correct choice on the correct choice top
    for (const option of options) {
      if (option.isUseful) {
        if (option.isCorrect) {
          optionList[i].correct.push(option);
        } else {
          optionList[i].incorrect.push(option);
        }
      }
    }
    // Reverse incorrect options
    optionList[i].incorrect.reverse();
  }
};

// export question/option list to Json file
const exportToJson = (data, path) => {
  fs.writeFile(path, data, 'utf8', (err) => {
    if (err) throw err;
    console.log('Finished exporting json to', path);
  });
};
 
const generator = async () => {
  await readCsv('../data/questions.csv', parseQuestions);
  await readCsv('../data/answers.csv', parseOptions);
  sortOptions();
  exportToJson(JSON.stringify(questionList), '../data/questions.json');
  exportToJson(JSON.stringify(optionList), '../data/options.json');
};

generator();
