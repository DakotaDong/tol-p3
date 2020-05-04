# tol-p3
 
 Choice/option selection mechanism:
In terms of how we select four options for each question, including right and wrong options for users, we experienced several stages to increase the accuracy of our chosen:
We started from reading csv file to json and then parsed the correct answer from each row to prepare for the future implementation. 

snippets of code (1)

We also created a question object to store information along the way of iterating each row. The most relevant part to choice selection mechanisms are:

First of all, we created a parseOptions object to store all of the options including right and wrong options:
create relevant lists (difficultyList, quizScoreList, avgScoreList) in order to check whether the choice will be used as choice, feedback or not
Use for loop to iterate every row, create choiceList if it’s the first time to encounter current questionID (qid)
Create option object and add it into the right position of the choiceList





snippets of code(2)

Update relevant lists in the right position (check by qid) 

Then we further analyze options to determine whether each option is right or wrong , useful and unuseful. We have this method: analyzeOptions():
Check score first, if <=0.5, can be directly considered as incorrect choice
if score > 0.5, further check quiz score to make sure that the choice is worthwhile as the correct choice since students may get the right answer by guessing but their explanations are not meaningful or even wrong;
Notice: there’s a case that the score > 0.5, but since the student’s quizScore < quizScoreAvg, we’ll just ignore this choice

Notice: Why don't we include Answer_text.length and Average_quizzes_score to analyze the choice?
We planned to use Answer_text.length as another evidence before, but the data analysis shows there is no significant relationship between the explanation length and score. The same for average quiz score and current quiz score. They don’t have a significant relationship from the given dataset.







snippets of code(3)


After we had two groups of options, we kept moving forward to rank the options within each group in order to continuously increase the accuracy of picking and selecting options in the next step. We used IRT model -  calculateIRTCorrectness():
In order to make the given choices in the quiz more reasonable, we calculated  IRT Correctness (the possibility of success upon interaction between relevant person and assessment item) by IRT Rasch Model.
The reason why we use IRT：it is great for summartive testing and can give relevant and good feedback. 

Our calculation is: 
ability = (choice.quizScore + choice.score * 10) / 2.0; 
(Notice: we use both current quiz score and current question score here, since both of them can reflect students’ abilities; we used to use (choice.quizScore + choice.avgScore) / 2.0 to calculate ability, but the results show that students who get the wrong answer may have higher ability, which is not suitable in this case, so we didn’t consider the average of all quizzes’ scores here.)
Difficulty: the average of the sum of all choices’ scores in certain question choice.irtCorrectness = Math.exp(ability - difficulty) / (1 + Math.exp(ability - difficulty));
snippets of code

SortChoices
We used descending sort by irtCorrectness in order to make the most correct choice, which is the highest possibility of success upon interaction between relevant person and assessment item on the top of the correct choice array. 

The last step we did here is to generate the number of incorrect options we want to display on the website and then count the number of correct options we want to show accordingly. 



The question retake mechanism:
Students are allowed to retake the quiz for one time. We assign the same question text with a different set of choices that are selected with the previous ones ruled out. Options that are used before as a correct option of feedback will be taken out of the correct option pool for the retake quiz. 

snippets of code(1)


snippets of code(2)


Feedback mechanism supported by theory:
As introduced above, the feedbacks are selected from the correct options pool with the previously used ones (used as options & feedback) excluded.



Summary of what worked and what didn’t, using the model on the validation set:
Overall the model works well except for that we didn’t make the differentiation between single answer multiple choices and multiple answer multiple choices. 
Future improvement reflection:
For future improvements, we hope to iterate the retake and option assign mechanisms. For the retakes, we hope to only assign students with questions they have done incorrectly. For the option assign mechanisms, we hope to differentiate questions into multiple choices with a single correct answer and multiple choices with multiple correct answers.

