class StimulusData {
    constructor(trial_num, trial_id, trial_video_filename) {

        this.trial_num = trial_num;

        this.trial_id = trial_id;
        this.trial_video_filename = trial_video_filename;
    }

    get_trial_number(){
        return this.trial_num;
    }

    get_trial_id(){
        return this.trial_id;
    }

    get_trial_name(){
        return this.get_trial_id();
    }

    get_trial_video_filename() {
        return this.trial_video_filename;
    }
}

class TrialData {

    constructor(trial_data, is_practice) {
        this.is_practice = is_practice;
        this.stimulus_list = [];

        this.#parse_trial_data(trial_data);

        this.current_trial_num = 0;
    }

    #parse_trial_data(trial_data) {
        let videos_base_path = "../static/stimuli_videos/";

        let stimuli_data = trial_data["stimulus"];
        if (this.is_practice) {
            stimuli_data = trial_data["practice"];
        }

        for (let trial_num = 0; trial_num < stimuli_data.length; trial_num++) {
            let stimulus_data = stimuli_data[trial_num];

            let trial_id = stimulus_data["trial_id"];
            let trial_video_filename = videos_base_path + stimulus_data["trial_video_name"];

            this.stimulus_list.push(new StimulusData(trial_num, trial_id, trial_video_filename));
        }
    }

    #get_current_stimulus_data() {
        return this.stimulus_list[this.current_trial_num];
    }

    update_current_trial_num(current_trial_num) {
        this.current_trial_num = current_trial_num;
    }

    get_trial_name() {
        return this.#get_current_stimulus_data().get_trial_name();
    }

    get_trial_number() {
        return this.#get_current_stimulus_data().get_trial_number();
    }

    get_total_trials() {
        return this.stimulus_list.length;
    }

    get_trial_video_filename() {
        return this.#get_current_stimulus_data().get_trial_video_filename();
    }
}
