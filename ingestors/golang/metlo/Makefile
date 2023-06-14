build-proto:
	go install google.golang.org/protobuf/cmd/protoc-gen-go ;\
	go install google.golang.org/grpc/cmd/protoc-gen-go-grpc ;\
	export PATH="$$PATH:$$(go env GOPATH)/bin" ;\
	mkdir -p proto
	protoc \
		--go_out=./proto \
    	--go-grpc_out=./proto \
		--go-grpc_opt=paths=source_relative \
    	--proto_path=../../rust-metlo-agent/proto \
		--go_opt=paths=source_relative metloingest.proto