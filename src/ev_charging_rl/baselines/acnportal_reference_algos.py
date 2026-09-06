"""
acnportal_reference_algos.py

Thin wrapper exposing ACNPortal's own built-in scheduling algorithms
so they can be run through the same evaluate.py comparison harness as
our custom baselines and RL policy. Running these gives a credibility
check: if our RL policy can't beat even ACNPortal's own reference
algorithms, something is wrong before we go further.

NOTE: exact algorithm class names available depend on your installed
acnportal version -- check `acnportal.algorithms` for the full list.
Common ones include uncontrolled charging and earliest-deadline-first
variants.
"""

try:
    from acnportal.algorithms import (
        UncontrolledCharging,
        SortedSchedulingAlgo,
        earliest_deadline_first,
    )
except ImportError as e:
    raise ImportError(
        "acnportal is not installed, or these specific algorithm names "
        "have changed in your installed version -- run "
        "`python -c \"import acnportal.algorithms as a; print(dir(a))\"` "
        "to see what's actually available, and update the imports above."
    ) from e


def get_uncontrolled_algorithm():
    """
    Every EV charges at max rate immediately on arrival, no
    coordination at all. This is arguably an even more naive baseline
    than our own FCFS, since it doesn't even queue by arrival order --
    useful as an absolute worst-case reference point.
    """
    return UncontrolledCharging()


def get_earliest_deadline_first_algorithm():
    """
    ACNPortal's built-in EDF-style algorithm -- prioritizes EVs with
    the soonest departure, broadly similar in spirit to the urgency
    component of our own priority_score.py, but without the
    remaining-energy, flexibility, or fairness-debt factors.
    """
    return SortedSchedulingAlgo(earliest_deadline_first)


ALL_REFERENCE_ALGORITHMS = {
    "uncontrolled": get_uncontrolled_algorithm,
    "earliest_deadline_first": get_earliest_deadline_first_algorithm,
}
