from random import choice

ALL_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"]


class BaseService:
    def __init__(self):
        self.resp = {"ok": True}

    def get_info(self, id: str, id_2: str):
        return choice([])


class ProductService(BaseService):
    def get_info(self, id: str, id_2: str):
        paths = [
            [f"/products", ["GET", "DELETE"], self.resp],
            [f"/products/{id}", ALL_METHODS, self.resp],
            [f"/products/{id}/reviews", ALL_METHODS, self.resp],
            [f"/products/{id}/add-to-cart", ["POST", "PUT", "PATCH"], self.resp],
            [f"/products/{id}/remove-from-cart", ["DELETE", "PATCH"], self.resp],
            [f"/products/categories", ["GET", "DELETE"], self.resp],
            [f"/products/categories/{id}", ALL_METHODS, self.resp],
            [f"/products/brands", ["GET", "DELETE"], self.resp],
            [f"/products/brands/{id}", ALL_METHODS, self.resp],
            [f"/products/search", ["GET", "DELETE"], self.resp],
            [f"/product/reviews", ["GET", "DELETE"], self.resp],
            [f"/product/{id}/reviews/{id_2}", ALL_METHODS, self.resp],
        ]
        return choice(paths)


class CartService(BaseService):
    def get_info(self, id: str, id_2: str):
        paths = [
            ["/cart/add-item", ["POST", "PUT"], self.resp],
            ["/cart/remove-item", ["DELETE", "PUT", "PATCH"], self.resp],
            ["/cart/update-item", ["DELETE", "PUT", "PATCH"], self.resp],
            ["/cart/clear", ["PUT", "PATCH", "DELETE"], self.resp],
            ["/cart/checkout", ["PUT", "PATCH"], self.resp],
        ]
        return choice(paths)


class CategoryService(BaseService):
    def get_info(self, id: str, id_2: str):
        paths = [
            [f"/categories", ["GET"], self.resp],
            [f"/categories/{id}", ALL_METHODS, self.resp],
            [f"/categories/{id}/products", ALL_METHODS, self.resp],
            [f"/categories/{id}/products/{id_2}", ALL_METHODS, self.resp],
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
        paths = [
            [f"/wish-list", ["GET"], self.resp],
            [f"/wish-list/{id}", ALL_METHODS, self.resp],
            [f"/wish-list/{id}/products", ["GET"], self.resp],
            [f"/wish-list/{id}/products/{id_2}", ALL_METHODS, self.resp],
        ]
        return choice(paths)


class ReviewService(BaseService):
    def get_info(self, id: str, id_2: str):
        paths = [
            [f"/reviews", ["GET"], self.resp],
            [f"/reviews/{id}", ALL_METHODS, self.resp],
            [f"/reviews/{id}/comments", ["GET"], self.resp],
            [f"/reviews/{id}/comments/{id_2}", ALL_METHODS, self.resp],
            [f"/reviews/{id}/helpful", ["GET"], self.resp],
            [f"/reviews/{id}/helpful/{id_2}", ALL_METHODS, self.resp],
            [f"/reviews/{id}/reported", ["GET"], self.resp],
            [f"/reviews/{id}/reported/{id_2}", ALL_METHODS, self.resp],
        ]
        return choice(paths)


class RecommendationService(BaseService):
    def get_info(self, id: str, id_2: str):
        paths = [
            [f"/recommendations", ["GET"], self.resp],
            [f"/recommendations/{id}", ALL_METHODS, self.resp],
            [f"/recommendations/{id}/products", ["GET"], self.resp],
            [f"/recommendations/{id}/products/{id_2}", ALL_METHODS, self.resp],
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
        paths = [
            ["/customers", ["GET"], self.resp],
            [f"/customers/{id}", ALL_METHODS, self.resp],
            [f"/customers/{id}/orders", ["GET"], self.resp],
            [f"/customers/{id}/addresses", ["GET"], self.resp],
            [f"/customers/{id}/addresses/{id_2}", ALL_METHODS, self.resp],
            [f"/customers/{id}/payment-methods", ["GET"], self.resp],
            [f"/customers/{id}/payment-methods/{id_2}", ALL_METHODS, self.resp],
            [f"/customers/{id}/wish-list", ["GET"], self.resp],
            [f"/customers/{id}/wishlist/add", ["POST"], self.resp],
            [f"/customers/{id}/wishlist/remove", ["DELETE"], self.resp],
            [f"/customers/{id}/reviews", ["GET"], self.resp],
            [f"/customers/{id}/reviews/{id_2}", ALL_METHODS, self.resp],
        ]
        return choice(paths)


ALL_SUBCLASSESS = [subclass for subclass in BaseService.__subclasses__()]
