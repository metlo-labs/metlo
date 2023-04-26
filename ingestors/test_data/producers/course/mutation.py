import json

from producers.course.utils import destinations, sources
from producers.utils import get_meta, JSON_HEADER
from producers.base import BaseProducer


class CourseServiceMutation(BaseProducer):

    emit_probability = 0.7

    def get_data_point(self) -> dict:
        req_body = {
            "query": "query CourseInfo($id: Int!, $params: CourseParams, $topic: String) {\n  course (id: $id) {\n    ...courseData\n  }\n  courseComplex(params: $params) {\n    ...courseData\n  }\n  courseComplexMultiple(params: [$params]) {\n    ...courseData\n  }\n  courses(topic: $topic) {\n    ...courseData\n    url\n  }\n}\n\nmutation UpdateCourse($id: Int!, $topic: String!) {\n  updateCourseTopic(id: $id, topic: $topic) {\n    ...courseData\n  }\n}\n\nsubscription GetCourses($topic: String) {\n  courses(topic: $topic) {\n    ...courseData\n  }\n}\n\nfragment courseData on Course {\n\tid\n  title\n  author\n  description\n\ttopic\n}\n#\n\n",
            "variables": {
                "id": 1,
                "params": {"id": 1, "topic": "Node.js"},
                "topic": "JavaScript",
            },
            "operationName": "UpdateCourse",
        }
        resp_body = {
            "data": {
                "updateCourseTopic": {
                    "id": 1,
                    "title": "The Complete Node.js Developer Course",
                    "author": "Andrew Mead, Rob Percival",
                    "description": "Learn Node.js by building real-world applications with Node, Express, MongoDB, Mocha, and more!",
                    "topic": "JavaScript",
                }
            }
        }

        return {
            "request": {
                "url": {
                    "host": "test-courses-service.metlo.com",
                    "path": "/graphql",
                    "parameters": [],
                },
                "headers": [JSON_HEADER],
                "method": "POST",
                "body": json.dumps(req_body),
            },
            "response": {
                "status": 200,
                "headers": [JSON_HEADER],
                "body": json.dumps(resp_body),
            },
            "meta": get_meta(sources, destinations),
        }
