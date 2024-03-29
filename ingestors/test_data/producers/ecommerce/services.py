from random import choice, randint
from faker import Faker

from producers.ecommerce.utils import get_product


ALL_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"]


class BaseService:
    def __init__(self):
        self.fake = Faker()
        self.resp = {"ok": True}

    def get_info(self, id: str, id_2: str):
        return choice([])


class ProductService(BaseService):
    def get_info(self, id: str, id_2: str):
        review_resp = {
            "ok": True,
            "review_id": id_2,
            "product_id": id,
            "rating": randint(0, 100),
            "title": self.fake.word(),
            "description": self.fake.sentence(),
        }
        category_resp = {
            "ok": True,
            "category_id": id,
            "tag": self.fake.word(),
            "description": self.fake.sentence(),
        }
        paths = [
            [f"/products", ["GET"], self.resp],
            [f"/products/{id}", ALL_METHODS, self.resp],
            [f"/products/{id}/reviews", ["GET"], [review_resp]],
            [f"/products/{id}/add-to-cart", ["POST", "PUT", "PATCH"], self.resp],
            [f"/products/{id}/remove-from-cart", ["DELETE", "PATCH", "PUT"], self.resp],
            [f"/products/categories", ["GET"], [category_resp]],
            [f"/products/categories/{id}", ALL_METHODS, category_resp],
            [f"/products/brands", ["GET"], self.resp],
            [f"/products/brands/{id}", ALL_METHODS, self.resp],
            [f"/products/search", ["GET"], self.resp],
            [f"/product/reviews", ["GET"], [review_resp]],
            [f"/product/{id}/reviews/{id_2}", ALL_METHODS, review_resp],
        ]
        return choice(paths)


class CartService(BaseService):
    def get_info(self, id: str, id_2: str):
        paths = [
            ["/cart/add-item", ["POST", "PUT"], self.resp],
            ["/cart/remove-item", ["DELETE"], self.resp],
            ["/cart/update-item", ["PUT", "PATCH"], self.resp],
            ["/cart/clear", ["PUT", "DELETE"], self.resp],
            ["/cart/checkout", ["POST"], self.resp],
        ]
        return choice(paths)


class CategoryService(BaseService):
    def get_info(self, id: str, id_2: str):
        category_resp = {
            "ok": True,
            "category_id": id,
            "tag": self.fake.word(),
            "description": self.fake.sentence(),
        }
        product_resp = {
            **get_product(self.fake, id_2),
        }
        paths = [
            [f"/categories", ["GET"], [category_resp]],
            [f"/categories/{id}", ALL_METHODS, category_resp],
            [f"/categories/{id}/products", ["GET"], self.resp],
            [f"/categories/{id}/products/{id_2}", ALL_METHODS, product_resp],
        ]
        return choice(paths)


class InvoiceService(BaseService):
    def get_info(self, id: str, id_2: str):
        paths = [
            ["/invoices", ["GET"], self.resp],
            [f"/invoices/{id}", ALL_METHODS, self.resp],
        ]
        return choice(paths)


class SubscriptionService(BaseService):
    def get_info(self, id: str, id_2: str):
        paths = [
            ["/subscriptions", ["GET"], self.resp],
            [f"/subscriptions/{id}", ALL_METHODS, self.resp],
        ]
        return choice(paths)


class UserService(BaseService):
    def get_info(self, id: str, id_2: str):
        paths = [
            [f"/users", ["GET"], self.resp],
            [f"/users/{id}", ALL_METHODS, self.resp],
            [f"/users/{id}/orders", ["GET"], self.resp],
            [f"/users/{id}/orders/{id_2}", ALL_METHODS, self.resp],
            [f"/users/{id}/cart", ["GET"], self.resp],
            [f"/users/{id}/cart/{id_2}", ALL_METHODS, self.resp],
            [f"/users/{id}/profile", ["GET", "PUT", "PATCH"], self.resp],
            [f"/users/{id}/settings", ["GET", "PUT", "PATCH"], self.resp],
        ]
        return choice(paths)


class AdminService(BaseService):
    def get_info(self, id: str, id_2: str):
        paths = [
            [f"/admin/dashboard", ["GET"], self.resp],
            [f"/admin/users", ["GET"], self.resp],
            [f"/admin/users/{id}", ALL_METHODS, self.resp],
            [f"/admin/products", ["GET"], self.resp],
            [f"/admin/products/{id}", ALL_METHODS, self.resp],
            [f"/admin/categories", ["GET"], self.resp],
            [f"/admin/categories/{id}", ALL_METHODS, self.resp],
            [f"/admin/orders", ["GET"], self.resp],
            [f"/admin/orders/{id}", ALL_METHODS, self.resp],
            [f"/admin/invoices", ["GET"], self.resp],
            [f"/admin/invoices/{id}", ALL_METHODS, self.resp],
            [f"/admin/subscriptions", ["GET"], self.resp],
            [f"/admin/subscriptions/{id}", ALL_METHODS, self.resp],
            [f"/admin/reports", ["GET"], self.resp],
            [f"/admin/reports/{id}", ALL_METHODS, self.resp],
        ]
        return choice(paths)


class WishListService(BaseService):
    def get_info(self, id: str, id_2: str):
        product_resp = {
            **get_product(self.fake, id_2),
        }
        paths = [
            [f"/wish-list", ["GET"], self.resp],
            [f"/wish-list/{id}", ALL_METHODS, self.resp],
            [f"/wish-list/{id}/products", ["GET"], [product_resp]],
            [f"/wish-list/{id}/products/{id_2}", ALL_METHODS, product_resp],
        ]
        return choice(paths)


class ReviewService(BaseService):
    def get_info(self, id: str, id_2: str):
        review_resp = {
            "ok": True,
            "review_id": id,
            "rating": randint(0, 100),
            "title": self.fake.word(),
            "description": self.fake.sentence(),
        }
        comment_resp = {
            "ok": True,
            "comment_id": id_2,
            "upvotes": randint(0, 100),
            "downvotes": randint(0, 100),
            "title": self.fake.word(),
            "message": self.fake.sentence(),
        }
        paths = [
            [f"/reviews", ["GET"], [review_resp]],
            [f"/reviews/{id}", ALL_METHODS, review_resp],
            [f"/reviews/{id}/comments", ["GET"], [comment_resp]],
            [f"/reviews/{id}/comments/{id_2}", ALL_METHODS, comment_resp],
            [f"/reviews/{id}/helpful", ["GET"], self.resp],
            [f"/reviews/{id}/helpful/{id_2}", ALL_METHODS, self.resp],
            [f"/reviews/{id}/reported", ["GET"], self.resp],
            [f"/reviews/{id}/reported/{id_2}", ALL_METHODS, self.resp],
        ]
        return choice(paths)


class RecommendationService(BaseService):
    def get_info(self, id: str, id_2: str):
        product_resp = {
            **get_product(self.fake, id_2),
        }
        paths = [
            [f"/recommendations", ["GET"], self.resp],
            [f"/recommendations/{id}", ALL_METHODS, self.resp],
            [f"/recommendations/{id}/products", ["GET"], [product_resp]],
            [f"/recommendations/{id}/products/{id_2}", ALL_METHODS, product_resp],
        ]
        return choice(paths)


class DealService(BaseService):
    def get_info(self, id: str, id_2: str):
        paths = [
            [f"/deals", ["GET"], self.resp],
            [f"/deals/{id}", ALL_METHODS, self.resp],
            [f"/deals/{id}/products", ["GET"], self.resp],
            [f"/deals/{id}/products/{id_2}", ALL_METHODS, self.resp],
        ]
        return choice(paths)


class ShippingService(BaseService):
    def get_info(self, id: str, id_2: str):
        paths = [
            [f"/shipping", ["GET"], self.resp],
            [f"/shipping/{id}", ALL_METHODS, self.resp],
            [f"/shipping/{id}/rates", ["GET"], self.resp],
            [f"/shipping/{id}/rates/{id_2}", ALL_METHODS, self.resp],
        ]
        return choice(paths)


class CouponService(BaseService):
    def get_info(self, id: str, id_2: str):
        paths = [
            [f"/coupons", ["GET"], self.resp],
            [f"/coupons/{id}", ALL_METHODS, self.resp],
            [f"/coupons/{id}/products", ["GET"], self.resp],
            [f"/coupons/{id}/products/{id_2}", ALL_METHODS, self.resp],
        ]
        return choice(paths)


class ReturnsService(BaseService):
    def get_info(self, id: str, id_2: str):
        paths = [
            [f"/returns", ["GET"], self.resp],
            [f"/returns/{id}", ALL_METHODS, self.resp],
            [f"/returns/{id}/items", ["GET"], self.resp],
            [f"/returns/{id}/items/{id_2}", ALL_METHODS, self.resp],
        ]
        return choice(paths)


class SupportService(BaseService):
    def get_info(self, id: str, id_2: str):
        paths = [
            [f"/support", ["GET"], self.resp],
            [f"/support/{id}", ALL_METHODS, self.resp],
            [f"/support/{id}/messages", ["GET"], self.resp],
            [f"/support/{id}/messages/{id_2}", ALL_METHODS, self.resp],
        ]
        return choice(paths)


class AnalyticsService(BaseService):
    def get_info(self, id: str, id_2: str):
        paths = [
            [f"/analytics", ["GET"], self.resp],
            [f"/analytics/{id}", ALL_METHODS, self.resp],
            [f"/analytics/{id}/data", ["GET"], self.resp],
            [f"/analytics/{id}/data/{id_2}", ALL_METHODS, self.resp],
            [f"/analytics/{id}/reports", ["GET"], self.resp],
            [f"/analytics/{id}/reports/{id_2}", ALL_METHODS, self.resp],
        ]
        return choice(paths)


class SettingsService(BaseService):
    def get_info(self, id: str, id_2: str):
        paths = [
            ["/settings", ["GET"], self.resp],
            ["/settings/profile", ["GET"], self.resp],
            ["/settings/security", ["GET"], self.resp],
            ["/settings/preferences", ["GET"], self.resp],
            ["/settings/notifications", ["GET"], self.resp],
            ["/settings/orders", ["GET"], self.resp],
            ["/settings/payments", ["GET"], self.resp],
            ["/settings/shipping", ["GET"], self.resp],
            ["/settings/addresses", ["GET"], self.resp],
            ["/settings/account", ["GET"], self.resp],
        ]
        return choice(paths)


class CustomerService(BaseService):
    def get_info(self, id: str, id_2: str):
        review_resp = {
            "ok": True,
            "review_id": id_2,
            "rating": randint(0, 100),
            "title": self.fake.word(),
            "description": self.fake.sentence(),
        }
        paths = [
            ["/customers", ["GET"], self.resp],
            [f"/customers/{id}", ALL_METHODS, self.resp],
            [f"/customers/{id}/orders", ["GET"], self.resp],
            [f"/customers/{id}/addresses", ["GET"], self.resp],
            [f"/customers/{id}/addresses/{id_2}", ALL_METHODS, self.resp],
            [f"/customers/{id}/payment-methods", ["GET"], self.resp],
            [f"/customers/{id}/payment-methods/{id_2}", ALL_METHODS, self.resp],
            [f"/customers/{id}/wish-list", ["GET"], self.resp],
            [f"/customers/{id}/wish-list/add", ["POST"], self.resp],
            [f"/customers/{id}/wish-list/remove", ["DELETE"], self.resp],
            [f"/customers/{id}/reviews", ["GET"], [review_resp]],
            [f"/customers/{id}/reviews/{id_2}", ALL_METHODS, review_resp],
        ]
        return choice(paths)


ALL_SUBCLASSESS = [subclass for subclass in BaseService.__subclasses__()]
