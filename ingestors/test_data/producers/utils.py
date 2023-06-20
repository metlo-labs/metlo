from uuid import uuid4
from random import choice
from faker import Faker
from faker.providers import internet

fake = Faker()
fake.add_provider(internet)


JSON_HEADER = {
    "name": "content-type",
    "value": "application/json; charset=utf-8",
}


def get_meta(sources, destinations):
    source = choice(sources)
    destination = choice(destinations)
    return {
        "environment": "production",
        "incoming": True,
        "source": source[0],
        "sourcePort": source[1],
        "destination": destination[0],
        "destinationPort": destination[1],
    }


attack_users = [
    {
        "user": "jamie92@yahoo.com",
        "meta": get_meta([("24.149.230.32", 11792)], [("4.219.245.8", 80)]),
    },
    {
        "user": "lisa72@hotmail.com",
        "meta": get_meta([("166.235.41.182", 16487)], [("4.219.245.8", 80)]),
    },
    {
        "user": "daviseric@hotmail.com",
        "meta": get_meta([("176.185.161.186", 11792)], [("4.219.245.8", 80)]),
    },
    {
        "user": "hicksjeffrey@yahoo.com",
        "meta": get_meta([("74.176.60.245", 16487)], [("13.13.138.145", 80)]),
    },
    {
        "user": "simmonsjennifer@gmail.com",
        "meta": get_meta([("153.131.151.38", 19212)], [("13.13.138.145", 80)]),
    },
]


def get_user():
    user = choice(attack_users)
    return user


def get_auth_header():
    return {
        "name": "X-API-KEY",
        "value": str(uuid4()),
    }
