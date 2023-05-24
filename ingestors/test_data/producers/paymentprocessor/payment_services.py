from uuid import uuid4
import json
from random import choice

from producers.ecommerce.utils import sources, destinations
from producers.utils import get_auth_header, get_meta, JSON_HEADER
from producers.base import BaseProducer


PATH_EXTENSION_SINGLE = [
    {"path": "delete", "method": ["DELETE"]},
    {"path": "update", "method": ["PUT", "PATCH"]},
]

BASE_RESP = {"ok": True}

PAYMENT_SERVICES = [
    {"path": "/checkout", "resp": BASE_RESP},
    {"path": "/subscription", "resp": BASE_RESP},
    {"path": "/promotion", "resp": BASE_RESP},
    {"path": "/invoice", "resp": BASE_RESP},
    {"path": "/notification", "resp": BASE_RESP},
    {"path": "/report", "resp": BASE_RESP},
    {"path": "/user", "resp": BASE_RESP},
    {"path": "/transaction", "resp": BASE_RESP},
    {"path": "/card", "resp": BASE_RESP},
    {"path": "/account", "resp": BASE_RESP},
    {"path": "/webhook", "resp": BASE_RESP},
    {"path": "/discount", "resp": BASE_RESP},
    {"path": "/address", "resp": BASE_RESP},
    {"path": "/payment-method", "resp": BASE_RESP},
    {"path": "/order", "resp": BASE_RESP},
    {"path": "/shipment", "resp": BASE_RESP},
    {"path": "/wallet", "resp": BASE_RESP},
    {"path": "/statement", "resp": BASE_RESP},
    {"path": "/customer", "resp": BASE_RESP},
    {"path": "/receipt", "resp": BASE_RESP},
    {"path": "/payment", "resp": BASE_RESP},
    {"path": "/merchat", "resp": BASE_RESP},
    {"path": "/bank", "resp": BASE_RESP},
    {"path": "/coupon", "resp": BASE_RESP},
    {"path": "/plan", "resp": BASE_RESP},
    {"path": "/dispute", "resp": BASE_RESP},
    {"path": "/refund", "resp": BASE_RESP},
    {"path": "/transfer", "resp": BASE_RESP},
    {"path": "/billing", "resp": BASE_RESP},
    {"path": "/balance", "resp": BASE_RESP},
    {"path": "/log", "resp": BASE_RESP},
    {"path": "/buyer", "resp": BASE_RESP},
    {"path": "/seller", "resp": BASE_RESP},
    {"path": "/qr_code", "resp": BASE_RESP},
    {"path": "/payment-gateway", "resp": BASE_RESP},
    {"path": "/payment-schedule", "resp": BASE_RESP},
    {"path": "/payment-history", "resp": BASE_RESP},
    {"path": "/bank-account", "resp": BASE_RESP},
    {"path": "/payment-token", "resp": BASE_RESP},
    {"path": "/reminder", "resp": BASE_RESP},
]


def get_service_info_single():
    endpoint_paths = [
        ["/process", "POST"],
        ["/authorize", "POST"],
        ["/capture", "POST"],
        ["/void", "POST"],
        ["/refund", "POST"],
        ["/subscribe", "POST"],
        ["/unsubscribe", "POST"],
        ["/confirm", "POST"],
        ["/retrieve", "GET"],
        ["/update", "PUT"],
        ["/cancel", "POST"],
        ["/history", "GET"],
        ["/notifications", "GET"],
        ["/callback", "POST"],
        ["/checkout", "POST"],
        ["/return", "POST"],
        ["/verify", "POST"],
        ["/create-invoice", "POST"],
        ["/pay-invoice", "POST"],
        ["/recurring-billing", "POST"],
        ["/balance", "GET"],
        ["/settings", "GET"],
        ["/transactions", "GET"],
        ["/process-order", "POST"],
        ["/order-history", "GET"],
        ["/tax", "GET"],
        ["/shipping", "GET"],
        ["/checkout-settings", "GET"],
        ["/checkout-callback", "POST"],
        ["/checkout-webhook", "POST"],
        ["/checkout-success", "POST"],
        ["/checkout-failure", "POST"],
        ["/checkout-cancel", "POST"],
        ["/capture-authorization", "POST"],
        ["/update-authorization", "PUT"],
        ["/authorize-callback", "POST"],
        ["/refund-callback", "POST"],
        ["/billing", "GET"],
        ["/user-access", "GET"],
        ["/add-tax", "POST"],
        ["/remove-tax", "DELETE"],
        ["/update-tax", "PUT"],
        ["/tax-details", "GET"],
        ["/add-shipping", "POST"],
        ["/remove-shipping", "DELETE"],
        ["/update-shipping", "PUT"],
        ["/shipping-details", "GET"],
        ["/checkout-summary", "GET"],
        ["/transaction-summary", "GET"],
        ["/order-summary", "GET"],
        ["/invoice-summary", "GET"],
        ["/subscription-summary", "GET"],
        ["/billing-summary", "GET"],
        ["/payment-plan-summary", "GET"],
        ["/discount-summary", "GET"],
        ["/tax-summary", "GET"],
        ["/shipping-summary", "GET"],
        ["/retrieve-checkout", "GET"],
        ["/retrieve-transaction", "GET"],
        ["/retrieve-order", "GET"],
        ["/retrieve-invoice", "GET"],
        ["/retrieve-subscription", "GET"],
        ["/retrieve-billing", "GET"],
        ["/retrieve-payment-plan", "GET"],
        ["/retrieve-discount", "GET"],
        ["/retrieve-tax", "GET"],
        ["/retrieve-shipping", "GET"],
        ["/generate_qr", "POST"],
        ["/scan_qr", "POST"],
        ["/create-account", "POST"],
        ["/update-account", "PUT"],
        ["/close-account", "DELETE"],
        ["/enable-account", "PUT"],
        ["/disable-account", "PUT"],
        ["/activate-account", "PUT"],
        ["/deactivate-account", "PUT"],
        ["/upgrade-account", "PUT"],
        ["/downgrade-account", "PUT"],
        ["/add-user", "POST"],
        ["/remove-user", "POST"],
        ["/update-user", "PUT"],
        ["/reset-password", "PUT"],
        ["/change-password", "PUT"],
        ["/confirm-email", "PUT"],
        ["/update-email", "PUT"],
        ["/send-email", "POST"],
        ["/receive-email", "POST"],
        ["/block-email", "POST"],
        ["/unblock-email", "POST"],
        ["/search", "GET"],
        ["/filter", "POST"],
        ["/sort", "POST"],
        ["/payment-status", "GET"],
    ]
    return choice(endpoint_paths)


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


class PaymentProcessorServices(BaseProducer):
    emit_probability = 0.1

    def get_data_point(self) -> dict:
        service = choice(PAYMENT_SERVICES)
        info_type = choice(["single", "multi"])
        service_info = (
            get_service_info(service)
            if info_type == "multi"
            else get_service_info_single()
        )
        resp = {
            "status": 200,
            "headers": [JSON_HEADER],
            "body": json.dumps(
                service_info[2] if len(service_info) == 3 else {"ok": True}
            ),
        }
        return {
            "request": {
                "url": {
                    "host": "test-payment-processor.metlo.com",
                    "path": service_info[0],
                    "parameters": [],
                },
                "headers": [get_auth_header()],
                "method": choice(service_info[1])
                if isinstance(service_info[1], list)
                else service_info[1],
            },
            "response": resp,
            "meta": get_meta(sources, destinations),
        }
