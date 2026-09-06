from setuptools import setup, find_packages

setup(
    name="ev_charging_rl",
    version="0.1.0",
    description="Reinforcement Learning for EV Charging Load-Balancing on Unreliable Grids",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    python_requires=">=3.9",
    install_requires=[
        "pandapower>=2.13.0",
        "gymnasium>=0.29.0",
        "stable-baselines3>=2.2.0",
        "torch>=2.0.0",
        "numpy>=1.24.0",
        "pandas>=2.0.0",
        "scipy>=1.10.0",
        "pydantic>=2.0.0",
        "fastapi>=0.100.0",
        "uvicorn>=0.23.0",
        "pyyaml>=6.0",
    ],
)
