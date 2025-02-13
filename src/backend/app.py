import os

import speech_recognition as sr
from flask_restx import Api, Resource, fields
import jsonschema
import spacy
from pathlib import Path
from heapq import nlargest
from flask import Flask, send_from_directory, request, send_file

import json
from celery.result import AsyncResult
from gtts import gTTS
import os
import docx

# setup the flask app and configure audio folder for file upload
app = Flask(__name__, static_folder=None)
app.config['UPLOAD_FOLDER'] = Path(__file__).absolute().parent / "audios"
app.config['UPLOAD_FOLDER'].mkdir(exist_ok=True)

# defining a decorator that can be useed for Flask routes and functions.
def validate_form_data(schema):
    def decorator(f):
        def wrapper(*args, **kwargs):
            data = request.form.to_dict()
            try:
                jsonschema.validate(data, schema)
            except jsonschema.ValidationError as e:
                #if data is invalid return error
                return {'message': 'Invalid request payload: {}'.format(e)}, 400
            return f(*args, **kwargs)

        return wrapper

    return decorator

# this function identifies summaries, then calculates the word frquencies
# it assigns a score to each sentence based on the word frequencies
# and forms a summary using a collection of the top sentences
def text_summerizer(text):
    nlp = spacy.load('en_core_web_sm')
    punctuations = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~\n'

    doc = nlp(text)

    # filter out stop words and punc
    sentences = [sent for sent in doc.sents if not all(token.is_stop or token.text in punctuations for token in sent)]
    words = [token.text for sent in sentences for token in sent if not token.is_stop and token.text not in punctuations]

    # Calculate word frequencies
    word_frequencies = {}
    for word in words:
        word = word.lower()
        if word not in word_frequencies:
            word_frequencies[word] = 1
        else:
            word_frequencies[word] += 1

    # Normalise word frequencies

    max_frequency = max(word_frequencies.values())
    for word in word_frequencies:
        word_frequencies[word] /= max_frequency

    # Calc sentences scores
    sentence_scores = {}
    for sent in sentences:
        sentence = sent.text.lower()
        sentence_scores[sent] = sum(word_frequencies.get(word.text.lower(), 0) for word in sent)

    # Choose top sentence for summary
    summary_size = min(3, len(sentences))
    summary_sentences = nlargest(summary_size, sentence_scores, key=sentence_scores.get)
    summary = ' '.join(sent.text for sent in summary_sentences)

    return summary

# app = Flask("app", static_folder=None)
# specify location of static files
static_dir = Path(__file__).absolute().parent.parent / "frontend/build"

# setting up a route handler used for static files
@app.get("/")
@app.get("/<path:path>")
def main_route(path=None):
    print(f"{path = }")
    try:
        if path is not None and (_path := Path(static_dir / path)).is_file():
            return send_from_directory(static_dir, path)
    except Exception as e:
        print(f"error ", e)
    return send_from_directory(static_dir, "index.html")

# api responses & request payload models, defining the structure of exchange
api = Api(app, doc='/swagger')
audio_upload = api.model('FormData', {
    'file': fields.Raw(required=True, type='file', description='Audio file (WAV)'),
})
text_upload = api.model('TextUploadResponse', {
    'text': fields.String()
})
text_response = api.model('TextResponse', {
    'message': fields.String(),
    'text': fields.String()
})
task_tracking_model = api.model("CeleryTaskModel", {
    "id": fields.String,
    "status": fields.String,
    "result": fields.Raw(attribute="_result"),
}, )

# flask RESTful API
# performs auido to text conversion
@api.route('/convert')
class ConvertResponse(Resource):
    """Class for audio to text conversion"""

    @api.expect(audio_upload)
    @api.doc(consumes=['multipart/form-data'])
    @api.marshal_with(task_tracking_model)
    @validate_form_data(audio_upload)
    def post(self):
        """Endpoint for audio to text conversion"""
        file = request.files.get('file')
        if not file:
            return {'message': 'No file uploaded'}, 400
        if file.filename.split('.')[-1].lower() != 'wav':
            return {'message': 'Please upload a WAV file'}, 400

        from celery_app import recognize_audio
        try:
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            print(file_path)
            file.save(file_path)
            task = recognize_audio.delay(file_path)
            return task
        # error/exception handling
        except sr.UnknownValueError:
            return {'message': 'Unable to recognize speech'}, 400
        except Exception as e:
            print(e)
            return {'message': str(e)}, 500

# flask RESTful API
# performs summarization, takes in JSON payload, validates data, uses the text_summarizer to 
# summarize and returns response
@api.route('/summarize')
class SummarizedResponse(Resource):
    """Class for text summarization"""

    @api.expect(text_upload)
    @api.marshal_with(text_response)
    @validate_form_data(text_upload)
    def post(self):
        """Endpoint for text summarization"""
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

# flask RESTful API
# for task tracking; status and result
@api.route("/task/<task_id>", methods=["GET"])
class TaskManager(Resource):
    """Class for task tracking"""

    @api.marshal_with(task_tracking_model)
    @api.doc(params={
        'task_id': {'description': 'task id', 'type': 'string', 'required': False}
    })
    def get(self, task_id):
        """Endpoint for task tracking"""
        from celery_app import celery_app
        task = AsyncResult(task_id, app=celery_app)

        if task.state == "PENDING":
            return {'message': 'No file uploaded'}, 400

        try:
            json.dumps(task.result or {})
            task._result = task.result
        except:
            task._result = str(task.result)
        task._traceback = str(task.traceback)

        return task

# flask RESTful API endpoint
# synthesises text to audio using gTTS, saves it, and returns it
@api.route('/audio/export')
class AudioExportResponse(Resource):
    """Class for summarize text audio export"""

    @api.expect(text_upload)
    @validate_form_data(text_upload)
    def post(self):
        """Endpoint for text summarization"""
        # define the text to convert to audio
        text = request.json['text']
        tts = gTTS(text)
        filename = f"{app.config['UPLOAD_FOLDER']}/audio.wav"
        tts.save(filename)
        return send_file(filename, mimetype='audio/wav',as_attachment=True)

# flask RESTful API endpoint
@api.route('/doc/export')
class DocumentExportResponse(Resource):
    """Class for Document text audio export"""

    @api.expect(text_upload)
    @validate_form_data(text_upload)
    def post(self):
        """Endpoint for text summarization"""
        # define the text to convert to audio
        text = request.json['text']
        doc = docx.Document()
        doc.add_paragraph(text)
        # save the document as a .docx file
        filename = f"{app.config['UPLOAD_FOLDER']}/output.docx"
        doc.save(filename)
        return send_file(filename,
                         mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True, port=5005)
