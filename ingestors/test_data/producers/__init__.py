from producers.ecommerce.get_cart import EcommerceGetCartProducer
from producers.ecommerce.get_product import EcommerceGetProductProducer
from producers.ecommerce.login import EcommerceLoginProducer
from producers.ecommerce.make_purchase import EcommerceMakePurchaseProducer
from producers.ecommerce.new_product import EcommerceMakeProductProducer
from producers.ecommerce.new_cart import EcommerceMakeCartProducer
from producers.ecommerce.add_product_to_cart import EcommerceAddProductToCartProducer
from producers.ecommerce.edit_product import EcommerceEditProductProducer
from producers.ecommerce.edit_product_price import EcommerceEditProductPriceProducer
from producers.ecommerce.register import EcommerceRegisterProducer
from producers.ecommerce.edit_admin_config import EcommerceEditAdminConfigProducer
from producers.ecommerce.get_admin_config import EcommerceGetAdminConfigProducer
from producers.paymentprocessor.add_billing import PaymentProcessorAddBillingProducer
from producers.paymentprocessor.get_billing import PaymentProcessorGetBillingProducer
from producers.paymentprocessor.add_charge import PaymentProcessorAddChargeProducer
from producers.paymentprocessor.get_user import PaymentProcessorGetUserProducer
from producers.paymentprocessor.new_user import PaymentProcessorUserProducer
from producers.paymentprocessor.user_verify import PaymentProcessorUserVerifyProducer
from producers.user.get_user import UserServiceGetUserProducer
from producers.course.query import CourseServiceQuery
from producers.course.mutation import CourseServiceMutation
from producers.course.subscription import CourseServiceSubscription
from producers.course.query_get import CourseServiceGetQuery
from producers.ecommerce.get_cart_command_exec import EcommerceGetCartCommandExecProducer
from producers.ecommerce.get_product_ssrf import EcommerceGetProductSSRFProducer
from producers.ecommerce.get_product_xss import EcommerceGetProductXSSProducer
from producers.ecommerce.login_sqli import EcommerceLoginSQLIProducer
from producers.course.query_introspection import CourseServiceQueryIntrospection
from producers.ecommerce.ecommerce_services import EcommerceServicesProducer
from producers.paymentprocessor.payment_services import PaymentProcessorServices
from producers.ecommerce.get_product_ssrf_user import EcommerceGetProductSSRFUserProducer
from producers.ecommerce.get_product_xss_user import EcommerceGetProductXSSUserProducer
from producers.ecommerce.get_cart_command_exec_user import EcommerceGetCartCommandExecUserProducer


PRODUCER_CLS_MAP = {
    "ecommerce_add_product_to_cart": EcommerceAddProductToCartProducer,
    "ecommerce_make_cart": EcommerceMakeCartProducer,
    "ecommerce_make_product": EcommerceMakeProductProducer,
    "ecommerce_edit_product": EcommerceEditProductProducer,
    "ecommerce_edit_product_price": EcommerceEditProductPriceProducer,
    "ecommerce_make_purchase": EcommerceMakePurchaseProducer,
    "ecommerce_login": EcommerceLoginProducer,
    "ecommerce_register": EcommerceRegisterProducer,
    "ecommerce_get_product": EcommerceGetProductProducer,
    "ecommerce_get_cart": EcommerceGetCartProducer,
    "ecommerce_edit_admin_config": EcommerceEditAdminConfigProducer,
    "ecommerce_get_admin_config": EcommerceGetAdminConfigProducer,
    "payment_processor_user": PaymentProcessorUserProducer,
    "payment_processor_user_verify": PaymentProcessorUserVerifyProducer,
    "payment_processor_get_user": PaymentProcessorGetUserProducer,
    "payment_processor_add_billing": PaymentProcessorAddBillingProducer,
    "payment_processor_get_billing": PaymentProcessorGetBillingProducer,
    "payment_processor_add_charge": PaymentProcessorAddChargeProducer,
    "user_service_get_user": UserServiceGetUserProducer,
    "course_service_query": CourseServiceQuery,
    "course_service_mutation": CourseServiceMutation,
    "course_service_subscription": CourseServiceSubscription,
    "course_service_get_query": CourseServiceGetQuery,
    "ecommerce_login_sqli": EcommerceLoginSQLIProducer,
    "ecommerce_get_product_xss": EcommerceGetProductXSSProducer,
    "ecommerce_get_product_ssrf": EcommerceGetProductSSRFProducer,
    "ecommerce_get_cart_command_exec": EcommerceGetCartCommandExecProducer,
    "course_service_query_introspection": CourseServiceQueryIntrospection,
    "ecommerce_services": EcommerceServicesProducer,
    "payment_processor_services": PaymentProcessorServices,
    "ecommerce_get_product_xss_user": EcommerceGetProductXSSUserProducer,
    "ecommerce_get_product_ssrf_user": EcommerceGetProductSSRFUserProducer,
    "ecommerce_get_cart_command_exec_user": EcommerceGetCartCommandExecUserProducer,
}
