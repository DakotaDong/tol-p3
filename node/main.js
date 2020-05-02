/* Get questions & options */
var questionList = [];
var optionList = [];

function readJson(path, next) {
  $.ajax({
    type: 'GET',
    url: path,
    dataType: 'json',
    success: function(data) {
      console.log(data);
      next(data);
    }
  });
}

/* Generate quiz */
var currentIndex = 0;
// pick feedback that has not been used as choice and feedback before
function pickFeedback(qid) {
  var feedback = '';
  for (var option of optionList[qid].correct) {
    if (!option.isUsedAsOption && !option.isUsedAsFeedback) {
      option.isUsedAsFeedback = true;
      feedback = option.text;
      break;
    }
  }
  return feedback;
}

// pick choices that has not been used as choice and feedback before
function pickOptions(qid) {
  var options = [];
  var incorrectOptions = optionList[qid].incorrect.filter(function (x) {
    return !x.isUsedAsOption;
  });
  var correctOptions = optionList[qid].correct.filter(function (x) {
    return !x.isUsedAsOption && !x.isUsedAsFeedback;
  });
  var totalCount = 4;
  var incorrectCount = 0;
  // Generate the number of incorrect options (ensure its number <= incorrectOptions.length)
  do {
    incorrectCount = Math.floor(Math.random() * Math.min(totalCount, incorrectOptions.length));
  } while (incorrectCount + correctOptions.length < totalCount);
  // Pick incorrect options
  for (var i = 0; i < incorrectCount; i++) {
    var op = incorrectOptions[i];
    op.isUsedAsOption = true;
    options[i] = op;
  }
  // Pick correct options
  for (var i = 0; i < totalCount - incorrectCount; i++) {
    var op = correctOptions[i];
    op.isUsedAsOption = true;
    options[i + incorrectCount] = op;
  }
  // Pick correct options
  for (var i = 0; i < totalCount - incorrectCount; i++) {
    var op = correctOptions[i];
    op.isUsedAsOption = true;
    options[i + incorrectCount] = op;
  }
  // Shuffle options
  options.sort(function() {
    return Math.random() - 0.5;
  });
  return options;
}

function loadQuestion() {
  var quiz = questionList;
  var q = quiz[currentIndex++];
  q.options = pickOptions(q.qid);
  q.feedback = pickFeedback(q.qid);
  // update question
  $('#scene-question h2').text('Question ' + currentIndex);
  $('#scene-question .question').text(q.text + ' Select all that apply:');
  $('#scene-question .btn-continue').addClass('btn-disabled');
  $('#scene-question .select').empty();
  // update options and feedback
  q.options.forEach(function(option, i) {
    $('#scene-question .select').append(createOption(option, i));
    if (option.isCorrect) {
      $('#scene-correct p').text(' Key(s): ' + q.feedback);
    } else {
      $('#scene-wrong p').text(' Key(s): ' + q.feedback);
    }
  });
}

function createOption(op, i) {
  var correct = op.isCorrect ? '1' : '0';
  var nums = ['A', 'B', 'C', 'D'];
  var num = nums[i];
  return '<div class="frame option" data-correct="' + correct + '">\
    <p>' + num + '. ' + op.text + '</p>\
  </div>';
}

/* Show scenes */
var correctCount = 0;
var remainCount = 1;

function hideBoard() {
  $('.scene').hide();
  $('#board').hide();
}
function showBoard(scene) {
  $('.scene').hide();
  $('#board').show();
  showScene(scene);
}
function continueScene(el) {
  var next = $(el).data('next');
  console.log(next);
  $(el).parent('.scene').fadeOut(function () {
    $(next).fadeIn();
  });
}
function showScene(target, prep) {
  var $scene = $('.scene:visible');
  if ($scene.length == 0) {
    console.log('SHOW', target);
    if (prep) {
      prep();
    }
    $(target).show();
  } else {
    $('.scene:visible').fadeOut(function () {
      console.log('FADE IN', target);
      if (prep) {
        prep();
      }
      $(target).fadeIn();
    });
  }
}
function displayResult() {
  $('.count-correct').text(correctCount);
  $('.count-total').text(questionList.length);
  $('.count-remain').text(remainCount);
  if (remainCount <= 0) {
    $('.btn-retake').addClass('btn-disabled');
  }
}
function retake() {
  correctCount = 0;
  currentIndex = 0;
  showScene('#scene-question', loadQuestion);
  remainCount--;
}

/* Quiz generator */
function registerEvents() {
  $('.btn-retake').click(function () {
    if (!$(this).hasClass('btn-disabled')) {
      retake();
    }
  })
  $('.btn-continue').click(function () {
    if (!$(this).hasClass('btn-disabled')) {
      continueScene(this);
    }
  })
  $('.btn-select-option').click(function () {
    if (!$(this).hasClass('btn-disabled')) {
      var $options = $(this).parent('.scene').find('.option');
      var correct = true;
      for (var i = 0; i < $options.length; i++) {
        var $op = $options.eq(i);
        var opCorrect = $op.data('correct') == 1;
        var opSelected = $op.hasClass('option-selected');
        if (opCorrect != opSelected) {
          correct = false;
          break;
        }
      }
      console.log('Answer', correct);
      if (correct) {
        correctCount++;
        showScene('#scene-correct');
      } else {
        showScene('#scene-wrong');
      }
    }
  })
  $('.btn-next-question').click(function () {
    if (currentIndex == questionList.length) {
      displayResult();
      showScene('#scene-end');
    } else {
      showScene('#scene-question', loadQuestion);
    }
  })
  $('.select').on('click', '.option', function () {
    var $select = $(this).parent('.select');
    if (!$select.hasClass('select-disabled')) {
      $(this).toggleClass('option-selected');

      var $btn = $select.parent('.scene').children('a');
      if ($select.find('.option-selected').length > 0) {
        $btn.removeClass('btn-disabled');
      } else {
        $btn.addClass('btn-disabled');
      }

      var next = $(this).data('next');
      if (next) {
        var target = $select.data('target');
        var $btnTarget = $(target).children('a');
        $btnTarget.data('next', next);
      }
    }
  })
}

$(document).ready(function () {
  registerEvents();
  showBoard('#scene-start');
  // read json files
  readJson('data/questions.json', function(questions) {
    questionList = questions;
    readJson('data/options.json', function(options) {
      optionList = options;
      loadQuestion();
    });
  });
});
