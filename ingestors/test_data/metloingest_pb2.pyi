from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Iterable as _Iterable, Mapping as _Mapping, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class ApiMeta(_message.Message):
    __slots__ = ["destination", "destination_port", "environment", "incoming", "source", "source_port"]
    DESTINATION_FIELD_NUMBER: _ClassVar[int]
    DESTINATION_PORT_FIELD_NUMBER: _ClassVar[int]
    ENVIRONMENT_FIELD_NUMBER: _ClassVar[int]
    INCOMING_FIELD_NUMBER: _ClassVar[int]
    SOURCE_FIELD_NUMBER: _ClassVar[int]
    SOURCE_PORT_FIELD_NUMBER: _ClassVar[int]
    destination: str
    destination_port: int
    environment: str
    incoming: bool
    source: str
    source_port: int
    def __init__(self, environment: _Optional[str] = ..., incoming: bool = ..., source: _Optional[str] = ..., source_port: _Optional[int] = ..., destination: _Optional[str] = ..., destination_port: _Optional[int] = ...) -> None: ...

class ApiRequest(_message.Message):
    __slots__ = ["body", "headers", "method", "url", "user"]
    BODY_FIELD_NUMBER: _ClassVar[int]
    HEADERS_FIELD_NUMBER: _ClassVar[int]
    METHOD_FIELD_NUMBER: _ClassVar[int]
    URL_FIELD_NUMBER: _ClassVar[int]
    USER_FIELD_NUMBER: _ClassVar[int]
    body: str
    headers: _containers.RepeatedCompositeFieldContainer[KeyVal]
    method: str
    url: ApiUrl
    user: str
    def __init__(self, method: _Optional[str] = ..., url: _Optional[_Union[ApiUrl, _Mapping]] = ..., headers: _Optional[_Iterable[_Union[KeyVal, _Mapping]]] = ..., body: _Optional[str] = ..., user: _Optional[str] = ...) -> None: ...

class ApiResponse(_message.Message):
    __slots__ = ["body", "headers", "status"]
    BODY_FIELD_NUMBER: _ClassVar[int]
    HEADERS_FIELD_NUMBER: _ClassVar[int]
    STATUS_FIELD_NUMBER: _ClassVar[int]
    body: str
    headers: _containers.RepeatedCompositeFieldContainer[KeyVal]
    status: int
    def __init__(self, status: _Optional[int] = ..., headers: _Optional[_Iterable[_Union[KeyVal, _Mapping]]] = ..., body: _Optional[str] = ...) -> None: ...

class ApiTrace(_message.Message):
    __slots__ = ["meta", "request", "response"]
    META_FIELD_NUMBER: _ClassVar[int]
    REQUEST_FIELD_NUMBER: _ClassVar[int]
    RESPONSE_FIELD_NUMBER: _ClassVar[int]
    meta: ApiMeta
    request: ApiRequest
    response: ApiResponse
    def __init__(self, request: _Optional[_Union[ApiRequest, _Mapping]] = ..., response: _Optional[_Union[ApiResponse, _Mapping]] = ..., meta: _Optional[_Union[ApiMeta, _Mapping]] = ...) -> None: ...

class ApiUrl(_message.Message):
    __slots__ = ["host", "parameters", "path"]
    HOST_FIELD_NUMBER: _ClassVar[int]
    PARAMETERS_FIELD_NUMBER: _ClassVar[int]
    PATH_FIELD_NUMBER: _ClassVar[int]
    host: str
    parameters: _containers.RepeatedCompositeFieldContainer[KeyVal]
    path: str
    def __init__(self, host: _Optional[str] = ..., path: _Optional[str] = ..., parameters: _Optional[_Iterable[_Union[KeyVal, _Mapping]]] = ...) -> None: ...

class KeyVal(_message.Message):
    __slots__ = ["name", "value"]
    NAME_FIELD_NUMBER: _ClassVar[int]
    VALUE_FIELD_NUMBER: _ClassVar[int]
    name: str
    value: str
    def __init__(self, name: _Optional[str] = ..., value: _Optional[str] = ...) -> None: ...

class ProcessTraceAsyncRes(_message.Message):
    __slots__ = ["ok"]
    OK_FIELD_NUMBER: _ClassVar[int]
    ok: bool
    def __init__(self, ok: bool = ...) -> None: ...

class ProcessTraceRes(_message.Message):
    __slots__ = ["attack_detections", "block", "data_types", "request_content_type", "response_content_type", "sensitive_data_detected"]
    class AttackDetectionsEntry(_message.Message):
        __slots__ = ["key", "value"]
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: RepeatedString
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[RepeatedString, _Mapping]] = ...) -> None: ...
    class DataTypesEntry(_message.Message):
        __slots__ = ["key", "value"]
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: RepeatedString
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[RepeatedString, _Mapping]] = ...) -> None: ...
    class SensitiveDataDetectedEntry(_message.Message):
        __slots__ = ["key", "value"]
        KEY_FIELD_NUMBER: _ClassVar[int]
        VALUE_FIELD_NUMBER: _ClassVar[int]
        key: str
        value: RepeatedString
        def __init__(self, key: _Optional[str] = ..., value: _Optional[_Union[RepeatedString, _Mapping]] = ...) -> None: ...
    ATTACK_DETECTIONS_FIELD_NUMBER: _ClassVar[int]
    BLOCK_FIELD_NUMBER: _ClassVar[int]
    DATA_TYPES_FIELD_NUMBER: _ClassVar[int]
    REQUEST_CONTENT_TYPE_FIELD_NUMBER: _ClassVar[int]
    RESPONSE_CONTENT_TYPE_FIELD_NUMBER: _ClassVar[int]
    SENSITIVE_DATA_DETECTED_FIELD_NUMBER: _ClassVar[int]
    attack_detections: _containers.MessageMap[str, RepeatedString]
    block: bool
    data_types: _containers.MessageMap[str, RepeatedString]
    request_content_type: str
    response_content_type: str
    sensitive_data_detected: _containers.MessageMap[str, RepeatedString]
    def __init__(self, block: bool = ..., attack_detections: _Optional[_Mapping[str, RepeatedString]] = ..., sensitive_data_detected: _Optional[_Mapping[str, RepeatedString]] = ..., data_types: _Optional[_Mapping[str, RepeatedString]] = ..., request_content_type: _Optional[str] = ..., response_content_type: _Optional[str] = ...) -> None: ...

class RepeatedString(_message.Message):
    __slots__ = ["rep_string"]
    REP_STRING_FIELD_NUMBER: _ClassVar[int]
    rep_string: _containers.RepeatedScalarFieldContainer[str]
    def __init__(self, rep_string: _Optional[_Iterable[str]] = ...) -> None: ...
