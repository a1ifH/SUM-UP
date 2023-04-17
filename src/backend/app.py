import os

import speech_recognition as sr
from flask_restx import Api, Resource, fields
import jsonschema
from flask import Flask, send_from_directory, request, send_file
from pathlib import Path
import json

app = Flask(__name__, static_folder=None)
app.config['UPLOAD_FOLDER'] = Path(__file__).absolute().parent / "audios"
app.config['UPLOAD_FOLDER'].mkdir(exist_ok=True)

def validate_form_data(schema):
    def decorator(f):
        def wrapper(*args, **kwargs):
            data = request.form.to_dict()
            try:
                jsonschema.validate(data, schema)
            except jsonschema.ValidationError as e:
                return {'message': 'Invalid request payload: {}'.format(e)}, 400
            return f(*args, **kwargs)

        return wrapper

    return decorator
