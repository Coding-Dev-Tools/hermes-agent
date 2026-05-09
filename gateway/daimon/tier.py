from __future__ import annotations

from enum import Enum

from gateway.daimon.config import DaimonConfig


class Tier(Enum):
    """User access tier."""

    ADMIN = "admin"
    USER = "user"

    def model(self, cfg: DaimonConfig) -> str:
        """Return the model string for this tier."""
        if self is Tier.ADMIN:
            return cfg.admin_model
        return cfg.user_model

    @property
    def is_admin(self) -> bool:
        """Return True if this tier has admin privileges."""
        return self is Tier.ADMIN


def resolve_tier(user_id: str, cfg: DaimonConfig) -> Tier:
    """Determine the tier for a given user ID based on config."""
    if user_id in cfg.admin_users:
        return Tier.ADMIN
    return Tier.USER
