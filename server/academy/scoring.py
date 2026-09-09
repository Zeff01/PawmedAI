"""How a stage answer turns into points.

Kept out of the view so the rules are stated once, in one readable place, rather
than being inferred from request handling.
"""

import math

TRIES_BEFORE_REVEAL = 3


def credited_fraction(chosen: set[int], correct: set[int]) -> float:
    """How much of a stage's marks a selection has earned, from 0.0 to 1.0.

    Each right pick earns its share of the stage; each wrong pick cancels one
    right pick out. A student who spots three of the four findings that matter
    has done most of the reasoning and is credited for it, and one who spots
    three but also calls a normal temperature abnormal is credited for two.

    Wrong picks have to cost something, or the winning move on any
    several-answer stage would be to tick every box: that scores
    `(4 - 3) / 4` here, not full marks. The floor is zero — a selection can
    earn nothing, but it can never take away points from elsewhere.
    """
    if not correct:
        return 0.0
    hits = len(chosen & correct)
    wrong = len(chosen - correct)
    return max(0.0, (hits - wrong) / len(correct))


def award_for(points: int, tries: int, fraction: float = 1.0) -> int:
    """Points for an answer on the `tries`-th attempt worth `fraction` of it.

    Full marks first time; half thereafter, rounded up so a hard-won stage is
    never worth nothing. A student who works a case twice as carefully should
    out-score one who guesses their way through it.

    A part-right answer takes that share of what the attempt was worth, again
    never rounding down to nothing — the point of crediting partial reasoning
    is that it shows up on the scoreboard.
    """
    full = points if tries <= 1 else max(1, math.ceil(points / 2))
    if fraction >= 1:
        return full
    if fraction <= 0:
        return 0
    # Half-up rather than round(), whose banker's rounding would make 2.5
    # points land on 2 and 3.5 on 4 for no reason a student could follow.
    return max(1, math.floor(full * fraction + 0.5))


def should_reveal(tries: int) -> bool:
    return tries >= TRIES_BEFORE_REVEAL
