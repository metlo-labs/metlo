from datetime import datetime, timedelta
from typing import List
from uuid import uuid4
import json
from random import choice

from producers.base import BaseProducer


PRODUCT_UUIDS = [
    "b382d3c8-cb40-467c-8f7f-3d1797c7766c",
    "9416e00e-c299-472b-bcd0-74eaf876db01",
    "3dd4b36a-1d09-402c-a07a-ade126eeabb3",
    "7fed32b3-4499-446d-b668-925d66cdc6f6",
    "4dddaa95-3daa-48c8-969f-c3579df93f95",
    "8ebcb46e-cd71-4076-af4e-01cfdb9c3435",
    "87ddd8fd-00a6-4a34-a2b4-2a929967fd53",
    "eeca35f5-a06c-481f-a59e-5df61af5596b",
    "a92aa16b-1b6a-4db6-a651-83dea378f8c8",
    "d7ac0757-c068-43bf-b59e-e4d44e44b2e4",
    "eeb4aed0-9382-43a7-92c5-0b088096a02d",
    "6548b966-a6d3-47d3-a6b5-48d72baa3635",
    "0666c689-98af-4625-89e4-ea2af0f6ff9e",
    "4ab58704-d85b-4c40-98eb-881f1c0fd467",
    "8ff9425e-da2b-4959-b6de-c6065e4de822",
    "8dba2da7-88ab-45d8-991d-2ddac0f17ff8",
    "644f752b-dc2e-410a-b2e6-d85c4c9669b8",
    "4f3097f5-7256-43d4-8b8b-88e76c013971",
    "e883b717-8469-446a-8702-4dd8230cdf38",
    "3474fa67-7620-41e1-9a5a-d9195707b276",
]


class EcommerceAddProductToCartProducer(BaseProducer):

    avg_emit_delta = timedelta(seconds=10)

    def get_data_points(self, time: datetime) -> List[dict]:
        product_uuid = choice(PRODUCT_UUIDS)
        cart_uuid = uuid4()
        req_body = {
            "product_uuid": product_uuid,
        }
        resp_body = {
            "ok": True,
            "msg": "Added to cart..."
        }
        return [
            {
                "request": {
                    "url": {
                        "base_url": f"/cart/{cart_uuid}/add-product",
                        "parameters": []
                    },
                    "method": "POST",
                    "body": json.dumps(req_body),
                },
                "response": {
                    "status": 200,
                    "body": json.dumps(resp_body),
                },
            }
        ]
