import path from "node:path"
import { AsyncResource } from "node:async_hooks"
import { EventEmitter } from "node:events"
import { Worker } from "node:worker_threads"
import { PostTraceTask } from "types"

const kTaskInfo = Symbol("kTaskInfo")
const kWorkerFreedEvent = Symbol("kWorkerFreedEvent")

type CallbackType = (err: Error, result: any) => void

interface Task {
  task: PostTraceTask
  callback: CallbackType
}

class WorkerPoolTaskInfo extends AsyncResource {
  callback?: CallbackType

  constructor(callback?: CallbackType) {
    super("WorkerPoolTaskInfo")
    this.callback = callback
  }

  done(err: Error, result: any) {
    if (this.callback) {
      this.runInAsyncScope(this.callback, null, err, result)
    }
    this.emitDestroy()
  }
}

class WorkerPool extends EventEmitter {
  numThreads: number
  workers: Worker[]
  freeWorkers: Worker[]
  tasks: Task[]
  workerFileName: string

  constructor(numThreads: number, fileName: string) {
    super()
    this.numThreads = numThreads
    this.workers = []
    this.freeWorkers = []
    this.tasks = []
    this.workerFileName = fileName

    for (let i = 0; i < numThreads; i++) this.addNewWorker()

    // Any time the kWorkerFreedEvent is emitted, dispatch
    // the next task pending in the queue, if any.
    this.on(kWorkerFreedEvent, () => {
      if (this.tasks.length > 0) {
        const { task, callback } = this.tasks.shift()
        this.runTask(task, callback)
      }
    })
  }

  addNewWorker() {
    const worker = new Worker(path.resolve(__dirname, this.workerFileName))
    worker.on("message", result => {
      // In case of success: Call the callback that was passed to `runTask`,
      // remove the `TaskInfo` associated with the Worker, and mark it as free
      // again.
      worker[kTaskInfo].done(null, result)
      worker[kTaskInfo] = null
      this.freeWorkers.push(worker)
      this.emit(kWorkerFreedEvent)
    })
    worker.on("error", err => {
      // In case of an uncaught exception: Call the callback that was passed to
      // `runTask` with the error.
      if (worker[kTaskInfo]) {
        console.warn(err)
        try {
          worker[kTaskInfo].done(err, null)
        } catch (err) {
          //pass
        }
      } else {
        this.emit("error", err)
      }
      // Remove the worker from the list and start a new Worker to replace the
      // current one.
      this.workers.splice(this.workers.indexOf(worker), 1)
      this.addNewWorker()
    })
    this.workers.push(worker)
    this.freeWorkers.push(worker)
    this.emit(kWorkerFreedEvent)
  }

  runTask(task: PostTraceTask, callback?: CallbackType) {
    if (this.freeWorkers.length === 0) {
      // No free threads, wait until a worker thread becomes free.
      this.tasks.push({ task, callback })
      return
    }
    const worker = this.freeWorkers.pop()
    worker[kTaskInfo] = new WorkerPoolTaskInfo(callback)
    worker.postMessage(task)
  }

  close() {
    for (const worker of this.workers) worker.terminate()
  }
}

export default WorkerPool
