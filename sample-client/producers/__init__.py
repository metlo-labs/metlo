from producers.ecommerce.get_cart import EcommerceGetCartProducer
from producers.ecommerce.get_product import EcommerceGetProductProducer
from producers.ecommerce.login import EcommerceLoginProducer
from producers.ecommerce.make_purchase import EcommerceMakePurchaseProducer
from producers.ecommerce.new_product import EcommerceMakeProductProducer
from producers.ecommerce.new_cart import EcommerceMakeCartProducer
from producers.ecommerce.add_product_to_cart import EcommerceAddProductToCartProducer
from producers.ecommerce.register import EcommerceRegisterProducer


PRODUCER_CLS_MAP = {
    "ecommerce_add_product_to_cart": EcommerceAddProductToCartProducer,
    "ecommerce_make_cart": EcommerceMakeCartProducer,
    "ecommerce_make_product": EcommerceMakeProductProducer,
    "ecommerce_make_purchase": EcommerceMakePurchaseProducer,
    "ecommerce_login": EcommerceLoginProducer,
    "ecommerce_register": EcommerceRegisterProducer,
    "ecommerce_get_product": EcommerceGetProductProducer,
    "ecommerce_get_cart": EcommerceGetCartProducer,
}