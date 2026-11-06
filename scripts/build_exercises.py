"""Builds backend/exercises.json: the exercises the weekly plan can use.

Each exercise has the video that demonstrates it, the second where the demo starts,
and 3 to 4 form cues. The cues were drafted with an LLM from the transcripts and
checked by hand; this script finds the exact second of each cue by searching the
transcript near the given minute for the keywords, and fails if they are not found.

    .venv/bin/python scripts/build_exercises.py           # writes backend/exercises.json
    .venv/bin/python scripts/build_exercises.py --show    # also prints the transcript text of every cue
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))
from catalog import load_videos  # noqa: E402

G, D, B = "gym", "dumbbells", "bodyweight"

# id, name, video, demo "m:ss", slots {slot: preference}, equipment, stresses, muscle, compound, unit,
# cues: (text, "m:ss" near where it is said, keywords that must appear in the transcript there)
EXERCISES = [
    ("back_squat", "Barbell back squat", "gcNh17Ckjgg", "0:20", {"squat": 1}, [G], ["knees", "lower_back"], "quads", True, "reps", [
        ("Feet about hip width apart, toes pointing out slightly.", "0:40", ["toes"]),
        ("Rest the bar on the meat of your traps, not too high on the neck.", "1:20", ["traps"]),
        ("Take a deep breath and brace your core before you go down.", "3:00", ["breath"]),
        ("Push your knees out in the same direction as your toes.", "3:30", ["knees", "toes"]),
    ]),
    ("goblet_squat", "Goblet squat", "jVabPEjDCHY", "8:09", {"squat": 2}, [G, D], ["knees"], "quads", True, "reps", [
        ("Keep the weight over your mid foot and press the whole foot into the ground.", "1:00", ["mid", "foot"], "W73Mc0Gil9A"),
        ("Keep your knees in line with your toes.", "4:20", ["knee", "toes"], "W73Mc0Gil9A"),
        ("Push hard even with lighter dumbbells to build up fatigue.", "9:00", ["lighter"]),
    ]),
    ("box_squat", "Box squat", "W73Mc0Gil9A", "7:05", {"squat": 3}, [G, D, B], [], "quads", True, "reps", [
        ("Squat down to a box or chair to control how deep you go.", "7:10", ["box"]),
        ("If regular squats hurt your knees, box squats are a good alternative.", "7:30", ["knee pain"]),
        ("Keep the weight over your mid foot, not on your toes.", "1:00", ["mid", "foot"]),
    ]),
    ("deadlift", "Deadlift", "XxWcirHIwVo", "0:20", {"hinge": 1}, [G], ["lower_back"], "posterior", True, "reps", [
        ("Feet hip width apart with the bar over your mid foot.", "3:05", ["mid"]),
        ("Push your hips back with straight arms, then bend your knees to bring your shins to the bar.", "2:10", ["hips"]),
        ("Take a big breath and brace before you pull.", "4:20", ["breath"]),
        ("Push the floor away: hips and chest rise at the same rate.", "5:10", ["floor"]),
    ]),
    ("rdl", "Romanian deadlift", "_oyxCn2iSjU", "1:07", {"hinge": 2}, [G, D], ["lower_back"], "posterior", True, "reps", [
        ("Keep your spine extended the whole time.", "2:08", ["spine"]),
        ("Keep a slight bend in the knees, without letting them travel forward.", "2:30", ["knee"]),
        ("Only go down as far as you can push your hips back without rounding your back.", "3:09", ["round"]),
    ]),
    ("single_leg_rdl", "Single leg Romanian deadlift", "jVabPEjDCHY", "5:06", {"hinge": 3}, [D, B], ["lower_back"], "posterior", True, "reps", [
        ("Keep the standing leg fairly straight.", "5:30", ["straight"]),
        ("Bend over at the hips with a neutral back.", "5:40", ["hips"]),
        ("Use a split stance for more balance if you need it.", "6:00", ["stance"]),
    ]),
    ("hip_thrust", "Hip thrust", "xDmFkJxPzeM", "2:06", {"glutes": 1, "hinge": 4}, [G, D, B], [], "glutes", True, "reps", [
        ("Bar centered on your hips, upper back against the bench, feet a bit wider than shoulders.", "2:24", ["upper back"]),
        ("At the top, squeeze your glutes as hard as you can, chin and ribs tucked down.", "3:04", ["coin"]),
        ("At the top, your hips are level with or above your knees.", "4:09", ["knees"]),
        ("Do not arch your lower back: tuck your pelvis by crunching your abs slightly at the top.", "4:51", ["pelvis"]),
    ]),
    ("split_squat", "Bulgarian split squat", "jVabPEjDCHY", "4:05", {"lunge": 1}, [G, D, B], ["knees"], "quads", True, "reps", [
        ("Drop your back knee toward the floor, then push up with the front leg.", "3:30", ["knee"]),
        ("Keep your torso upright to work the quads.", "3:50", ["upright"]),
        ("Raising the back foot puts more of the load on the front leg.", "4:20", ["foot"]),
    ]),
    ("bench_press", "Bench press", "4Y2ZdHCOXok", "0:20", {"horizontal_push": 1}, [G], ["shoulders"], "chest", True, "reps", [
        ("Wrap your thumb around the bar, no thumbless grip.", "1:30", ["thumb"]),
        ("Plant your feet and keep a slight arch in your upper back.", "2:20", ["arch"]),
        ("Pull the bar down to your lower chest with your back muscles, do not let gravity drop it.", "4:10", ["gravity"]),
        ("Keep your elbows tucked at about 45 to 70 degrees from your body.", "4:40", ["degree"]),
    ]),
    ("push_up", "Push up", "MO10KOoQx5E", "0:20", {"horizontal_push": 2}, [G, D, B], [], "chest", True, "reps", [
        ("Hands about shoulder width or narrower, elbows tucked in instead of flared out.", "2:12", ["tuck"]),
        ("Keep your elbows below 60 degrees from your body, ideally about 45, to protect the shoulders.", "2:31", ["45"]),
        ("Keep your hands straight, not turned in or out.", "3:02", ["hand"]),
        ("Slow down: about 2.5 seconds per push up.", "8:08", ["second"]),
    ]),
    ("overhead_press", "Overhead press", "_RlRDWO2jfg", "0:20", {"vertical_push": 1}, [G, D], ["shoulders", "lower_back"], "shoulders", True, "reps", [
        ("Grip slightly wider than shoulder width, elbows under the bar.", "2:03", ["grip"]),
        ("Press the bar straight up, not up and forward or backward.", "3:22", ["straight up"]),
        ("Squeeze your glutes to keep your spine neutral.", "3:30", ["glutes"]),
        ("With dumbbells, use the full range of motion and no bouncing reps.", "5:07", ["range"]),
    ]),
    ("pike_push_up", "Pike push up", "95846CBGU0M", "5:05", {"vertical_push": 2}, [D, B], ["shoulders"], "shoulders", True, "reps", [
        ("From a push up position, walk your hands toward your feet until your body is an upside down V.", "5:10", ["pike"]),
        ("Keep your elbows tucked and forearms vertical over your wrists.", "5:42", ["forearms"]),
        ("To make it harder, raise your feet on a step.", "5:42", ["elevate"]),
    ]),
    ("pull_up", "Pull up", "D-TL5hDQucI", "0:20", {"vertical_pull": 1}, [G], [], "back", True, "reps", [
        ("Use a medium grip, about 1.5 times shoulder width.", "2:04", ["medium"]),
        ("Brace your core so your lower back does not arch and your ribs do not flare.", "2:55", ["ribs"]),
        ("At the top, do not let your shoulders shrug up to your ears.", "3:59", ["shrug"]),
    ]),
    ("lat_pulldown", "Lat pulldown", "b_eislFFVhk", "1:00", {"vertical_pull": 2}, [G], [], "back", True, "reps", [
        ("Use a narrow, underhand grip and keep your elbows close to your body.", "1:20", ["elbow"]),
        ("Drive your shoulders down, do not just pull with your arms.", "4:03", ["shoulder"]),
        ("Lean back slightly for a deeper stretch.", "5:03", ["lean"]),
    ]),
    ("floor_pulldown", "Floor pulldown (home)", "95846CBGU0M", "6:05", {"vertical_pull": 3}, [D, B], [], "back", True, "reps", [
        ("Lie on a smooth floor and pull your elbows down to slide your body.", "6:05", ["elbows"]),
        ("Put shoes on your hands for grip.", "6:15", ["shoe"]),
    ]),
    ("barbell_row", "Barbell row", "kBWAon7ItDw", "0:20", {"horizontal_pull": 1}, [G], ["lower_back"], "back", True, "reps", [
        ("Keep your back neutral as you lift the bar into position.", "4:07", ["back"]),
        ("Do not pull the bar too high or flare your elbows out.", "6:13", ["elbow"]),
        ("Lower the weight under control, do not just drop it.", "7:14", ["drop"]),
    ]),
    ("dumbbell_row", "One arm dumbbell row", "b_eislFFVhk", "6:04", {"horizontal_pull": 2}, [G, D], [], "back", True, "reps", [
        ("Keep your rib cage still, do not twist your torso.", "6:10", ["rib"]),
        ("Pull your elbow down and back toward your hip.", "6:30", ["elbow"]),
        ("Lean slightly forward and pull from high to low.", "7:04", ["lean"]),
    ]),
    ("inverted_row", "Inverted row (home)", "95846CBGU0M", "4:03", {"horizontal_pull": 3}, [D, B], [], "back", True, "reps", [
        ("Use a broom or mop across two chairs as the bar.", "4:03", ["chair"]),
        ("Bend your knees to make it easier.", "4:20", ["knees"]),
        ("Raise your feet to make it harder.", "4:40", ["feet"]),
    ]),
    ("incline_curl", "Incline dumbbell curl", "WvlDMlMx1Ok", "1:24", {"biceps": 1}, [G, D], [], "biceps", False, "reps", [
        ("Sit back on an incline bench and let your arms hang behind your body for a bigger stretch.", "1:35", ["behind your body"]),
    ]),
    ("home_curl", "Bodyweight curl (home)", "95846CBGU0M", "7:06", {"biceps": 2}, [B], [], "biceps", False, "reps", [
        ("Lean back with your body straight and elbows locked in place, then curl your hands toward your face.", "6:57", ["curl"]),
    ]),
    ("overhead_triceps", "Overhead triceps extension", "WvlDMlMx1Ok", "9:36", {"triceps": 1}, [G, D], [], "triceps", False, "reps", [
        ("Work with your arm overhead: it stretches the long head, and overhead extensions grew the triceps more than pushdowns.", "7:30", ["overhead"]),
        ("Keep your elbow propped up in the overhead position.", "8:35", ["propped"]),
        ("Choose the version that feels easy on your elbows and shoulders.", "9:50", ["elbows"]),
    ]),
    ("home_triceps", "Bodyweight triceps extension (home)", "95846CBGU0M", "7:06", {"triceps": 2}, [B], [], "triceps", False, "reps", [
        ("Keep your elbows locked in place and your body in a straight line.", "7:09", ["straight line"]),
        ("Make it harder by leaning your body more horizontal.", "7:40", ["horizontal"]),
    ]),
    ("plank", "Plank", "A2b2EmIg0dA", "0:10", {"core": 1}, [G, D, B], [], "core", False, "hold", [
        ("Tuck your tailbone under and squeeze your glutes.", "0:30", ["tailbone"]),
        ("Gently pull your elbows back toward your toes: you should feel your abs switch on.", "1:00", ["toes"]),
        ("Stack your shoulders over your elbows.", "1:10", ["stack"]),
    ]),
]


def seconds(ts: str) -> int:
    m, s = ts.split(":")
    return int(m) * 60 + int(s)


def find_cue(video_id: str, near: int, keywords: list[str]) -> tuple[int, str]:
    """First segment within -20 s..+75 s of `near` whose text (with the next segment) has any keyword."""
    segs = load_videos()[video_id]["segments"]
    for i, s in enumerate(segs):
        if near - 20 <= s["start"] <= near + 75:
            text = " ".join(x["text"] for x in segs[i:i + 2]).lower()
            if any(re.search(rf"\b{k}", text) for k in keywords):
                return int(s["start"]), " ".join(x["text"] for x in segs[i:i + 3])
    raise SystemExit(f"cue not found: {video_id} near {near}s, keywords {keywords}")


def main() -> None:
    show = "--show" in sys.argv
    out = []
    for ex_id, name, vid, demo, slots, equipment, stresses, muscle, compound, unit, cues in EXERCISES:
        assert vid in load_videos(), f"{vid} is not in backend/data"
        item = {"id": ex_id, "name": name, "video_id": vid, "demo_seconds": seconds(demo), "slots": slots,
                "equipment": equipment, "stresses": stresses, "muscle": muscle, "compound": compound,
                "unit": unit, "cues": []}
        if show:
            print(f"\n## {name}  ({vid} demo {demo})")
        for cue in cues:
            text, near, keywords = cue[:3]
            cue_vid = cue[3] if len(cue) > 3 else vid
            at, said = find_cue(cue_vid, seconds(near), keywords)
            item["cues"].append({"text": text, "video_id": cue_vid, "seconds": at})
            if show:
                print(f"  [{at // 60}:{at % 60:02d}] {text}\n           said: {said[:150]}")
        out.append(item)
    path = ROOT / "backend" / "exercises.json"
    path.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"\n{len(out)} exercises, {sum(len(e['cues']) for e in out)} cues -> {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
