
class QuizPage extends Page {

    constructor() {
        super();
        this.showQuiz();

        this.full_screen_element = document.getElementById("full_screen_element");
        this.question_1 = document.getElementById("quiz_question1");
        this.question_2 = document.getElementById("quiz_question2");
        this.next_button = document.getElementById("next_quiz");

        this.question_1.value = 0;
        this.question_2.value = 0;
    }

    setCallback(callback) {
        this.next_button.onclick = function() {
            console.log("INFO: next button clicked.")
            callback();
        };

        if (!isFullScreenCurrently()) {
            goFullscreen(this.full_screen_element);
        }
    }

    getQuestion1() {
        return this.question_1;
    }

    getQuestion2() {
        return this.question_2;
    }

    getAllQuestions() {
        return [this.getQuestion1(), this.getQuestion2()]
    }
}
