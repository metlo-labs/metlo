import json

from producers.course.utils import destinations, sources
from producers.utils import get_meta, JSON_HEADER
from producers.base import BaseProducer


class CourseServiceGetQuery(BaseProducer):

    emit_probability = 0.07

    def get_data_point(self) -> dict:
        resp_body = {
            "data": {
                "course": {
                    "id": 1,
                    "title": "The Complete Node.js Developer Course",
                    "author": "Andrew Mead, Rob Percival",
                    "description": "Learn Node.js by building real-world applications with Node, Express, MongoDB, Mocha, and more!",
                    "topic": "JavaScript",
                    "url": "https://codingthesmartway.com/courses/nodejs/",
                }
            }
        }

        return {
            "request": {
                "url": {
                    "host": "test-courses-service.metlo.com",
                    "path": "/graphql",
                    "parameters": [
                        {
                            "name": "query",
                            "value": "query CourseInfo($id: Int!, $params: CourseParams, $topic: String) {\n  course(id: $id) {\n    ...courseData\n  }\n  courseComplex(params: $params) {\n    ...courseData\n  }\n  courseComplexMultiple(params: [$params]) {\n    ...courseData\n  }\n  courses(topic: $topic) {\n    ...courseData\n    url\n  }\n}\n\nquery CourseInfoGet {\n  course(id: 1) {\n    id\n    title\n    author\n    description\n    topic\n    url\n  }\n}\n\nmutation UpdateCourse($id: Int!, $topic: String!) {\n  updateCourseTopic(id: $id, topic: $topic) {\n    ...courseData\n  }\n}\n\nsubscription GetCourses($topic: String) {\n  subscribedCourses(topic: $topic) {\n    ...courseData\n  }\n}\n\nfragment courseData on Course {\n  id\n  title\n  author\n  description\n  topic\n}\n",
                        },
                        {"name": "operationName", "value": "CourseInfoGet"},
                    ],
                },
                "headers": [],
                "method": "GET",
                "body": "",
            },
            "response": {
                "status": 200,
                "headers": [JSON_HEADER],
                "body": json.dumps(resp_body),
            },
            "meta": get_meta(sources, destinations),
        }
