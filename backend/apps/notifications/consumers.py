"""WebSocket consumer for per-user notification push."""
from channels.generic.websocket import AsyncWebsocketConsumer
import json


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    Maintains a private channel per user for real-time notification delivery.
    Backend pushes new notifications via channel_layer.group_send.
    Active only in Docker/ASGI mode.
    """

    async def connect(self):
        user = self.scope["user"]
        if not user.is_authenticated:
            await self.close()
            return
        self.group_name = f"notifications_{user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        pass  # Server-push only

    async def notify(self, event):
        """Handler for notification.send group messages."""
        await self.send(text_data=json.dumps(event["payload"]))
