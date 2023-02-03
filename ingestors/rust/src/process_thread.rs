use crate::{
    process_trace::process_trace,
    trace::{ApiTrace, ProcessTraceRes},
};
use lazy_static::lazy_static;
use std::{
    panic::{catch_unwind, AssertUnwindSafe},
    thread, time,
};
use tokio::{
    runtime,
    sync::mpsc::{channel, Receiver, Sender},
};

lazy_static! {
    pub static ref SEND_CHANNEL: Sender<(ApiTrace, Option<ProcessTraceRes>)> = {
        let (send, recv) = channel(100);
        thread::spawn(|| main(recv));
        send
    };
}

async fn main_loop(recv: &mut Receiver<(ApiTrace, Option<ProcessTraceRes>)>) {
    let (trace, process_results) = recv.recv().await.expect("Send Channel is Closed...");
    let process_results = process_results.unwrap_or_else(|| process_trace(&trace));
}

fn main(mut recv: Receiver<(ApiTrace, Option<ProcessTraceRes>)>) -> ! {
    let runtime = runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .expect("Failed to create tokio runtime");

    loop {
        let result = catch_unwind(AssertUnwindSafe(|| -> ! {
            runtime.block_on(async {
                loop {
                    main_loop(&mut recv).await
                }
            })
        }));
        println!("Runtime exited...");
        if let Err(err) = result {
            println!("{:?}", err);
        }
        println!("Sleeping 5 seconds.");
        thread::sleep(time::Duration::from_secs(5))
    }
}
