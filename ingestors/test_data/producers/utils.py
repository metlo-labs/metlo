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


def get_auth_header():
    return {
        "name": "X-API-KEY",
        "value": str(uuid4()),
    }
