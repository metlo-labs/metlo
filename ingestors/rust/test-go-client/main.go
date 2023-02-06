package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	pb "test-rust.metlo.com/proto"
)

func main() {
	flag.Parse()
	// Set up a connection to the server.
	conn, err := grpc.Dial("unix:///tmp/foo/test.sock", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("did not connect: %v", err)
	}
	defer conn.Close()
	c := pb.NewMetloIngestClient(conn)

	// Contact the server and print out its response.
	ctx, cancel := context.WithTimeout(context.Background(), time.Hour)
	defer cancel()

	req_body := `[
		{ "foo": "bar", "baz": 1, "asdf": [ 1, 2, 3, 4, 5, "363 Wade Vista Avilaborough, NH 05861", { "foo": "127.0.0.1"} ] },
		{ "foo": "bar", "baz": 1, "asdf": [ 1, 2, 3, 4, 5, "asdf", { "foo": "127.0.0.1"} ] },
		{ "foo": "bar", "baz": 1, "asdf": [ 1, 2, 3, 4, 5, "asdf", { "foo": "127.0.0.1"} ] },
		{ "foo": "bar", "baz": 1, "asdf": [ 1, 2, 3, 4, 5, "asdf", { "foo": "127.0.0.1"} ] },
		{ "foo": "bar", "baz": 1, "asdf": [ 1, 2, 3, 4, 5, "asdf", { "foo": "127.0.0.1"} ] },
		{ "foo": "bar", "baz": 1, "asdf": [ 1, 2, 3, 4, 5, "asdf", { "foo": "127.0.0.1"} ] },
		{ "foo": "bar", "baz": 1, "asdf": [ 1, 2, 3, 4, 5, "asdf", { "foo": "127.0.0.1"} ] },
		{ "foo": "bar", "baz": 1, "asdf": [ 1, 2, 3, 4, 5, "asdf", { "foo": "127.0.0.1"} ] },
		{ "foo": "bar", "baz": 1, "asdf": [ 1, 2, 3, 4, 5, "asdf", { "foo": "127.0.0.1"} ] },
		{ "foo": "bar", "baz": 1, "asdf": [ 1, 2, 3, 4, 5, "asdf", { "foo": "127.0.0.1"} ] },
		{ "foo": "bar", "baz": 1, "asdf": [ 1, 2, 3, 4, 5, "asdf", { "foo": "127.0.0.1"} ] },
		{ "foo": "bar", "baz": 1, "asdf": [ 1, 2, 3, 4, 5, "asdf", { "foo": "127.0.0.1"} ] },
		{ "foo": "bar", "baz": 1, "asdf": [ 1, 2, 3, 4, 5, "asdf", { "foo": "127.0.0.1"} ] },
		{ "foo": "bar", "baz": 1, "asdf": [ 1, 2, 3, 4, 5, "asdf", { "foo": "127.0.0.1"} ] },
		{ "foo": "bar", "baz": 1, "asdf": [ 1, 2, 3, 4, 5, "asdf", { "foo": "127.0.0.1"} ] },
		{ "foo": "bar", "baz": 1, "asdf": [ 1, 2, 3, 4, 5, "asdf", { "foo": "127.0.0.1"} ] },
		{ "foo": "bar", "baz": 1, "asdf": [ 1, 2, 3, 4, 5, "asdf", { "foo": "127.0.0.1"} ] },
		{ "foo": "bar", "baz": 1, "asdf": [ 1, 2, 3, 4, 5, "asdf", { "foo": "127.0.0.1"} ] },
		{ "foo": "bar", "baz": 1, "asdf": [ 1, 2, 3, 4, 5, "asdf", { "foo": "127.0.0.1"} ] },
		{ "foo": "bar", "baz": 1, "asdf": [ 1, 2, 3, 4, 5, "asdf", { "foo": "127.0.0.1"} ] },
		{ "foo": "bar", "baz": 1, "asdf": [ 1, 2, 3, 4, 5, "asdf", { "foo": "127.0.0.1"} ] },
		{ "foo": "bar", "baz": 1, "asdf": [ 1, 2, 3, 4, 5, "asdf", { "foo": "127.0.0.1"} ] },
		{ "foo": "bar", "baz": 1, "asdf": [ 1, 2, 3, 4, 5, "asdf", { "foo": "127.0.0.1"} ] },
		{ "foo": "bar", "baz": 1, "asdf": [ 1, 2, 3, 4, 5, "asdf", { "foo": "127.0.0.1"} ] },
		{ "foo": "bar", "baz": 1, "asdf": [ 1, 2, 3, 4, 5, "asdf", { "foo": "127.0.0.1"} ] },
		{ "foo": "bar", "baz": 1, "asdf": [ 1, 2, 3, 4, 5, "asdf", { "foo": "127.0.0.1"} ] },
		{ "foo": "bar", "baz": 1, "asdf": [ 1, 2, 3, 4, 5, "asdf", { "foo": "127.0.0.1"} ] },
		{ "foo": "bar", "baz": 1, "asdf": [ 1, 2, 3, 4, 5, "asdf", { "foo": "127.0.0.1"} ] },
		{ "foo": "bar", "baz": 1, "asdf": [ 1, 2, 3, 4, 5, "asdf", { "foo": "127.0.0.1"} ] },
		{ "foo": "bar", "baz": 1, "asdf": [ 1, 2, 3, 4, 5, "3966 Darryl St West William, WV 80142", { "foo": "127.0.0.1"} ] }
	]`
	resp_body := `
		awefahweiofahwe8gia akshay@metlo.com fahweiulfhaweiufhaweiufhawiuefhawueifhaiwuefhaiuwefhaiuwegfauiwegfaiuwegfauiweg
		awefahweiofahwe8gia akshay@metlo.com fahweiulfhaweiufhaweiufhawiuefhawueifhaiwuefhaiuwefhaiuwegfauiwegfaiuwegfauiweg
		awefahweiofahwe8gia akshay@metlo.com fahweiulfhaweiufhaweiufhawiuefhawueifhaiwuefhaiuwefhaiuwegfauiwegfaiuwegfauiweg
		awefahweiofahwe8gia akshay@metlo.com fahweiulfhaweiufhaweiufhawiuefhawueifhaiwuefhaiuwefhaiuwegfauiwegfaiuwegfauiweg
		awefahweiofahwe8gia akshay@metlo.com fahweiulfhaweiufhaweiufhawiuefhawueifhaiwuefhaiuwefhaiuwegfauiwegfaiuwegfauiweg
		awefahweiofahwe8gia akshay@metlo.com fahweiulfhaweiufhaweiufhawiuefhawueifhaiwuefhaiuwefhaiuwegfauiwegfaiuwegfauiweg
		awefahweiofahwe8gia akshay@metlo.com fahweiulfhaweiufhaweiufhawiuefhawueifhaiwuefhaiuwefhaiuwegfauiwegfaiuwegfauiweg
		awefahweiofahwe8gia akshay@metlo.com fahweiulfhaweiufhaweiufhawiuefhawueifhaiwuefhaiuwefhaiuwegfauiwegfaiuwegfauiweg
		awefahweiofahwe8gia akshay@metlo.com fahweiulfhaweiufhaweiufhawiuefhawueifhaiwuefhaiuwefhaiuwegfauiwegfaiuwegfauiweg
		awefahweiofahwe8gia akshay@metlo.com fahweiulfhaweiufhaweiufhawiuefhawueifhaiwuefhaiuwefhaiuwegfauiwegfaiuwegfauiweg
		awefahweiofahwe8gia akshay@metlo.com fahweiulfhaweiufhaweiufhawiuefhawueifhaiwuefhaiuwefhaiuwegfauiwegfaiuwegfauiweg
		awefahweiofahwe8gia akshay@metlo.com fahweiulfhaweiufhaweiufhawiuefhawueifhaiwuefhaiuwefhaiuwegfauiwegfaiuwegfauiweg
		awefahweiofahwe8gia akshay@metlo.com fahweiulfhaweiufhaweiufhawiuefhawueifhaiwuefhaiuwefhaiuwegfauiwegfaiuwegfauiweg
		awefahweiofahwe8gia akshay@metlo.com fahweiulfhaweiufhaweiufhawiuefhawueifhaiwuefhaiuwefhaiuwegfauiwegfaiuwegfauiweg
		awefahweiofahwe8gia akshay@metlo.com fahweiulfhaweiufhaweiufhawiuefhawueifhaiwuefhaiuwefhaiuwegfauiwegfaiuwegfauiweg
		awefahweiofahwe8gia akshay@metlo.com fahweiulfhaweiufhaweiufhawiuefhawueifhaiwuefhaiuwefhaiuwegfauiwegfaiuwegfauiweg
		awefahweiofahwe8gia akshay@metlo.com fahweiulfhaweiufhaweiufhawiuefhawueifhaiwuefhaiuwefhaiuwegfauiwegfaiuwegfauiweg
		awefahweiofahwe8gia akshay@metlo.com fahweiulfhaweiufhaweiufhawiuefhawueifhaiwuefhaiuwefhaiuwegfauiwegfaiuwegfauiweg
		awefahweiofahwe8gia akshay@metlo.com fahweiulfhaweiufhaweiufhawiuefhawueifhaiwuefhaiuwefhaiuwegfauiwegfaiuwegfauiweg
		awefahweiofahwe8gia akshay@metlo.com fahweiulfhaweiufhaweiufhawiuefhawueifhaiwuefhaiuwefhaiuwegfauiwegfaiuwegfauiweg
		awefahweiofahwe8gia akshay@metlo.com fahweiulfhaweiufhaweiufhawiuefhawueifhaiwuefhaiuwefhaiuwegfauiwegfaiuwegfauiweg
		awefahweiofahwe8gia akshay@metlo.com fahweiulfhaweiufhaweiufhawiuefhawueifhaiwuefhaiuwefhaiuwegfauiwegfaiuwegfauiweg
		awefahweiofahwe8gia akshay@metlo.com fahweiulfhaweiufhaweiufhawiuefhawueifhaiwuefhaiuwefhaiuwegfauiwegfaiuwegfauiweg
		awefahweiofahwe8gia akshay@metlo.com fahweiulfhaweiufhaweiufhawiuefhawueifhaiwuefhaiuwefhaiuwegfauiwegfaiuwegfauiweg
		awefahweiofahwe8gia akshay@metlo.com fahweiulfhaweiufhaweiufhawiuefhawueifhaiwuefhaiuwefhaiuwegfauiwegfaiuwegfauiweg
		awefahweiofahwe8gia akshay@metlo.com fahweiulfhaweiufhaweiufhawiuefhawueifhaiwuefhaiuwefhaiuwegfauiwegfaiuwegfauiweg
		awefahweiofahwe8gia akshay@metlo.com fahweiulfhaweiufhaweiufhawiuefhawueifhaiwuefhaiuwefhaiuwegfauiwegfaiuwegfauiweg
		awefahweiofahwe8gia akshay@metlo.com fahweiulfhaweiufhaweiufhawiuefhawueifhaiwuefhaiuwefhaiuwegfauiwegfaiuwegfauiweg
		awefahweiofahwe8gia akshay@metlo.com fahweiulfhaweiufhaweiufhawiuefhawueifhaiwuefhaiuwefhaiuwegfauiwegfaiuwegfauiweg
		awefahweiofahwe8gia akshay@metlo.com fahweiulfhaweiufhaweiufhawiuefhawueifhaiwuefhaiuwefhaiuwegfauiwegfaiuwegfauiweg
	`
	e := &pb.ApiTrace{
		Request: &pb.ApiRequest{
			Method: "GET",
			Url: &pb.ApiUrl{
				Host: "asdf",
				Path: "asdf",
				Parameters: []*pb.KeyVal{
					{
						Name:  "foo",
						Value: "<script></script>",
					},
				},
			},
			Body: &req_body,
			Headers: []*pb.KeyVal{
				{
					Name:  "content-type",
					Value: "application/json",
				},
				{
					Name:  "someemail",
					Value: "aksaw@metlo.com",
				},
			},
		},
		Response: &pb.ApiResponse{
			Status: 200,
			Body:   &resp_body,
			Headers: []*pb.KeyVal{
				{
					Name:  "auth",
					Value: "1234 1234 1234",
				},
				{
					Name:  "emailheader",
					Value: " akshay@metlo.com ",
				},
			},
		},
	}

	resp, err := c.ProcessTrace(ctx, e)
	if err != nil {
		fmt.Println(err)
		fmt.Println("saw error")
		return
	}

	fmt.Println("block           ", resp.Block)
	for k, v := range resp.DataTypes {
		fmt.Println("data-type       ", k, v.RepString)
	}
	for k, v := range resp.SensitiveDataDetected {
		fmt.Println("sensitive-data  ", k, v.RepString)
	}
	for k, v := range resp.SqliDetected {
		fmt.Println("sqli            ", k, v.Fingerprint, v.Data)
	}
	for k, v := range resp.XssDetected {
		fmt.Println("xss             ", k, v)
	}

	start := time.Now()
	num_err := 0
	for i := 1; i < 1000; i++ {
		_, err := c.ProcessTraceAsync(ctx, e)
		if err != nil {
			num_err++
		}
	}
	fmt.Println()
	fmt.Println(num_err, "errors")
	fmt.Println(time.Since(start))
}
