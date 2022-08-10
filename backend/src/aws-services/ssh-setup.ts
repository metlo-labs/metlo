import { NodeSSH, SSHPutFilesOptions } from "node-ssh";

async function create_ssh_connection(private_key, host) {
  const ssh = new NodeSSH();
  console.log(private_key);
  let buff = Buffer.from(private_key, "utf-8");
  let conn = await ssh.connect({
    host: host,
    username: "ubuntu",
    privateKey: private_key,
  });
  return conn;
}

async function test_connection(client: NodeSSH): Promise<[boolean, string]> {
  let resp = await client.execCommand("lsb_release -i");
  if (resp.stdout !== "" && resp.stderr === "") {
    return [true, ""];
  } else return [false, resp.stderr];
}

async function install_suricata(client: NodeSSH) {
  console.log(process.cwd());
  await client.putFiles([
    { local: "./src/aws-services/scripts/install.sh", remote: "install.sh" },
    {
      local: "./src/aws-services/scripts/local.rules",
      remote: "local.rules",
    },
    {
      local: "./src/aws-services/scripts/metlo-ingestor.service",
      remote: "metlo-ingestor.service",
    },
    {
      local: "./src/aws-services/scripts/suricata.yaml",
      remote: "suricata.yaml",
    },
  ]);
  // let resp1  = await client.putFiles(files:[{local:"",remote:""}],{})
  let resp = await client.execCommand(
    "cd ~ && chmod +x install.sh && ./install.sh"
  );
  if (resp.stderr === "") {
    return [true, ""];
  } else return [false, resp.stderr];
}
