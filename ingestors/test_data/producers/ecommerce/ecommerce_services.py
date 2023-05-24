from typing import List
from uuid import uuid4
import json
from random import choice

from producers.ecommerce.utils import sources, destinations
from producers.utils import get_auth_header, get_meta, JSON_HEADER
from producers.base import BaseProducer
from producers.ecommerce.services import ALL_SUBCLASSESS


PATH_EXTENSION_SINGLE = [
    {"path": "delete", "method": ["DELETE"]},
    {"path": "update", "method": ["PUT", "PATCH"]},
]

BASE_RESP = {"ok": True}

ECOMMERCE_SERVICES = [
    {"path": "/checkout", "resp": BASE_RESP},
    {"path": "/subscription", "resp": BASE_RESP},
    {"path": "/promotion", "resp": BASE_RESP},
    {"path": "/invoice", "resp": BASE_RESP},
    {"path": "/notification", "resp": BASE_RESP},
    {"path": "/transaction", "resp": BASE_RESP},
    {"path": "/address", "resp": BASE_RESP},
    {"path": "/account", "resp": BASE_RESP},
    {"path": "/webhook", "resp": BASE_RESP},
    {"path": "/discount", "resp": BASE_RESP},
    {"path": "/payment-method", "resp": BASE_RESP},
    {"path": "/order", "resp": BASE_RESP},
    {"path": "/shipment", "resp": BASE_RESP},
    {"path": "/wallet", "resp": BASE_RESP},
    {"path": "/customer", "resp": BASE_RESP},
    {"path": "/receipt", "resp": BASE_RESP},
    {"path": "/payment", "resp": BASE_RESP},
    {"path": "/merchat", "resp": BASE_RESP},
    {"path": "/coupon", "resp": BASE_RESP},
    {"path": "/refund", "resp": BASE_RESP},
    {"path": "/billing", "resp": BASE_RESP},
    {"path": "/log", "resp": BASE_RESP},
    {"path": "/buyer", "resp": BASE_RESP},
    {"path": "/seller", "resp": BASE_RESP},
    {"path": "/user", "resp": BASE_RESP},
    {"path": "/reminder", "resp": BASE_RESP},
    {"path": "/category", "resp": BASE_RESP},
    {"path": "/supplier", "resp": BASE_RESP},
    {"path": "/inventory", "resp": BASE_RESP},
    {"path": "/store", "resp": BASE_RESP},
    {"path": "/gift-card", "resp": BASE_RESP},
    {"path": "/recommendation", "resp": BASE_RESP},
    {"path": "/banner", "resp": BASE_RESP},
    {"path": "/bundle", "resp": BASE_RESP},
    {"path": "/warranty", "resp": BASE_RESP},
    {"path": "/feedback", "resp": BASE_RESP},
    {"path": "/shipping-method", "resp": BASE_RESP},
    {"path": "/campaign", "resp": BASE_RESP},
    {"path": "/size", "resp": BASE_RESP},
    {"path": "/vendor", "resp": BASE_RESP},
    {"path": "/store-location", "resp": BASE_RESP},
    {"path": "/payment-gateway", "resp": BASE_RESP},
    {"path": "/shipping-label", "resp": BASE_RESP},
    {"path": "/product-tag", "resp": BASE_RESP},
    {"path": "/customer-activity", "resp": BASE_RESP},
    {"path": "/shipping-address", "resp": BASE_RESP},
    {"path": "/billing-address", "resp": BASE_RESP},
    {"path": "/product-image", "resp": BASE_RESP},
    {"path": "/product-video", "resp": BASE_RESP},
    {"path": "/product-tag", "resp": BASE_RESP},
    {"path": "/product-attribute", "resp": BASE_RESP},
    {"path": "/product-variant", "resp": BASE_RESP},
    {"path": "/warehouse", "resp": BASE_RESP},
    {"path": "/message", "resp": BASE_RESP},
    {"path": "/ticket", "resp": BASE_RESP},
    {"path": "/comment", "resp": BASE_RESP},
    {"path": "/chat", "resp": BASE_RESP},
    {"path": "/reward", "resp": BASE_RESP},
    {"path": "/blog-post", "resp": BASE_RESP},
    {"path": "/guide", "resp": BASE_RESP},
    {"path": "/event", "resp": BASE_RESP},
    {"path": "/testimonial", "resp": BASE_RESP},
    {"path": "/survey", "resp": BASE_RESP},
    {"path": "/contest", "resp": BASE_RESP},
    {"path": "/badge", "resp": BASE_RESP},
    {"path": "/affiliate", "resp": BASE_RESP},
    {"path": "/catalog", "resp": BASE_RESP},
    {"path": "/brand-catalog", "resp": BASE_RESP},
    {"path": "/partner", "resp": BASE_RESP},
    {"path": "/referral", "resp": BASE_RESP},
    {"path": "/status/orders", "resp": BASE_RESP},
    {"path": "/status/payments", "resp": BASE_RESP},
    {"path": "/status/inventory", "resp": BASE_RESP},
    {"path": "/status/shipping", "resp": BASE_RESP},
    {"path": "/status/customers", "resp": BASE_RESP},
    {"path": "/return", "resp": BASE_RESP},
]


def get_service_info(service):
    uuid = str(uuid4())
    path = service["path"]
    extension = choice(PATH_EXTENSION_SINGLE)
    ext_path = extension["path"]
    ext_method = extension["method"]
    paths = [
        [f"{path}/{uuid}", ["GET"], service["resp"]],
        [f"{path}/list", ["GET"], service["resp"]],
        [f"{path}/new", ["POST"], service["resp"]],
        [f"{path}/{uuid}/{ext_path}", ext_method, service["resp"]],
    ]
    return choice(paths)


class EcommerceServicesProducer(BaseProducer):
    emit_probability = 0.1

    def get_data_point(self) -> dict:
        info_type = choice(["service", "random"])
        random_service = choice(ALL_SUBCLASSESS)()
        service_info = (
            random_service.get_info(str(uuid4()), str(uuid4()))
            if info_type == "service"
            else get_service_info(choice(ECOMMERCE_SERVICES))
        )

        resp = {
            "status": 200,
            "headers": [JSON_HEADER],
            "body": json.dumps(service_info[2]),
        }
        return {
            "request": {
                "url": {
                    "host": "test-ecommerce.metlo.com",
                    "path": service_info[0],
                    "parameters": [],
                },
                "headers": [get_auth_header()],
                "method": choice(service_info[1]),
            },
            "response": resp,
            "meta": get_meta(sources, destinations),
        }
