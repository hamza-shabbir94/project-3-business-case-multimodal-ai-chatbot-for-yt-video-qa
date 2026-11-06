"""Weekly workout plan builder (used by the agent tool create_weekly_plan).

Plain code, no LLM: the same inputs always give the same plan, so it can be tested.
Every programming rule comes from a video in the knowledge base and carries its
timestamp (RULES below). The exercises, their form cues and the second where each
one is demonstrated are in backend/exercises.json (built from the transcripts).

    inputs (goal, days, experience, equipment, minutes, avoid)
      -> split for the number of days       (RULES: split_*)
      -> movement slots per day             (DAY_TEMPLATES)
      -> one exercise per slot              (exercises.json, filtered by equipment and avoid)
      -> sets from the weekly volume target (RULES: volume_*)
      -> reps and rest from goal and level  (RULES: reps_*, rest_*)
      -> trimmed to fit the session length
"""
import json
from functools import lru_cache
from pathlib import Path

from catalog import format_timestamp, load_videos

EXERCISES_FILE = Path(__file__).resolve().parent / "exercises.json"

GOALS = {
    "build_muscle": "Build muscle",
    "get_stronger": "Get stronger",
    "lose_fat": "Lose fat",
    "general_fitness": "General fitness",
}
EQUIPMENT = {"gym": "Full gym", "dumbbells": "Dumbbells at home", "bodyweight": "Bodyweight only"}
EXPERIENCE = {"beginner": "Beginner", "intermediate": "Intermediate"}
AVOID = {"knees": "knees", "lower_back": "lower back", "shoulders": "shoulders"}

# Programming rules, each with the video and second it comes from.
RULES = {
    "volume_range": ("Aim for about 10 to 20 hard sets per muscle per week.", "PQWw0BJc5LQ", 122),
    "volume_beginner": ("Beginners start at the low end of that range.", "PQWw0BJc5LQ", 544),
    "volume_by_days": ("About 6 sets per muscle on 3 days a week, 10 on 4 days and 14 on 5 days.", "PQWw0BJc5LQ", 616),
    "volume_minimum": ("Even 3 sets per muscle per week builds some muscle, so consistency beats a perfect plan.", "PQWw0BJc5LQ", 515),
    "split_ab": ("Workout A (chest, shoulders, triceps, legs) and workout B (back, biceps, legs), alternated.", "U9ENCvFf9yQ", 210),
    "split_ppl": ("Push, pull, legs: 6 days a week is the easiest way to run it, with one rest day.", "TJHZI3McmE4", 142),
    "split_choice": ("Pick a split that fits your schedule and that you enjoy, so you stick with it.", "TJHZI3McmE4", 25),
    "reps_beginner": ("Beginners: sets of 8 to 10 reps to learn the basic movement patterns.", "U9ENCvFf9yQ", 261),
    "reps_hypertrophy": ("For muscle growth, weights you can lift 8 to 15 times are a good place to start.", "sxn5kPQ4Gl0", 860),
    "reps_strength": ("For strength, heavy weights you can lift 1 to 5 times, mostly on compound lifts.", "sxn5kPQ4Gl0", 796),
    "rest_compound": ("Rest at least 2 minutes between most sets.", "PQWw0BJc5LQ", 336),
    "rest_isolation": ("Lighter, higher rep work: rest about 60 to 90 seconds.", "sxn5kPQ4Gl0", 879),
    "rest_strength": ("Heavy strength sets: rest about 3 minutes, sometimes up to 5.", "sxn5kPQ4Gl0", 796),
    "fat_loss": ("Combining weights and cardio loses the most fat while keeping or building muscle.", "GIFSoEajOPQ", 300),
    "fat_loss_strength": ("When dieting, keep lifting heavy: losing strength is a cause of muscle loss.", "EOh2R-89qqg", 60),
    "overload": ("Write down sets, reps and weight, and try to beat them next time.", "U9ENCvFf9yQ", 465),
    "warm_up": ("Warm up first: about 5 minutes of easy cycling before lower body days, then lighter warm up sets.", "MncQw-H3MPU", 82),
}

# Movement slots per day type. Slot names match "slot" in exercises.json.
DAY_TEMPLATES = {
    "full_a": ["squat", "horizontal_push", "horizontal_pull", "hinge", "core"],
    "full_b": ["hinge", "vertical_push", "vertical_pull", "lunge", "biceps"],
    "a": ["horizontal_push", "vertical_push", "squat", "triceps", "core"],
    "b": ["vertical_pull", "horizontal_pull", "hinge", "biceps", "core"],
    "push": ["horizontal_push", "vertical_push", "horizontal_push", "triceps"],
    "pull": ["vertical_pull", "horizontal_pull", "biceps", "core"],
    "legs": ["squat", "hinge", "lunge", "glutes", "core"],
    "upper": ["horizontal_push", "horizontal_pull", "vertical_push", "vertical_pull", "biceps", "triceps"],
    "lower": ["hinge", "squat", "lunge", "glutes", "core"],
}
DAY_NAMES = {
    "full_a": "Full body A", "full_b": "Full body B", "a": "Workout A: push and legs",
    "b": "Workout B: pull and legs", "push": "Push", "pull": "Pull", "legs": "Legs",
    "upper": "Upper body", "lower": "Lower body",
}
SPLITS = {
    2: ("Full body, twice a week", ["full_a", "full_b"], "split_ab"),
    3: ("Full body, three times a week", ["full_a", "full_b", "full_a"], "split_ab"),
    4: ("Workout A and B, twice each", ["a", "b", "a", "b"], "split_ab"),
    5: ("Push, pull, legs, then upper and lower", ["push", "pull", "legs", "upper", "lower"], "split_ppl"),
    6: ("Push, pull, legs, twice a week", ["push", "pull", "legs", "push", "pull", "legs"], "split_ppl"),
}
WEEKLY_SETS = {2: 6, 3: 6, 4: 10, 5: 14, 6: 14}  # volume_by_days; 2 days uses the 3 day figure
WORK_SECONDS_PER_SET = 45  # estimate of the time under the bar, to fit the session length
WARM_UP_MINUTES = 5
# Heavy 3 to 5 rep sets only on the main barbell lifts
STRENGTH_LIFTS = {"back_squat", "deadlift", "bench_press", "overhead_press", "barbell_row"}


@lru_cache(maxsize=1)
def load_exercises() -> dict[str, dict]:
    return {e["id"]: e for e in json.loads(EXERCISES_FILE.read_text(encoding="utf-8"))}


def source(video_id: str, seconds: int) -> dict:
    v = load_videos()[video_id]
    return {"title": v["title"], "channel": v["channel"], "timestamp": format_timestamp(seconds),
            "url": f"{v['url']}&t={seconds}s"}


def rule(key: str) -> dict:
    text, video_id, seconds = RULES[key]
    return {"text": text, "source": source(video_id, seconds)}


def pick_exercise(slot: str, equipment: str, avoid: set[str], used: dict[str, int]) -> dict | None:
    """Best exercise for a slot, rotating through options when a slot repeats in the week."""
    options = [e for e in load_exercises().values()
               if slot in e["slots"] and equipment in e["equipment"] and not (avoid & set(e["stresses"]))]
    if not options:
        return None
    options.sort(key=lambda e: e["slots"][slot])  # lower number = preferred
    choice = options[used.get(slot, 0) % len(options)]
    used[slot] = used.get(slot, 0) + 1
    return choice


def reps_and_rest(exercise: dict, heavy: bool, goal: str, experience: str) -> tuple[str, int, str]:
    """(reps, rest seconds, rule key) for one exercise. heavy = first main barbell lift of the day."""
    compound = exercise["compound"]
    if exercise["unit"] == "hold":
        return "Hold with good form", 75, "rest_isolation"
    if experience == "beginner":
        return "8 to 10", (120 if compound else 75), "reps_beginner"
    if goal == "get_stronger" and heavy:
        return "3 to 5", 180, "reps_strength"
    if compound:
        return "8 to 12", 120, "reps_hypertrophy"
    return "10 to 15", 75, "reps_hypertrophy"


def build_plan(goal: str, days: int, experience: str, equipment: str,
               minutes: int = 60, avoid: list[str] | None = None) -> dict:
    if goal not in GOALS or equipment not in EQUIPMENT or experience not in EXPERIENCE:
        raise ValueError("unknown goal, equipment or experience")
    days = max(2, min(6, int(days)))
    minutes = max(20, min(120, int(minutes)))
    avoid_set = {a for a in (avoid or []) if a in AVOID}

    split_name, day_types, split_rule = SPLITS[days]
    target = WEEKLY_SETS[days]
    if experience == "beginner":
        target = min(target, 10)
    if goal == "general_fitness":
        target = min(target, 6)

    # 1. pick exercises
    used: dict[str, int] = {}
    week = []
    for day_type in day_types:
        picks = []
        for slot in DAY_TEMPLATES[day_type]:
            ex = pick_exercise(slot, equipment, avoid_set, used)
            if ex and ex["id"] not in {p["id"] for p in picks}:
                picks.append(ex)
        week.append((day_type, picks))

    # 2. sets: spread the weekly target over how often each muscle is trained
    times_trained: dict[str, int] = {}
    for _, picks in week:
        for ex in picks:
            times_trained[ex["muscle"]] = times_trained.get(ex["muscle"], 0) + 1

    out_days, rule_keys = [], {split_rule, "split_choice", "rest_compound", "overload", "warm_up"}
    def cost(e: dict) -> int:
        return e["sets"] * (e["rest_seconds"] + WORK_SECONDS_PER_SET)

    for n, (day_type, picks) in enumerate(week, 1):
        exercises, budget = [], (minutes - WARM_UP_MINUTES) * 60
        heavy_done = False
        for ex in picks:
            sets = max(2, min(4 if ex["compound"] else 3, round(target / times_trained[ex["muscle"]])))
            heavy = ex["id"] in STRENGTH_LIFTS and not heavy_done
            reps, rest, rule_key = reps_and_rest(ex, heavy, goal, experience)
            heavy_done = heavy_done or rule_key == "reps_strength"
            rule_keys.add(rule_key)
            if rest == 75:
                rule_keys.add("rest_isolation")
            if rest == 180:
                rule_keys.add("rest_strength")
            if sets * (rest + WORK_SECONDS_PER_SET) > budget - sum(cost(e) for e in exercises) and len(exercises) >= 3:
                break  # the session is full: drop the remaining accessory exercises
            exercises.append({
                "id": ex["id"], "name": ex["name"], "muscle": ex["muscle"], "sets": sets, "reps": reps,
                "rest_seconds": rest, "demo": source(ex["video_id"], ex["demo_seconds"]),
                "cues": [{"text": c["text"], "source": source(ex["video_id"], c["seconds"])} for c in ex["cues"]],
            })
        # still too long (short sessions): take sets away from the biggest exercises, down to 2
        while sum(cost(e) for e in exercises) > budget and any(e["sets"] > 2 for e in exercises):
            max(exercises, key=lambda e: e["sets"])["sets"] -= 1
        estimate = -(-sum(cost(e) for e in exercises) // 60) + WARM_UP_MINUTES  # rounded up
        out_days.append({"day": n, "name": DAY_NAMES[day_type], "minutes": estimate, "exercises": exercises})

    rule_keys.add("volume_beginner" if experience == "beginner" else "volume_range")
    rule_keys.add("volume_by_days" if days >= 3 else "volume_minimum")
    notes = []
    if goal == "lose_fat":
        rule_keys |= {"fat_loss", "fat_loss_strength"}
    if goal in ("lose_fat", "general_fitness"):
        rule_keys.add("fat_loss")
        notes.append("Add cardio you enjoy, such as brisk walking, cycling or swimming, on rest days. "
                     "How much is up to you: the videos give no fixed amount.")
    if avoid_set:
        notes.append("Exercises that load your " + " and ".join(AVOID[a] for a in sorted(avoid_set))
                     + " were left out. If something hurts, stop and ask a physiotherapist or doctor.")
    notes.append("General information from the videos, not medical advice.")

    order = list(RULES)
    return {
        "inputs": {"goal": GOALS[goal], "days": days, "experience": EXPERIENCE[experience],
                   "equipment": EQUIPMENT[equipment], "minutes": minutes,
                   "avoid": [AVOID[a] for a in sorted(avoid_set)]},
        "split": split_name,
        "weekly_sets_per_muscle": target,
        "days": out_days,
        "rules": [rule(k) for k in sorted(rule_keys, key=order.index)],
        "notes": notes,
    }


def plan_as_text(plan: dict) -> str:
    """Short text version for the agent (the full plan is shown as a card in the app)."""
    lines = ["The app already shows this full plan to the user as a card. Do NOT list the days or exercises "
             "in your reply: answer in 2 to 4 sentences (split, why it fits, one rule with its citation tag).",
             f"Plan: {plan['split']}. About {plan['weekly_sets_per_muscle']} sets per muscle per week.",
             "Inputs: " + ", ".join(f"{k}={v}" for k, v in plan["inputs"].items())]
    for d in plan["days"]:
        lines.append(f"Day {d['day']} {d['name']} (~{d['minutes']} min): "
                     + "; ".join(f"{e['name']} {e['sets']}x{e['reps']}" for e in d["exercises"]))
    for r in plan["rules"]:
        s = r["source"]
        lines.append(f"Rule: {r['text']} [{s['title']}, {s['timestamp']}]")
    lines += [f"Note: {n}" for n in plan["notes"]]
    return "\n".join(lines)
