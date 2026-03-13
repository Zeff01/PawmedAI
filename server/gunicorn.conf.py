import os

bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"
workers = 2
timeout = 120
graceful_timeout = 30
keepalive = 5
worker_class = "sync"
loglevel = "info"
accesslog = "-"
errorlog = "-"