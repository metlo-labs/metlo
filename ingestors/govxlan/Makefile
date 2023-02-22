build:
	cp ../rust-common/proto/metloingest.proto proto
	protoc --go_out=. --go_opt=paths=source_relative --go-grpc_out=. --go-grpc_opt=paths=source_relative ./proto/metloingest.proto
	rm proto/metloingest.proto
	go build -o metlo-pcap