import json
import os

from collections import defaultdict
from random import randint, shuffle
from time import strftime, gmtime
from typing import List


class Paths:
    @staticmethod
    def get_root_dir_path():
        return os.path.dirname(os.path.dirname(__file__))

    @staticmethod
    def get_psiturk_static_dir_path():
        return os.path.join(Paths.get_root_dir_path(), "psiturk", "static")

    @staticmethod
    def get_json_data_dir_path():
        return os.path.join(Paths.get_psiturk_static_dir_path(), "data")

    @staticmethod
    def get_stimuli_videos_dir_path():
        return os.path.join(Paths.get_psiturk_static_dir_path(), "stimuli_videos")


class FileUtils:
    @staticmethod
    def get_files_in_directory(dir_path, is_sorted=True) -> List[str]:
        try:
            return_list = list(filter(os.path.isfile, [os.path.join(dir_path, i) for i in os.listdir(dir_path)]))
            if is_sorted:
                return sorted(return_list)
            return return_list
        except Exception as e:
            print("ERROR: issue in retrieving files within directory " + dir_path)
            print(str(e))
            assert False

    @staticmethod
    def get_basename(filepath) -> str:
        return os.path.basename(filepath).split(".")[0]

    @staticmethod
    def get_ext(filepath) -> str:
        return os.path.basename(filepath).split(".")[1]


class Stimulus:
    def __init__(self, stimulus_id):
        self.stimulus_id = stimulus_id
        self.stimulus_video_name = None

    def set_stimulus_video_name(self, stimulus_video_name):
        self.stimulus_video_name = stimulus_video_name

    def get_stimulus_id(self):
        return self.stimulus_id

    def get_stimulus_video_name(self):
        return self.stimulus_video_name


class JsonWriter:
    PRACTICE = "practice"
    STIMULUS = "stimulus"

    TRIAL_ID = "trial_id"
    TRIAL_VIDEO_NAME = "trial_video_name"

    def __init__(self, practice_list, stimulus_list):
        self.json_object = self._get_practice_stimulus_dict(practice_list, stimulus_list)

    def _get_stimulus_dict(self, trial_id, trial_video_name):
        returned_dict = dict()
        returned_dict[self.TRIAL_ID] = trial_id
        returned_dict[self.TRIAL_VIDEO_NAME] = trial_video_name
        return returned_dict

    def _get_practice_stimulus_dict(self, practice_list, stimulus_list):
        returned_dict = dict()

        practice_array = []
        for stimulus in practice_list:
            practice_array.append(self._get_stimulus_dict(stimulus.get_stimulus_id(),
                                                          stimulus.get_stimulus_video_name()))

        stimuli_array = []
        for stimulus in stimulus_list:
            stimuli_array.append(self._get_stimulus_dict(stimulus.get_stimulus_id(),
                                                         stimulus.get_stimulus_video_name()))

        returned_dict[self.PRACTICE] = practice_array
        returned_dict[self.STIMULUS] = stimuli_array
        return returned_dict

    def get_json_string(self):
        return json.dumps(self.json_object, indent=2)

    @staticmethod
    def generate_json_condition_file(practice_list, stimulus_list):
        json_string = JsonWriter(practice_list, stimulus_list).get_json_string()

        with open(os.path.join(Paths.get_json_data_dir_path(), 'condition_list.json'), 'w') as cond_file:
            cond_file.write(json_string)
            cond_file.close()

        curr_time = strftime("_%m_%d_T_%H_%M_%S", gmtime())
        with open(os.path.join(Paths.get_json_data_dir_path(), 'condition_list' + curr_time + '.json'), 'w') as outfile:
            outfile.write(json_string)
            outfile.close()


def sample_exp_stimuli(video_filepaths_lists):
    stim_type_to_stim_filepath_dict = defaultdict(list)

    for video_filepath in video_filepaths_lists:
        stimuli_num = int(FileUtils.get_basename(video_filepath).split("_")[1])
        stimuli_var = int(FileUtils.get_basename(video_filepath).split("_")[2])

        if stimuli_num == 0 and stimuli_var == 1:
            continue

        if stimuli_var == 3:
            continue

        stim_type_to_stim_filepath_dict[stimuli_num].append(video_filepath)

    return stim_type_to_stim_filepath_dict


def smart_shuffle(stim_type_dict):
    new_keys_list = list(stim_type_dict.keys())
    shuffle(new_keys_list)

    return_dict = dict()
    for key in new_keys_list:
        return_dict[key] = stim_type_dict[key]

    return return_dict


def make_condition_file():
    stim_type_dict = sample_exp_stimuli(FileUtils.get_files_in_directory(Paths.get_stimuli_videos_dir_path()))

    practice_list = []
    for stim_num, stim_filepath_list in stim_type_dict.items():
        if stim_num == 0:
            for stim_filepath in stim_filepath_list:
                stimulus = Stimulus(stim_num)
                stimulus.set_stimulus_video_name(os.path.basename(stim_filepath))
                practice_list.append(stimulus)

    stimulus_list = []
    for stim_num in smart_shuffle(stim_type_dict):
        if stim_num == 0:
            continue

        stim_filepath = stim_type_dict[stim_num][randint(0, len(stim_type_dict[stim_num]) - 1)]

        stimulus = Stimulus(stim_num)
        stimulus.set_stimulus_video_name(os.path.basename(stim_filepath))
        stimulus_list.append(stimulus)

    JsonWriter.generate_json_condition_file(practice_list, stimulus_list)


def main():
    make_condition_file()


if __name__ == '__main__':
    main()
