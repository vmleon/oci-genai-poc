#!/usr/bin/env zx
import moment from "moment";
import {
  setVariableFromEnvOrPrompt,
  writeEnvJson,
  readEnvJson,
} from "./lib/utils.mjs";
import {
  getLatestGenAIModels,
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
await setLatestGenAIModel();

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
    privateKeyPath: sshPathParam,
    publicKeyContent,
    publicKeyPath: `${sshPathParam}.pub`,
  };
  console.log(`SSH key pair created: ${chalk.green(sshPathParam)}`);
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

async function setLatestGenAIModel() {
  const latestVersionModel = await getLatestGenAIModels(
    properties.compartmentId,
    properties.regionName,
    "cohere",
    "TEXT_GENERATION"
  );

  const { id, vendor: vendorName, version, capabilities } = latestVersionModel;
  const displayName = latestVersionModel["display-name"];
  const timeCreated = moment(latestVersionModel["time-created"]).fromNow();
  console.log(
    `Using GenAI Model ${chalk.green(vendorName)}:${chalk.green(
      version
    )} (${chalk.green(displayName)}) with ${capabilities.join(
      ","
    )} created ${timeCreated}`
  );

  properties = {
    ...properties,
    genAiModel: id,
  };
  await writeEnvJson(properties);
}
