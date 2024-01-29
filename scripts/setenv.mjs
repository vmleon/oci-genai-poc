#!/usr/bin/env zx

import Mustache from "mustache";
import {
  setVariableFromEnvOrPrompt,
  writeEnvJson,
  readEnvJson,
  exitWithError,
} from "./lib/utils.mjs";
import {
  getNamespace,
  getRegions,
  getTenancyId,
  searchCompartmentIdByName,
} from "./lib/oci.mjs";
import { createSSHKeyPair, createSelfSignedCert } from "./lib/crypto.mjs";

const shell = process.env.SHELL | "/bin/zsh";
$.shell = shell;
$.verbose = false;

let properties = await readEnvJson();

await setTenancyEnv();
await setNamespaceEnv();
await setRegionEnv();
await setCompartmentEnv();
await createSSHKeys("genai");
await createCerts();

async function setTenancyEnv() {
  const tenancyId = await getTenancyId();
  properties = { ...properties, tenancyId };
  await writeEnvJson(properties);
}

async function setNamespaceEnv() {
  const namespace = await getNamespace();
  properties = { ...properties, namespace };
  await writeEnvJson(properties);
}

async function setRegionEnv() {
  const regions = await getRegions();
  const regionNameValue = await setVariableFromEnvOrPrompt(
    "OCI_REGION",
    "OCI Region name",
    async () => printRegionNames(regions)
  );
  const { key: regionKey, name: regionName } = regions.find(
    (r) => r.name === regionNameValue
  );
  properties = { ...properties, regionName, regionKey };
  await writeEnvJson(properties);
}

async function setCompartmentEnv() {
  const compartmentName = await setVariableFromEnvOrPrompt(
    "COMPARTMENT_NAME",
    "Compartment Name (root)"
  );

  const compartmentId = await searchCompartmentIdByName(
    compartmentName || "root"
  );
  properties = { ...properties, compartmentName, compartmentId };
  await writeEnvJson(properties);
}

async function printRegionNames(regions) {
  const regionNames = regions.map((r) => r.name);
  const zones = [...new Set(regionNames.map((name) => name.split("-")[0]))];
  const regionsByZone = regions.reduce((acc, cur) => {
    const zone = cur.name.split("-")[0];
    if (acc[zone]) {
      acc[zone].push(cur.name);
    } else {
      acc[zone] = [cur.name];
    }
    return acc;
  }, {});
  Object.keys(regionsByZone).forEach((zone) =>
    console.log(`\t${chalk.yellow(zone)}: ${regionsByZone[zone].join(", ")}`)
  );
}

async function createSSHKeys(name) {
  const sshPathParam = path.join(os.homedir(), ".ssh", name);
  const publicKeyContent = await createSSHKeyPair(sshPathParam);
  properties = {
    ...properties,
    publicKeyContent,
    publicKeyPath: `${sshPathParam}.pub`,
  };
  await writeEnvJson(properties);
}

async function createCerts() {
  const certPath = path.join(__dirname, "..", ".certs");
  await $`mkdir -p ${certPath}`;
  await createSelfSignedCert(certPath);
  properties = {
    ...properties,
    certFullchain: path.join(certPath, "tls.crt"),
    certPrivateKey: path.join(certPath, "tls.key"),
  };
  await writeEnvJson(properties);
}

async function generateTFVars() {
  const {
    compartmentId,
    compartmentName,
    regionName,
    tenancyId,
    publicKeyContent,
    certFullchain,
    certPrivateKey,
  } = await readEnvJson();
  const tfVarsPath = "deployment/terraform/terraform.tfvars";

  const tfvarsTemplate = await fs.readFile(`${tfVarsPath}.mustache`, "utf-8");

  const output = Mustache.render(tfvarsTemplate, {
    tenancyId,
    regionName,
    compartmentId,
    ssh_public_key: publicKeyContent,
    cert_fullchain: certFullchain,
    cert_private_key: certPrivateKey,
  });

  console.log(
    `Terraform will deploy resources in ${chalk.green(
      regionName
    )} in compartment ${
      compartmentName ? chalk.green(compartmentName) : chalk.green("root")
    }`
  );

  await fs.writeFile(tfVarsPath, output);

  console.log(`File ${chalk.green(tfVarsPath)} created`);

  console.log(`1. ${chalk.yellow("cd deployment/terraform/")}`);
  console.log(`2. ${chalk.yellow("terraform init")}`);
  console.log(`3. ${chalk.yellow("terraform apply -auto-approve")}`);
}
