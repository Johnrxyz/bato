"""Django Channels WebSocket consumer for real-time project/Kanban updates."""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async


class ProjectConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer scoped to a single project room.
    Broadcasts task status changes, new tasks, and comment events
    to all connected clients in the same project.

    Active only in Docker production (ASGI + Redis).
    PythonAnywhere demo uses polling fallback in the frontend.
    """

    async def connect(self):
        self.project_id = self.scope["url_route"]["kwargs"]["project_id"]
        self.room_group = f"project_{self.project_id}"

        user = self.scope["user"]
        if not user.is_authenticated:
            await self.close()
            return

        is_member = await self._check_membership(user, self.project_id)
        if not is_member:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.room_group, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        # Clients do not send messages — server pushes only
        pass

    async def task_update(self, event):
        """Handler for task.update group messages — forwards to WebSocket client."""
        await self.send(text_data=json.dumps(event["payload"]))

    @database_sync_to_async
    def _check_membership(self, user, project_id):
        from apps.projects.models import ProjectMember
        return (
            user.is_staff
            or ProjectMember.objects.filter(project_id=project_id, user=user).exists()
        )
