"""
Pytest configuration for behavioral-service tests.

Adds the behavioral-service directory to the Python path for imports.
"""

import sys
from pathlib import Path

# Add behavioral-service directory to path so imports like 'src.models' work
behavioral_service_path = Path(__file__).parent.parent
sys.path.insert(0, str(behavioral_service_path))
