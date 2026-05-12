"""Post-registration signals for the accounts app."""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

User = get_user_model()


@receiver(post_save, sender=User)
def on_user_created(sender, instance, created, **kwargs):
    """Placeholder for post-registration hooks (e.g. welcome email, onboarding)."""
    if created:
        pass  # TODO: dispatch welcome email via Celery
