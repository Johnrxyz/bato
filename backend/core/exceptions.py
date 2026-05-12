"""Custom DRF exception handler producing consistent error envelopes."""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        errors = response.data

        # Normalize to a consistent shape
        if isinstance(errors, list):
            detail = errors
        elif isinstance(errors, dict):
            detail = errors
        else:
            detail = str(errors)

        response.data = {
            "status": "error",
            "code": response.status_code,
            "detail": detail,
        }
    else:
        # Unhandled exceptions — log and return 500
        logger.exception("Unhandled exception in %s", context.get("view"))
        response = Response(
            {
                "status": "error",
                "code": status.HTTP_500_INTERNAL_SERVER_ERROR,
                "detail": "An unexpected error occurred.",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response
