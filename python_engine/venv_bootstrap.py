"""Re-exec under python_engine/.venv when system Python lacks pyswisseph."""
from __future__ import annotations

import os
import sys


def _can_reexec_script() -> bool:
    """True when argv looks like a .py file invocation (not python -c / -m)."""
    if not sys.argv:
        return False
    entry = sys.argv[0]
    if entry in ("-c", "-m", "-"):
        return False
    return entry.endswith(".py") or os.path.isfile(entry)


def ensure_project_venv() -> None:
    try:
        import swisseph  # noqa: F401
        return
    except ModuleNotFoundError:
        pass

    engine_dir = os.path.dirname(os.path.abspath(__file__))
    venv_python = os.path.join(
        engine_dir,
        ".venv",
        "Scripts" if os.name == "nt" else "bin",
        "python.exe" if os.name == "nt" else "python",
    )
    if (
        _can_reexec_script()
        and os.path.isfile(venv_python)
        and os.path.abspath(sys.executable) != os.path.abspath(venv_python)
    ):
        os.execv(venv_python, [venv_python, *sys.argv])

    sys.stderr.write(
        "ModuleNotFoundError: No module named 'swisseph'.\n"
        "Install engine deps into the project venv:\n"
        "  npm run setup:python\n"
        "Or:\n"
        "  cd python_engine && python3 -m venv .venv && "
        ".venv/bin/pip install -r requirements.txt\n"
        "Then run with python_engine/.venv/bin/python, or set ASTRO_WORLD_PYTHON.\n"
    )
    raise SystemExit(1)
