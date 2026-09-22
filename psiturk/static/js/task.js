let PROLIFIC_ID = "";

let START_INSTRUCTION = 0;

let SKIP_PROLIFIC = false;
let SKIP_INSTRUCTIONS = false;

let psiTurk = new PsiTurk(uniqueId, adServerLoc, mode);

let pages = [
    "main.html"
];


promise_out = psiTurk.preloadPages(pages);


/****************
 * Prolific ID  *
 ****************/

let ProlificID = function (condition_list) {
    psiTurk.showPage('main.html');

    if (SKIP_PROLIFIC) {
        InstructionRunner(condition_list);
        return;
    }

    while (true) {
        let searchParams = new URLSearchParams(window.location.search)

        let param = ""
        if (searchParams.has('PROLIFIC_PID')) {
            param = searchParams.get('PROLIFIC_PID')
        }

        PROLIFIC_ID = prompt("Please enter Prolific ID to proceed:", param);

        if (PROLIFIC_ID === null) {
            window.close();
            return;
        }

        if (PROLIFIC_ID.length === 24) {
            psiTurk.recordTrialData({
                'prolific_id': PROLIFIC_ID,
            });
            console.log("PROLIFIC_ID: ", PROLIFIC_ID);
            InstructionRunner(condition_list);
            return;
        }

        alert("Incorrect Prolific ID detected. Please try again.");
    }
}


/****************
 * Instructions  *
 ****************/
let InstructionRunner = function (condition_list) {

    let page = new InstructionPage();

    let total_instructions = page.get_total_instructions();

    let show_instruction_page = function (instruction_num) {
        if (SKIP_INSTRUCTIONS) {
            end_instructions();
        }

        if (instruction_num < total_instructions) {
            page.set_instruction_number(instruction_num);
            page.showNextInstruction(function () {
                show_instruction_page(instruction_num + 1);
            });
        } else {
            end_instructions();
        }
    };

    let end_instructions = function () {
        psiTurk.finishInstructions();
        Experiment(condition_list, true);
    };

    // start the loop
    show_instruction_page(START_INSTRUCTION);
};


/***********************
 * Generic Page Runner *
 ***********************/
let GenericPageRunner = function (title, message, color_scheme,
                                  goToFunction) {

    let page = new GenericPage();
    page.setTitle(title);
    page.setMessage(message);
    page.setColorScheme(color_scheme);
    page.setCallback(function () {
        goToFunction();
    });
};


/**************
 * Experiment *
 **************/
let Experiment = function (condition_list, is_practice) {
    let start_time = -1;

    let trial_data = new TrialData(condition_list, is_practice);

    let stimulus_data = condition_list["stimulus"];
    if (is_practice) {
        stimulus_data = condition_list["practice"];
    }

    let trial_page = new TrialPage(trial_data);

    let run_single_trial = function (curr_trial_page_index) {

        if (curr_trial_page_index >= stimulus_data.length) {
            end_experiment();
            return;
        }

        trial_page.setCurrentTrialNum(curr_trial_page_index);

        start_time = new Date().getTime();

        trial_page.showPage(function () {
                register_response(curr_trial_page_index);
                trial_page.clearResponse();
                run_single_trial(curr_trial_page_index + 1);
            }
        );
    };

    let register_response = function () {
        let reaction_time = new Date().getTime() - start_time;

        let trial_name = trial_page.getTrialName();
        let trial_number = trial_page.getTrialNumber();
        let trial_video_filename = trial_page.getVideoFilename();
        let trial_slider_value = trial_page.getSliderValue();

        let phase = "trial";
        if (is_practice) {
            phase = "practice";
        }

        psiTurk.recordTrialData({
            'Phase': phase,
            'TrialName': trial_name,
            'TrialNumber': trial_number + 1,
            'TrialVideoFilename': trial_video_filename,
            'TrialSliderValue': trial_slider_value,
            'ReactionTime': reaction_time,
        });
    };

    let end_experiment = function () {
        document.documentElement.style.cursor = 'auto';
        if (is_practice) {
            GenericPageRunner(
                "You did great!",
                "Hope you are warmed up now!<br><br>" +
                "The upcoming trials might not seem as easy as these practice trials. " +
                "That is completely okay and expected!<br>" +
                "If you feel unsure, just go with your intuition and please try to do your best." +
                "<br><br><b> Remember, you can always click on the video to play it again.<b><br>" +
                "<br><br>Press <b>CONTINUE</b> to start the experiment!",
                Page.StatusSuccess,
                function () {
                    Experiment(condition_list, false);
                }
            );
        } else {
            psiTurk.saveData();
            new Questionnaire();
        }
    };

    setTimeout(function () {
        trial_page.showTrials();
        trial_page.showCountDown();
    }, 200);

    setTimeout(function () {
        trial_page.showCountDown();
    }, 1200);

    setTimeout(function () {
        trial_page.showCountDown();
    }, 2200);

    setTimeout(function(){
        trial_page.initPage();
        run_single_trial(0);},3200);
};


/******************
 * Questionnaire  *
 ******************/

let Questionnaire = function () {

    let page = new QuestionnairePage();
    page.setCallback(function () {
        register_response();
        exit_questionnaire();
    });

    function register_response() {
        console.log("writing data into the container");

        let allQuestions = page.getAllQuestions();
        for (const question of allQuestions) {
            psiTurk.recordTrialData({
                'Phase': "questionnaire",
                'Question': question.id,
                'Answer': question.value
            });
        }
    }

    let prompt_resubmit = function () {
        GenericPageRunner(
            "ERROR! Connection issue.",
            "Trying to resubmit...<br>" +
            "Press <b>continue</b> to resubmit and go back to Prolific.",
            Page.StatusError,
            function () {
                resubmit();
            }
        );
    };

    let resubmit = function () {
        let re_prompt = setTimeout(prompt_resubmit, 10000);

        psiTurk.saveData({
            success: function () {
                clearInterval(re_prompt);
                psiTurk.computeBonus('compute_bonus', function () {
                    window.open('', '_self', ''); window.close();
                });
            },
            error: prompt_resubmit
        });
    };

    function exit_questionnaire() {
        GenericPageRunner(
            "That's all! Thank you for participating :)",
            "<br>" +
            "Press <b>continue</b> to end.",
            Page.StatusSuccess,
            function () {
                Utils.leaveFullscreen();
                psiTurk.saveData({
                    success: function() {
                        psiTurk.completeHIT();
                    },
                    error: prompt_resubmit
                });
            }
        );
    }
};



/*******************
 * Run Task
 ******************/
$(window).load(function () {

    function generateNewConditionList() {
        $.ajax({
            type: "POST",
            url: "stimulus",
            success: function () {
                console.log("Done creating new stimulus file!");
            },
            error: function (e) {
                console.log()
                console.log("ERROR[generateNewConditionList]: some error occurred.");
            },
        }).done(function(){
            loadConditionList();
        });
    }

    function loadConditionList() {
        $.ajax({
            dataType: 'json',
            url: "static/data/condition_list.json",
            async: false,
            success: function (condition_list) {
                console.log("condition", condition);
                ProlificID(condition_list);
            },
            error: function () {
                console.log("ERROR[load_condition_list]: some error occurred.");
            },
        });
    }

    if (Utils.isMobileTablet()) {
        console.log("mobile browser detected");
        alert(`Sorry, but mobile or tablet browsers are not supported. Please switch to a desktop browser.`);
        return;
    }

    generateNewConditionList();
    // loadConditionList();
});
