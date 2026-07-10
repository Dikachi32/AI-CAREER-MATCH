"""
AI Career Match — Routes Package
=================================

Exports all Flask blueprints for clean registration in the Application Factory.

Usage in app.py::

    from routes import ai_career_bp, ai_career_v2_bp
    app.register_blueprint(ai_career_bp)
    app.register_blueprint(ai_career_v2_bp)

Blueprints:
    ai_career_bp      Phase 1 legacy routes (defined in app.py for historical reasons)
    ai_career_v2_bp   Phase 2 V2 routes under /api/v2/ai-career
"""

from routes.ai_career_intelligence import ai_career_v2_bp

# NOTE: ai_career_bp (Phase 1 legacy) is defined directly in app.py because it
# was created before the routes package was formalized.  It remains there to
# avoid circular-import issues with the Application Factory.  New blueprints
# should be defined in their own submodule and imported here.

__all__ = [
    "ai_career_v2_bp",
]