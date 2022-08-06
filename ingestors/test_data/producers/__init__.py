from producers.ecommerce_make_cart import EcommerceMakeCartProducer
from producers.ecommerce_add_product_to_cart import EcommerceAddProductToCartProducer


PRODUCER_CLS_MAP = {
    "ecommerce_add_product_to_cart": EcommerceAddProductToCartProducer,
    "ecommerce_make_cart": EcommerceMakeCartProducer,
}