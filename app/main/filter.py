from . import main
from datetime import datetime
import os


@main.app_template_filter()
def is_cd(file_path):
    print(os.path.splitext(file_path)[1] == "cd")
    return os.path.splitext(file_path)[1] == ".cd"


@main.app_template_filter()
def past_time(timestamp_str):
    timestamp = datetime.strptime(timestamp_str, "%Y-%m-%dT%H:%M:%SZ")
    now = datetime.utcnow()
    delta = now - timestamp
    
    years = delta.days // 365
    months = delta.days // 30
    days = delta.days
    hours = delta.seconds // 3600
    minutes = (delta.seconds % 3600) // 60
    seconds = delta.seconds % 60

    if years > 0:
        return f"{years} year{'s' if years > 1 else ''} ago"
    elif months > 0:
        return f"{months} month{'s' if months > 1 else ''} ago"
    elif days > 0:
        return f"{days} day{'s' if days > 1 else ''} ago"
    elif hours > 0:
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    elif minutes > 0:
        return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
    else:
        return f"{seconds} second{'s' if seconds > 1 else ''} ago"
