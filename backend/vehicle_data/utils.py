from django.utils import timezone
from datetime import timezone as dt_timezone

def ensure_aware_utc(dt):
    if dt is not None:
        if timezone.is_naive(dt):
            return timezone.make_aware(dt, dt_timezone.utc)
        return dt.astimezone(dt_timezone.utc)
    return dt 