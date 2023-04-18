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
