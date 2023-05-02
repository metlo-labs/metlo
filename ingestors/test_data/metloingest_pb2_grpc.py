# Generated by the gRPC Python protocol compiler plugin. DO NOT EDIT!
"""Client and server classes corresponding to protobuf-defined services."""
import grpc

import metloingest_pb2 as metloingest__pb2


class MetloIngestStub(object):
    """Missing associated documentation comment in .proto file."""

    def __init__(self, channel):
        """Constructor.

        Args:
            channel: A grpc.Channel.
        """
        self.ProcessTrace = channel.unary_unary(
                '/metloingest.MetloIngest/ProcessTrace',
                request_serializer=metloingest__pb2.ApiTrace.SerializeToString,
                response_deserializer=metloingest__pb2.ProcessTraceRes.FromString,
                )
        self.ProcessTraceAsync = channel.stream_unary(
                '/metloingest.MetloIngest/ProcessTraceAsync',
                request_serializer=metloingest__pb2.ApiTrace.SerializeToString,
                response_deserializer=metloingest__pb2.ProcessTraceAsyncRes.FromString,
                )


class MetloIngestServicer(object):
    """Missing associated documentation comment in .proto file."""

    def ProcessTrace(self, request, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')

    def ProcessTraceAsync(self, request_iterator, context):
        """Missing associated documentation comment in .proto file."""
        context.set_code(grpc.StatusCode.UNIMPLEMENTED)
        context.set_details('Method not implemented!')
        raise NotImplementedError('Method not implemented!')


def add_MetloIngestServicer_to_server(servicer, server):
    rpc_method_handlers = {
            'ProcessTrace': grpc.unary_unary_rpc_method_handler(
                    servicer.ProcessTrace,
                    request_deserializer=metloingest__pb2.ApiTrace.FromString,
                    response_serializer=metloingest__pb2.ProcessTraceRes.SerializeToString,
            ),
            'ProcessTraceAsync': grpc.stream_unary_rpc_method_handler(
                    servicer.ProcessTraceAsync,
                    request_deserializer=metloingest__pb2.ApiTrace.FromString,
                    response_serializer=metloingest__pb2.ProcessTraceAsyncRes.SerializeToString,
            ),
    }
    generic_handler = grpc.method_handlers_generic_handler(
            'metloingest.MetloIngest', rpc_method_handlers)
    server.add_generic_rpc_handlers((generic_handler,))


 # This class is part of an EXPERIMENTAL API.
class MetloIngest(object):
    """Missing associated documentation comment in .proto file."""

    @staticmethod
    def ProcessTrace(request,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.unary_unary(request, target, '/metloingest.MetloIngest/ProcessTrace',
            metloingest__pb2.ApiTrace.SerializeToString,
            metloingest__pb2.ProcessTraceRes.FromString,
            options, channel_credentials,
            insecure, call_credentials, compression, wait_for_ready, timeout, metadata)

    @staticmethod
    def ProcessTraceAsync(request_iterator,
            target,
            options=(),
            channel_credentials=None,
            call_credentials=None,
            insecure=False,
            compression=None,
            wait_for_ready=None,
            timeout=None,
            metadata=None):
        return grpc.experimental.stream_unary(request_iterator, target, '/metloingest.MetloIngest/ProcessTraceAsync',
            metloingest__pb2.ApiTrace.SerializeToString,
            metloingest__pb2.ProcessTraceAsyncRes.FromString,
            options, channel_credentials,
            insecure, call_credentials, compression, wait_for_ready, timeout, metadata)