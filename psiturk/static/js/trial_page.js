class TrialPage extends Page {

    constructor(trial_data) {
        super();
        this.hideAll();

        this.base_image_path = "../static/images/";

        this.trial_data = trial_data;

        this.full_screen_element = document.getElementById("full_screen_element");

        this.trial_interim_display_div = document.getElementById("trial_interim_display_div");
        this.trial_interim_display_img = document.getElementById("trial_interim_display_img");

        this.trial_main_display_div = document.getElementById("trial_main_display_div");

        this.trial_video_div = document.getElementById("trial_video_div");
        this.trial_video = document.getElementById("trial_video");

        this.trial_slider_div = document.getElementById("trial_slider_div");
        this.trial_slider = document.getElementById("trial_slider");

        this.trial_next_button = document.getElementById("trial_next_button");
        this.trial_progress = document.getElementById("trial_progress");

        this.current_trial_num = 0;

        this.trial_slider.addEventListener("change", function() {
            this.#toggleNextButton(true);
        }.bind(this));

        this.trial_slider.addEventListener("click", function() {
            this.#toggleNextButton(true);
        }.bind(this));

        this.trial_video.addEventListener("ended", function() {
            this.#toggleSlider(true);
        }.bind(this));

        this.trial_video.addEventListener("click", function() {
            this.trial_video.currentTime = 0;
            this.trial_video.play();
        }.bind(this));

        this.count = 3;
    }

    showCountDown() {
        this.#toggleDisplays(false);
        if (this.count <= 3 && this.count > 0) {
            if (this.count === 1) {
                this.trial_interim_display_img.src = this.base_image_path + "one.png";
            } else if (this.count === 2) {
                this.trial_interim_display_img.src = this.base_image_path + "two.png";
            } else {
                this.trial_interim_display_img.src = this.base_image_path + "three.png";
            }
            this.count--;
        } else {
            console.log("reached");
            this.initPage();
        }
    }

    initPage() {
        this.trial_interim_display_img.src = this.base_image_path + "plus.png";
        this.resetSlider();
        this.#toggleDisplays(false);
    }

    resetSlider(){
        this.trial_slider.value = 50;
    }

    setCurrentTrialNum(current_trial_num) {
        this.current_trial_num = current_trial_num;
        this.trial_data.update_current_trial_num(this.current_trial_num);
    }

    showPage(callback) {
        if (this.current_trial_num >= this.trial_data.get_total_trials()) {
            return;
        }

        if (!Utils.isFullScreenCurrently()) {
            Utils.goFullscreen(this.full_screen_element);
        }

        this.trial_next_button.onclick = function() {
            callback();
        }.bind(this);

        this.initPage();
        setTimeout(function () {
            this.#toggleDisplays(true);
            this.#toggleVideo(true);
            this.#updateView();
        }.bind(this), 500);
    }

    clearResponse() {
        this.initPage();
    }

    getSliderValue() {
        return this.trial_slider.value;
    }

    getVideoFilename() {
        return this.trial_data.get_trial_video_filename();
    }

    getTrialNumber() {
        return this.trial_data.get_trial_number();
    }

    getTrialName() {
        return this.trial_data.get_trial_name();
    }

    /************
     * Helpers  *
     ***********/

    #toggleNextButton(is_visible) {
        if (is_visible) {
            this.trial_next_button.style.visibility = "visible";
        } else {
            this.trial_next_button.style.visibility = "hidden";
        }
    }

    #toggleVideo(is_video_visible) {
        if (is_video_visible) {
            TrialPage.showElement(this.trial_video_div);
        } else {
            TrialPage.hideElement(this.trial_video_div);
        }
    }

    #toggleSlider(is_slider_visible) {
        if (is_slider_visible) {
            this.trial_slider_div.style.visibility = "visible";
        } else {
            this.trial_slider_div.style.visibility = "hidden";
        }
    }

    #toggleDisplays(is_main_div_visible) {
        if (is_main_div_visible) {
            TrialPage.showElement(this.trial_main_display_div);
            TrialPage.hideElement(this.trial_interim_display_div);
        } else {
            TrialPage.showElement(this.trial_interim_display_div);
            TrialPage.hideElement(this.trial_main_display_div);
        }
        this.#toggleVideo(false);
        this.#toggleSlider(false);
        this.#toggleNextButton(false);
    }

    #updateView() {
        this.trial_video.src = this.trial_data.get_trial_video_filename();

        this.trial_progress.innerHTML = (this.trial_data.get_trial_number() + 1) + " / " +
                                         this.trial_data.get_total_trials();
    }
}
