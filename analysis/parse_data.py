import os
import json
import csv

from scipy import stats

from sqlalchemy import create_engine, MetaData, Table, select

EXP_NAME = "participants"
EXP_DB_NAME = "project"

DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.realpath(__file__))), "data")
OUT_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.realpath(__file__))), "out")
EXP_PATH = os.path.join(DATA_PATH, f"{EXP_NAME}.db")


class Quiz:
    def __init__(self, question, answer):
        self.question = question
        self.answer = answer


class Questionnaire:
    def __init__(self, question, answer):
        self.question = question
        self.answer = answer

        if self.question == 'questionnaire_5':
            print(self.answer)


class Trial:
    def __init__(self, trial_index, trial_num, slider_value, rt, trial_video_filename):
        self.trial_index = trial_index
        self.trial_num = trial_num

        self.slider_value = slider_value
        self.reaction_time = rt
        self.trial_video_filename = trial_video_filename

        self.z_scored_slider_value = 0

    def set_z_scored_slider_value(self, value):
        self.z_scored_slider_value = value

    def get_trial_name(self):
        return str(self.get_trial_num())

    def get_trial_num(self):
        return self.trial_num

    def get_trial_index(self):
        return self.trial_index

    def get_reaction_time(self):
        return self.reaction_time

    def get_video_filename(self):
        return self.trial_video_filename

    def get_slider_value(self):
        return self.slider_value

    def get_z_scored_slider_value(self):
        return self.z_scored_slider_value


class Subject:
    def __init__(self, subject_id):
        self.subject_id = subject_id
        self.prolific_id = ""
        self.trial_data = {}
        self.quiz_data = []
        self.questionnaire_data = []

    def add_prolific_id(self, prolific_id):
        self.prolific_id = prolific_id

    def add_trial_data(self, trial):
        remove_names = []
        if trial.get_trial_name() in remove_names:
            return
        if trial.get_trial_name() not in self.trial_data:
            self.trial_data[trial.get_trial_name()] = []
        self.trial_data[trial.get_trial_name()].append(trial)

    def add_quiz_data(self, quiz):
        self.quiz_data.append(quiz)

    def add_questionnaire_data(self, questionnaire):
        self.questionnaire_data.append(questionnaire)

    def get_prolific_id(self):
        return self.prolific_id

    def get_all_trial_names(self):
        return self.trial_data.keys()

    def get_all_trial_responses(self):
        response_keys = []
        response_values = []
        for k, values in self.trial_data.items():
            for v in values:
                response_keys.append(k)
                response_values.append(int(v.get_slider_value()))

        return response_keys, response_values

    def get_all_trial_items(self, trial_name):
        return self.trial_data[trial_name]

    def get_slider_values_list(self, trial):
        slider_response_values = []
        for trial_name, values in self.trial_data.items():
            if trial_name == trial:
                for i, trial_configuration in enumerate(values):
                    slider_response_values.append(int(trial_configuration.get_slider_value()))
                break
        return slider_response_values

    def get_z_scored_slider_values_list(self, trial):
        slider_response_values = []
        for trial_name, values in self.trial_data.items():
            if trial_name == trial:
                for i, trial_configuration in enumerate(values):
                    slider_response_values.append(trial_configuration.get_z_scored_slider_value())
                break
        return slider_response_values

    def print_responses(self):
        trial_name = []
        responses = []
        z_score_responses = []
        for trial in sorted(self.trial_data.keys()):
            slider_values = self.get_slider_values_list(trial)
            trial_name.extend([trial] * len(slider_values))
            responses.extend(slider_values)
            z_score_slider_values = self.get_z_scored_slider_values_list(trial)
            z_score_responses.extend(z_score_slider_values)

    def z_score_responses(self):
        responses = []
        for trial in sorted(self.trial_data.keys()):
            slider_values = self.get_slider_values_list(trial)
            responses.extend(slider_values)
        z_scored_responses = list(stats.zscore(responses))
        for trial in sorted(self.trial_data.keys())[::-1]:
            for configuration in self.trial_data[trial][::-1]:
                configuration.set_z_scored_slider_value(z_scored_responses[-1])
                del z_scored_responses[-1]


class Experiment:
    UNIQUE_ID = 'uniqueid'
    TRIAL_DATA = 'trialdata'
    PROLIFIC_ID = 'prolific_id'

    PHASE = 'Phase'
    PHASE_QUIZ = 'quiz'
    PHASE_QUESTIONNAIRE = 'questionnaire'
    PHASE_TRIAL = 'trial'

    QUIZ_QUESTION = 'Question'
    QUIZ_ANSWER = 'Answer'

    QUESTIONNAIRE_QUESTION = 'Question'
    QUESTIONNAIRE_ANSWER = 'Answer'

    TRIAL_NAME = 'TrialName'
    TRIAL_NUMBER = 'TrialNumber'
    TRIAL_SLIDER_VALUE = 'TrialSliderValue'
    TRIAL_REACTION_TIME = 'ReactionTime'
    TRIAL_VIDEO_FILENAME = 'TrialVideoFilename'

    def __init__(self):
        self.experiment_data = {}

    def add_subject_data(self, data):
        def _extract_prolific_id():
            prolific_id = None
            for tt in data:
                td = tt[self.TRIAL_DATA]
                if self.PROLIFIC_ID in td:
                    prolific_id = td[self.PROLIFIC_ID]

            return prolific_id

        if len(data) == 0:
            return

        sub_id = _extract_prolific_id()

        if sub_id not in self.experiment_data:
            self.experiment_data[sub_id] = Subject(sub_id)

        subject = self.experiment_data[sub_id]

        for trial in data:
            trial_data = trial[self.TRIAL_DATA]

            if self.PROLIFIC_ID in trial_data:
                subject.add_prolific_id(trial_data[self.PROLIFIC_ID])
                continue

            if trial_data[self.PHASE] == self.PHASE_QUIZ:
                q = Quiz(trial_data[self.QUIZ_QUESTION], trial_data[self.QUIZ_ANSWER])
                subject.add_quiz_data(q)

            elif trial_data[self.PHASE] == self.PHASE_TRIAL:
                t = Trial(int(trial_data[self.TRIAL_NUMBER]),
                          int(trial_data[self.TRIAL_NAME]),
                          int(trial_data[self.TRIAL_SLIDER_VALUE]),
                          trial_data[self.TRIAL_REACTION_TIME],
                          trial_data[self.TRIAL_VIDEO_FILENAME].split("/")[-1])
                subject.add_trial_data(t)

            elif trial_data[self.PHASE] == self.PHASE_QUESTIONNAIRE:
                q = Questionnaire(trial_data[self.QUESTIONNAIRE_QUESTION],
                                  trial_data[self.QUESTIONNAIRE_ANSWER])
                subject.add_questionnaire_data(q)

        subject.z_score_responses()

    def remove_subject(self, subject_id):
        if subject_id in self.experiment_data:
            del self.experiment_data[subject_id]

    def get_all_subject_ids(self):
        return self.experiment_data.keys()

    def get_all_trials_per_subject(self, subject_id):
        return self.experiment_data[subject_id]

    def save_experiment_to_csv(self, out_filepath):
        trial_names_list = None
        with open(out_filepath, mode='w') as file:
            writer = csv.writer(file)
            for subject_id in self.get_all_subject_ids():
                sub_trial_data = self.get_all_trials_per_subject(subject_id)

                if trial_names_list is None:
                    trial_names_list = sorted(sub_trial_data.get_all_trial_names())

                for trial_name in trial_names_list:
                    trial_data = sub_trial_data.get_all_trial_items(trial_name)
                    if len(trial_data) == 1:
                        trial_data = trial_data[0]

                    row_data = [subject_id,
                                trial_name,
                                trial_data.get_trial_num(),
                                trial_data.get_slider_value(),
                                trial_data.get_z_scored_slider_value(),
                                trial_data.get_reaction_time(),
                                trial_data.get_video_filename()]

                    writer.writerow(row_data)


def parse_db(db_path):
    metadata = MetaData()
    engine = create_engine("sqlite:///" + db_path)

    table = Table(EXP_DB_NAME, metadata, autoload_with=engine)
    s = select(table)

    excluded_subjects = []

    data = []
    psiturk_statuses = [3, 4, 5, 7]  # status codes for successful completion etc.

    with engine.connect() as connection:
        rows = connection.execute(s)
        for row in rows:
            if row.status in psiturk_statuses and row.uniqueid not in excluded_subjects:
                data.append(row.datastring)
            else:
                print("Excluding subject with ID: " + str(row.uniqueid))

    data = [json.loads(part)['data'] for part in data]

    experiment = Experiment()

    for subject_data in data:
        experiment.add_subject_data(subject_data)

    return experiment


def parse_computational_data():
    pass


if __name__ == '__main__':
    experiment_data = parse_db(EXP_PATH)
    experiment_data.save_experiment_to_csv(os.path.join(OUT_PATH, f"{EXP_NAME}_out.csv"))
