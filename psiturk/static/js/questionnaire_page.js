class QuestionnairePage extends Page {

    constructor() {
        super();
        this.showQuestionnaire();
        this.full_screen_element = document.getElementById("full_screen_element");
        this.question_1 = document.getElementById("questionnaire_1");
        this.question_2 = document.getElementById("questionnaire_2");
        this.question_3 = document.getElementById("questionnaire_3");
        this.question_4 = document.getElementById("questionnaire_4");
        this.question_5 = document.getElementById("questionnaire_5");

        this.next_button = document.getElementById("next_questionnaire");
        document.documentElement.style.cursor = 'auto';
    }

    setCallback(callback) {
        this.next_button.onclick = function() {
            console.log("INFO[QuestionnairePage]: next button clicked.")
            callback();
        };

        if (Utils.isFullScreenCurrently()) {
            Utils.leaveFullscreen(this.full_screen_element);
        }
    }

    getAllQuestions() {
        return [this.question_1,
                this.question_2,
                this.question_3,
                this.question_4,
                this.question_5]
    }

}
