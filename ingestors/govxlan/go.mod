module github.com/metlo-labs/metlo/ingestors/govxlan

go 1.18

require (
	github.com/google/gopacket v1.1.19
	github.com/pkg/errors v0.9.1
	github.com/sirupsen/logrus v1.9.0
	github.com/urfave/cli v1.22.10
)

replace github.com/metlo-labs/metlo/ingestors/govxlan/pcap => ./pcap
replace github.com/metlo-labs/metlo/ingestors/govxlan/vxcap => ./vxcap


require (
	github.com/cpuguy83/go-md2man/v2 v2.0.0-20190314233015-f79a8a8ca69d // indirect
	github.com/joho/godotenv v1.4.0 // indirect
	github.com/russross/blackfriday/v2 v2.0.1 // indirect
	github.com/shurcooL/sanitized_anchor_name v1.0.0 // indirect
	golang.org/x/sys v0.0.0-20220715151400-c0bba94af5f8 // indirect
)
