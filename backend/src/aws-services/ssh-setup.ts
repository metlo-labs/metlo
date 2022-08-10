import { NodeSSH } from "node-ssh";
import { readFileSync, writeFileSync, openSync, unlinkSync } from "fs";
import { format as _format } from "util";
import { randomUUID } from "crypto";

export async function create_ssh_connection(private_key, host, username) {
  const ssh = new NodeSSH();
  let buff = Buffer.from(private_key, "utf-8");
  let conn = await ssh.connect({
    host: host,
    username: username,
    privateKey: private_key,
  });
  return conn;
}

export async function test_connection(
  client: NodeSSH
): Promise<[boolean, string]> {
  let resp = await client.execCommand("lsb_release -i");
  if (resp.stdout !== "" && resp.stderr === "") {
    return [true, ""];
  } else return [false, resp.stderr];
}

export async function run_command(client: NodeSSH, command: string) {
  let resp = await client.execCommand(command);
  console.log(resp.stdout);
  console.log(resp.stderr);
  return resp;
}

export async function put_data_file(data: string, location: string) {
  let fd = openSync(location, "w");
  writeFileSync(fd, data);
}

export async function remove_file(location: string) {
  unlinkSync(location);
}

export function format(filepath: string, attributes: string[]) {
  let str = readFileSync(filepath, "utf-8");
  return _format(str, ...attributes);
}

export async function putfiles(
  client: NodeSSH,
  files: string[],
  locations: string[]
) {
  let out_files = files.map((v, i) => {
    return { local: v, remote: locations[i] };
  });
  await client.putFiles(out_files);
}
