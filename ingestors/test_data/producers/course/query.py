import json

from producers.course.utils import destinations, sources
from producers.utils import get_meta, JSON_HEADER
from producers.base import BaseProducer


class CourseServiceQuery(BaseProducer):

    emit_probability = 0.07

    def get_data_point(self) -> dict:
        req_body = {
            "query": "query CourseInfo($id: Int!, $params: CourseParams, $topic: String) {\n  course(id: $id) {\n    ...courseData\n  }\n  courseComplex(params: $params) {\n    ...courseData\n  }\n  courseComplexMultiple(params: [$params]) {\n    ...courseData\n  }\n  courses(topic: $topic) {\n    ...courseData\n    url\n  }\n}\n\nmutation UpdateCourse($id: Int!, $topic: String!) {\n  updateCourseTopic(id: $id, topic: $topic) {\n    ...courseData\n  }\n}\n\nsubscription GetCourses($topic: String) {\n  subscribedCourses(topic: $topic) {\n    ...courseData\n  }\n}\n\nfragment courseData on Course {\n  id\n  title\n  author\n  description\n  topic\n}\n",
            "variables": {
                "id": 1,
                "params": {"id": 1, "topic": "Node.js"},
                "topic": "JavaScript",
            },
            "operationName": "CourseInfo",
        }
        resp_body = {
            "data": {
                "course": {
                    "id": 1,
                    "title": "The Complete Node.js Developer Course",
                    "author": "Andrew Mead, Rob Percival",
                    "description": "Learn Node.js by building real-world applications with Node, Express, MongoDB, Mocha, and more!",
                    "topic": "Node.js",
                },
                "courseComplex": {
                    "id": 1,
                    "title": "The Complete Node.js Developer Course",
                    "author": "Andrew Mead, Rob Percival",
                    "description": "Learn Node.js by building real-world applications with Node, Express, MongoDB, Mocha, and more!",
                    "topic": "Node.js",
                },
                "courseComplexMultiple": [
                    {
                        "id": 1,
                        "title": "The Complete Node.js Developer Course",
                        "author": "Andrew Mead, Rob Percival",
                        "description": "Learn Node.js by building real-world applications with Node, Express, MongoDB, Mocha, and more!",
                        "topic": "Node.js",
                    },
                    {
                        "id": 2,
                        "title": "Node.js, Express & MongoDB Dev to Deployment",
                        "author": "Brad Traversy",
                        "description": "Learn by example building & deploying real-world Node.js applications from absolute scratch",
                        "topic": "Node.js",
                    },
                    {
                        "id": 3,
                        "title": "JavaScript: Understanding The Weird Parts",
                        "author": "Anthony Alicea",
                        "description": "An advanced JavaScript course for everyone! Scope, closures, prototypes, this, build your own framework, and more.",
                        "topic": "JavaScript",
                    },
                ],
                "courses": [
                    {
                        "id": 3,
                        "title": "JavaScript: Understanding The Weird Parts",
                        "author": "Anthony Alicea",
                        "description": "An advanced JavaScript course for everyone! Scope, closures, prototypes, this, build your own framework, and more.",
                        "topic": "JavaScript",
                        "url": "https://codingthesmartway.com/courses/understand-javascript/",
                    }
                ],
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
