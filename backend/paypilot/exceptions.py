from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    # If an exception is handled by DRF, reformat the response payload
    if response is not None:
        if 'detail' in response.data:
            # Standard detail error (e.g. 404 Not Found, 401 Unauthenticated)
            response.data['error'] = response.data.pop('detail')
        else:
            # Field validation errors (e.g. 400 Bad Request serializer validation errors)
            errors = []
            for field, messages in response.data.items():
                if isinstance(messages, list):
                    errors.append(f"{field}: {', '.join(messages)}")
                else:
                    errors.append(f"{field}: {messages}")
            
            # Keep validation_errors dict and format a flat error message
            response.data = {
                'error': '; '.join(errors),
                'validation_errors': response.data
            }
    else:
        # For server-side errors (500), wrap them nicely in a clean error format rather than crashing
        # Note: during debug mode we can show details, but we always want a JSON response
        from django.conf import settings
        if not settings.DEBUG:
            response = Response({
                'error': 'An internal server error occurred.',
                'detail': str(exc)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    return response
