import os

import speech_recognition as sr
from flask_restx import Api, Resource, fields
import jsonschema
from flask import Flask, send_from_directory, request, send_file
from pathlib import Path
import json
import spacy

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

def text_summerizer(text):
    nlp = spacy.load('en_core_web_sm')
    punctuations = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~\n'

    doc = nlp(text)


    sentences = [sent for sent in doc.sents if not all(token.is_stop or token.text in punctuations for token in sent)]
    words = [token.text for sent in sentences for token in sent if not token.is_stop and token.text not in punctuations]

    word_frequencies = {}
    for word in words:
        word = word.lower()
        if word not in word_frequencies:
            word_frequencies[word] = 1
        else:
            word_frequencies[word] += 1


    max_frequency = max(word_frequencies.values())
    for word in word_frequencies:
        word_frequencies[word] /= max_frequency

    sentence_scores = {}
    for sent in sentences:
        sentence = sent.text.lower()
        sentence_scores[sent] = sum(word_frequencies.get(word.text.lower(), 0) for word in sent)

    summary_size = min(3, len(sentences))
    summary_sentences = nlargest(summary_size, sentence_scores, key=sentence_scores.get)
    summary = ' '.join(sent.text for sent in summary_sentences)

    return summary


static_dir = Path(__file__).absolute().parent.parent / "frontend/build"


@api.route('/summarize')
class SummarizedResponse(Resource):

    @api.expect(text_upload)
    @api.marshal_with(text_response)
    @validate_form_data(text_upload)
    def post(self):
        data = request.json['text']
        try:
            summery = text_summerizer(text=data)
            if summery == "":
                return {
                    'message': "Text is no Summarize able",
                    'text': data
                }
            else:
                return {
                    'message': "Summarize Successfully",
                    'text': summery
                }

        except Exception as e:
            return {'message': str(e)}, 500
