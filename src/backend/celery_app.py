import logging

from celery import Celery, current_task
from celery.result import AsyncResult
from app import app as main_app
import speech_recognition as sr
import spacy


def create_celery_app(app):
    capp = Celery(
        "bg_worker",
        backend='redis://redis_broker:6379/0',
        broker='redis://redis_broker:6379/0',
        include=["celery_app"],
    )
    capp.conf.update(
        result_expires=3600,
        accept_content=["json", "msgpack"],
        result_serializer="msgpack",
        task_default_queue="celery_queue"
    )
    TaskBase = capp.Task
    capp.app = app

    class ContextTask(TaskBase):

        abstract = True

        def __call__(self, *args, **kwargs):

            with capp.app.app_context():
                try:
                    return TaskBase.__call__(self, *args, **kwargs)
                except BaseException as be:
                    raise (be)

    capp.Task = ContextTask
    return capp


def get_job(job_id, capp):
    return AsyncResult(job_id, app=capp)


celery_app = create_celery_app(main_app)


@celery_app.task(name="recognize_audio")
def recognize_audio(file):
    nlp = spacy.load("en_core_web_sm")
    print(f"test: {file}")
    logging.debug(f"test: {file}")
    r = sr.Recognizer()

    with sr.AudioFile(file) as source:
        audio = r.record(source, duration=30)

        r.callback = lambda recognizer, audio: print(f"Recognizing audio...")
        text = " "
        try:
            data = r.recognize_google(audio,show_all=False, language='en-US')
            text += " " + data
        except sr.UnknownValueError:
            print("Could not understand audio")
        chunk_no = 0
        prev_text = ""
        curr_text = ""
        while True:
            chunk_no += 1
            audio = r.record(source, duration=5)
            try:
                data = r.recognize_google(audio, show_all=False, language='en-US')
                text += " " + data

                current_task.update_state(state="PROGRESS", meta={"text": text})

            except sr.UnknownValueError:
                print("Could not understand audio")

            if len(audio.frame_data) == 0 or r.energy_threshold == 0:
                logging.debug(text)
                doc = nlp(text)
                text_with_punct = ""
                for i, token in enumerate(doc):
                    if i > 0 and token.is_alpha and token.is_upper:
                        text_with_punct += ". "
                    text_with_punct += token.text_with_ws
                print(text_with_punct)
                return text_with_punct
