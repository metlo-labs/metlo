import json

from producers.course.utils import destinations, attack_sources
from producers.utils import get_meta, JSON_HEADER
from producers.base import BaseProducer


class CourseServiceQueryIntrospection(BaseProducer):
    emit_probability = 0.01

    def get_data_point(self) -> dict:
        req_body = {
            "query": '\nquery getSingleCourse($courseID: Int!, $topic: String!) {\n  __schema {\n  \tdirectives {\n      name\n    }\n  }\n  course(id: $courseID) {\n    title @include(if: true)\n    author\n    des2: description\n    topic\n    url\n  }\n  course2: course(id: 2) {\n    ...courseFields\n  }\n  courses(topic: $topic) {\n    title\n    ...courseFields\n  }\n  courses2: courses(topic: "127.0.0.1") {\n    ...courseFields\n  }\n  courseComplex(params: { id: $courseID, topic: $topic}) {\n    ...courseFields\n  }\n  courseComplexMultiple(params: [{id: 2, topic: "1234 King Ave"}, { id: 1, topic: "127.0.0.1"}]) {\n    title\n    ...courseFields\n  }\n}\n\nsubscription getCourses {\n  courseswowzers: courses(topic: "Node.js") {\n    ...courseFields\n  }\n}\n\nmutation updateCourseTopic($id: Int!, $topic: String!) {\n  updateCourseTopic(id: $id, topic: $topic) {\n    ...courseFields\n  }\n}\n\n\nfragment courseFields on Course {\n  author\n  description\n  topic\n  url\n}\n',
            "variables": {"courseID": 1, "topic": "1234 King Ave", "id": 2},
            "operationName": "getSingleCourse",
        }
        resp_body = {
            "data": {
                "__schema": {
                    "directives": [
                        {"name": "include"},
                        {"name": "skip"},
                        {"name": "deprecated"},
                        {"name": "specifiedBy"},
                    ]
                },
                "course": {
                    "title": "The Complete Node.js Developer Course",
                    "author": "Andrew Mead, Rob Percival",
                    "des2": "Learn Node.js by building real-world applications with Node, Express, MongoDB, Mocha, and more!",
                    "topic": "Node.js",
                    "url": "https://codingthesmartway.com/courses/nodejs/",
                },
                "course2": {
                    "author": "Brad Traversy",
                    "description": "Learn by example building & deploying real-world Node.js applications from absolute scratch",
                    "topic": "Node.js",
                    "url": "https://codingthesmartway.com/courses/nodejs-express-mongodb/",
                },
                "courses": [],
                "courses2": [],
                "courseComplex": {
                    "author": "Andrew Mead, Rob Percival",
                    "description": "Learn Node.js by building real-world applications with Node, Express, MongoDB, Mocha, and more!",
                    "topic": "Node.js",
                    "url": "https://codingthesmartway.com/courses/nodejs/",
                },
                "courseComplexMultiple": [
                    {
                        "title": "The Complete Node.js Developer Course",
                        "author": "Andrew Mead, Rob Percival",
                        "description": "Learn Node.js by building real-world applications with Node, Express, MongoDB, Mocha, and more!",
                        "topic": "Node.js",
                        "url": "https://codingthesmartway.com/courses/nodejs/",
                    },
                    {
                        "title": "Node.js, Express & MongoDB Dev to Deployment",
                        "author": "Brad Traversy",
                        "description": "Learn by example building & deploying real-world Node.js applications from absolute scratch",
                        "topic": "Node.js",
                        "url": "https://codingthesmartway.com/courses/nodejs-express-mongodb/",
                    },
                    {
                        "title": "JavaScript: Understanding The Weird Parts",
                        "author": "Anthony Alicea",
                        "description": "An advanced JavaScript course for everyone! Scope, closures, prototypes, this, build your own framework, and more.",
                        "topic": "JavaScript",
                        "url": "https://codingthesmartway.com/courses/understand-javascript/",
                    },
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
            "meta": get_meta(attack_sources, destinations),
        }
