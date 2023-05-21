from datetime import datetime, timedelta
from typing import List
from uuid import uuid4
import json
from random import choice

from producers.ecommerce.utils import sources, destinations
from producers.utils import get_auth_header, get_meta, JSON_HEADER
from producers.base import BaseProducer


def get_service_info():
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
        ["/webhook", "POST"],
        ["/callback", "POST"],
        ["/checkout", "POST"],
        ["/return", "POST"],
        ["/verify", "POST"],
        ["/create-invoice", "POST"],
        ["/pay-invoice", "POST"],
        ["/recurring-billing", "POST"],
        ["/reports", "GET"],
        ["/balance", "GET"],
        ["/settings", "GET"],
        ["/cards", "GET"],
        ["/accounts", "GET"],
        ["/users", "GET"],
        ["/transactions", "GET"],
        ["/process-order", "POST"],
        ["/order-history", "GET"],
        ["/payment-plans", "GET"],
        ["/discounts", "GET"],
        ["/tax", "GET"],
        ["/shipping", "GET"],
        ["/subscriptions", "GET"],
        ["/checkout-settings", "GET"],
        ["/checkout-callback", "POST"],
        ["/checkout-webhook", "POST"],
        ["/customer", "GET"],
        ["/address", "GET"],
        ["/checkout-success", "POST"],
        ["/checkout-failure", "POST"],
        ["/checkout-cancel", "POST"],
        ["/capture-authorization", "POST"],
        ["/update-authorization", "PUT"],
        ["/authorize-callback", "POST"],
        ["/refund-callback", "POST"],
        ["/billing", "GET"],
        ["/add-card", "POST"],
        ["/remove-card", "DELETE"],
        ["/update-card", "PUT"],
        ["/card-details", "GET"],
        ["/transaction-details", "GET"],
        ["/order-details", "GET"],
        ["/invoice-details", "GET"],
        ["/subscription-details", "GET"],
        ["/add-account", "POST"],
        ["/remove-account", "DELETE"],
        ["/update-account", "PUT"],
        ["/account-details", "GET"],
        ["/user-details", "GET"],
        ["/customer-details", "GET"],
        ["/add-user", "POST"],
        ["/remove-user", "DELETE"],
        ["/update-user", "PUT"],
        ["/user-access", "GET"],
        ["/payment-methods", "GET"],
        ["/add-payment-method", "POST"],
        ["/remove-payment-method", "DELETE"],
        ["/update-payment-method", "PUT"],
        ["/payment-method-details", "GET"],
        ["/add-discount", "POST"],
        ["/remove-discount", "DELETE"],
        ["/update-discount", "PUT"],
        ["/discount-details", "GET"],
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
    ]
    return choice(endpoint_paths)


class PaymentProcessorServices(BaseProducer):
    emit_probability = 0.8

    def get_data_point(self) -> dict:
        service_info = get_service_info()
        resp = {
            "status": 200,
            "headers": [JSON_HEADER],
            "body": json.dumps(
                {
                    "ok": True,
                }
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
                "method": service_info[1],
            },
            "response": resp,
            "meta": get_meta(sources, destinations),
        }
