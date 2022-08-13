from .ecommerce_make_purchase import EcommerceMakePurchaseProducer
from .ecommerce_make_product import EcommerceMakeProductProducer
from producers.ecommerce_make_cart import EcommerceMakeCartProducer
from producers.ecommerce_add_product_to_cart import EcommerceAddProductToCartProducer


PRODUCER_CLS_MAP = {
    "ecommerce_add_product_to_cart": EcommerceAddProductToCartProducer,
    "ecommerce_make_cart": EcommerceMakeCartProducer,
    "ecommerce_make_product": EcommerceMakeProductProducer,
    "ecommerce_make_purchase": EcommerceMakePurchaseProducer,
}