#/usr/bin/python
import sys
import logging
import os

sys.path.insert(0, "/home/codination/ver1")
from app import create_app
application = create_app('development')
