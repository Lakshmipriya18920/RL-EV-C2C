"""
acnportal_reference_algos.py

Thin import/config layer exposing ACNPortal's own built-in
reference algorithms (e.g. uncontrolled charging, greedy/earliest-
deadline-first) so they can be run through the same evaluate.py
comparison harness as our custom baselines and RL policy.

Reference: https://acnportal.readthedocs.io/en/latest/

TODO:
- get_uncontrolled_algorithm() -> acnportal.algorithms.<...>
- get_earliest_deadline_first_algorithm() -> acnportal.algorithms.<...>
"""
