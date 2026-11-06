"""Weekly plan builder tests (free: no LLM, no database).

    .venv/bin/pytest backend/tests/test_planner.py
"""
import itertools
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from catalog import load_videos  # noqa: E402
from planner import (AVOID, EQUIPMENT, EXPERIENCE, GOALS, RULES, WARM_UP_MINUTES,  # noqa: E402
                     build_plan, load_exercises)

ALL_INPUTS = list(itertools.product(GOALS, range(2, 7), EXPERIENCE, EQUIPMENT, [30, 45, 60, 75],
                                    [[], ["knees"], ["lower_back"], ["shoulders"], list(AVOID)]))


def test_every_exercise_points_to_a_saved_video():
    videos = load_videos()
    for ex in load_exercises().values():
        assert ex["video_id"] in videos
        assert ex["demo_seconds"] < videos[ex["video_id"]]["duration_seconds"]
        assert ex["cues"], ex["id"]
        for cue in ex["cues"]:
            assert cue["seconds"] < videos[cue["video_id"]]["duration_seconds"]


def test_every_rule_points_to_a_saved_video():
    videos = load_videos()
    for text, video_id, seconds in RULES.values():
        assert video_id in videos and seconds < videos[video_id]["duration_seconds"], text


@pytest.mark.parametrize("goal,days,experience,equipment,minutes,avoid", ALL_INPUTS)
def test_plan_respects_the_inputs(goal, days, experience, equipment, minutes, avoid):
    plan = build_plan(goal, days, experience, equipment, minutes, avoid)
    exercises = load_exercises()
    assert len(plan["days"]) == days
    for day in plan["days"]:
        assert day["exercises"], f"empty day: {day}"
        assert day["minutes"] <= max(minutes, WARM_UP_MINUTES + 15)
        for e in day["exercises"]:
            ex = exercises[e["id"]]
            assert equipment in ex["equipment"]                 # only the chosen equipment
            assert not set(avoid) & set(ex["stresses"])           # nothing that loads a sore joint
            assert 2 <= e["sets"] <= 4
            assert e["demo"]["url"].endswith(f"&t={ex['demo_seconds']}s")
    for r in plan["rules"]:
        assert "&t=" in r["source"]["url"]


def test_beginners_use_8_to_10_reps_and_strength_goal_uses_heavy_sets():
    beginner = build_plan("get_stronger", 4, "beginner", "gym")
    assert {e["reps"] for d in beginner["days"] for e in d["exercises"]} <= {"8 to 10", "Hold with good form"}
    advanced = build_plan("get_stronger", 4, "intermediate", "gym")
    assert any(e["reps"] == "3 to 5" for d in advanced["days"] for e in d["exercises"])


def test_split_follows_the_number_of_days():
    assert build_plan("build_muscle", 3, "beginner", "gym")["split"].startswith("Full body")
    assert build_plan("build_muscle", 6, "intermediate", "gym")["split"] == "Push, pull, legs, twice a week"


def test_unknown_values_are_rejected():
    with pytest.raises(ValueError):
        build_plan("get_huge", 3, "beginner", "gym")
