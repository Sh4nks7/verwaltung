import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'eine_sehr_geheime_zeichenkette'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///auftraege.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

