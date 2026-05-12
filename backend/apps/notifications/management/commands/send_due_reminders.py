from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.tasks.models import Task
from apps.notifications.models import Notification

class Command(BaseCommand):
    help = 'Sends notifications for tasks due within the next 24 hours'

    def handle(self, *args, **options):
        now = timezone.now()
        tomorrow = now + timedelta(days=1)
        
        # Find tasks due in the next 24 hours that are not DONE or CANCELLED
        tasks = Task.objects.filter(
            due_date__range=(now, tomorrow),
            status__in=[Task.Status.TODO, Task.Status.IN_PROGRESS, Task.Status.IN_REVIEW]
        ).prefetch_related('assignees')

        self.stdout.write(f"Found {tasks.count()} tasks due soon.")

        count = 0
        for task in tasks:
            for user in task.assignees.all():
                # Check if we already sent a DUE_SOON notification for this task to this user today
                # This prevents duplicate spam if the command is run multiple times
                exists = Notification.objects.filter(
                    recipient=user,
                    type=Notification.Type.DUE_SOON,
                    action_url=f"/tasks/{task.id}",
                    created_at__date=now.date()
                ).exists()

                if not exists:
                    Notification.objects.create(
                        recipient=user,
                        type=Notification.Type.DUE_SOON,
                        title=f'Task Due Soon: "{task.title}"',
                        body=f'This task is due on {task.due_date.strftime("%Y-%m-%d %H:%M")}.',
                        action_url=f"/tasks/{task.id}"
                    )
                    count += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully created {count} notifications."))
