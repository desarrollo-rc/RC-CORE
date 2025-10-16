# backend/manage.py
import click
from flask.cli import with_appcontext
from app import create_app
from app.extensions import db

app = create_app()