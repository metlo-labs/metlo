import { NodeSSH } from "node-ssh";
import { readFileSync, writeFileSync, openSync, unlinkSync } from "fs";
import { format as _format } from "util";
import retry from "async-retry";

export class SSH_CONN {
  private key: string;
  private host: string;
  private user: string;
  private conn: NodeSSH;

  constructor(private_key: string, host: string, user: string) {
    this.key = private_key;
    this.host = host;
    this.user = user;
  }

  public async get_conn(): Promise<NodeSSH> {
    if (this.conn && this.conn.isConnected()) {
      return this.conn;
    }
    const ssh = new NodeSSH();
    let conn = await ssh.connect({
      host: this.host,
      username: this.user,
      privateKey: this.key,
    });
    this.conn = conn;
    return this.conn;
  }

  public async test_connection(): Promise<[boolean, string]> {
    // Test if we can get release version of the OS. Should be compatible with all Linux based OS
    var resp, error;
    var idx = 0;
    try {
      resp = await (await this.get_conn()).execCommand("lsb_release -i");
    } catch (err) {
      error = err;
      if (err instanceof Error) {
        console.log(err);
        console.log("error in test_cmd");
      }
    }
    return [resp.stdout !== "" && resp.stderr === "", resp.stderr];
  }

  public async run_command(command: string) {
    var resp, error;
    resp = await retry(
      async (f, at) => {
        console.log(at);
        try {
          let resp = await (await this.get_conn()).execCommand(command);
        } catch (err) {
          console.log(err);
          console.log("error in run_cmd");
          throw err;
        }
        return resp;
      },
      { retries: 10 }
    );
    return resp;
  }

  public disconnect() {
    if (this.conn) {
      this.conn.dispose();
    }
  }

  public async putfiles(files: string[], locations: string[]) {
    let out_files = files.map((v, i) => {
      return { local: v, remote: locations[i] };
    });
    await retry(
      async () => {
        await (await this.get_conn()).putFiles(out_files);
      },
      { retries: 4 }
    );
  }
}

export async function put_data_file(data: string, location: string) {
  let fd = openSync(location, "w");
  writeFileSync(fd, data);
}

export async function remove_file(location: string) {
  try {
    unlinkSync(location);
  } catch (err) {
    // Ignore error. Not a major issue if filled template isn't removed
  }
}

export function format(filepath: string, attributes: string[]) {
  let str = readFileSync(filepath, "utf-8");
  return _format(str, ...attributes);
}
