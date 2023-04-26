import json

from producers.course.utils import destinations, sources
from producers.utils import get_meta, JSON_HEADER
from producers.base import BaseProducer


class CourseServiceSubscription(BaseProducer):

    emit_probability = 0.7

    def get_data_point(self) -> dict:
        req_body = {
            "query": "query CourseInfo($id: Int!, $params: CourseParams, $topic: String) {\n  course(id: $id) {\n    ...courseData\n  }\n  courseComplex(params: $params) {\n    ...courseData\n  }\n  courseComplexMultiple(params: [$params]) {\n    ...courseData\n  }\n  courses(topic: $topic) {\n    ...courseData\n    url\n  }\n}\n\nmutation UpdateCourse($id: Int!, $topic: String!) {\n  updateCourseTopic(id: $id, topic: $topic) {\n    ...courseData\n  }\n}\n\nsubscription GetCourses($topic: String) {\n  subscribedCourses(topic: $topic) {\n    ...courseData\n  }\n}\n\nfragment courseData on Course {\n  id\n  title\n  author\n  description\n  topic\n}\n",
            "variables": {
                "id": 1,
                "params": {"id": 1, "topic": "Node.js"},
                "topic": "JavaScript",
            },
            "operationName": "GetCourses",
        }
        resp_body = {
            "data": {
                "subscribedCourses": [
                    {
                        "id": 3,
                        "title": "JavaScript: Understanding The Weird Parts",
                        "author": "Anthony Alicea",
                        "description": "An advanced JavaScript course for everyone! Scope, closures, prototypes, this, build your own framework, and more.",
                        "topic": "JavaScript",
                    }
                ]
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
